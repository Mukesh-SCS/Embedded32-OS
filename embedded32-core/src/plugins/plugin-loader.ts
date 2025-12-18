/**
 * Embedded32 - Plugin Loader
 * 
 * Loads and manages ECU plugins according to the v1 contract.
 * Plugins are sandboxed to only use PluginContext methods.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import type {
  ECUPlugin,
  PluginContext,
  PluginConfig,
  PluginFactory,
  PGNData,
  J1939Message
} from './plugin-interface';

/**
 * Plugin Loader - Manages ECU plugin lifecycle
 */
export class PluginLoader extends EventEmitter {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private subscriptions: Map<number, Set<string>> = new Map(); // PGN -> plugin names
  
  constructor(private readonly basePath: string) {
    super();
  }

  /**
   * Load plugins from configuration
   */
  async loadPlugins(configs: PluginConfig[]): Promise<void> {
    for (const config of configs) {
      if (config.enabled === false) {
        console.log(`[PluginLoader] Skipping disabled plugin: ${config.name}`);
        continue;
      }
      
      try {
        await this.loadPlugin(config);
      } catch (error) {
        console.error(`[PluginLoader] Failed to load plugin ${config.name}:`, error);
      }
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(config: PluginConfig): Promise<void> {
    console.log(`[PluginLoader] Loading plugin: ${config.name}`);
    
    // Resolve plugin path
    const pluginPath = path.isAbsolute(config.path) 
      ? config.path 
      : path.join(this.basePath, config.path);
    
    // Import plugin module
    const module = await import(pluginPath);
    
    // Get factory function
    const factory: PluginFactory = module.default || module.createPlugin;
    if (typeof factory !== 'function') {
      throw new Error(`Plugin ${config.name} does not export a factory function`);
    }
    
    // Create plugin instance
    const plugin = factory(config.options);
    
    // Validate plugin interface
    this.validatePlugin(plugin);
    
    // Override source address from config
    const effectiveSA = config.sourceAddress ?? plugin.sourceAddress;
    
    // Create sandboxed context
    const context = this.createContext(config.name, effectiveSA);
    
    // Store loaded plugin
    this.plugins.set(config.name, {
      plugin,
      config,
      context,
      sourceAddress: effectiveSA
    });
    
    // Initialize plugin
    plugin.init(context);
    
    console.log(`[PluginLoader] Loaded plugin: ${config.name} (SA=0x${effectiveSA.toString(16).toUpperCase()})`);
  }

  /**
   * Create sandboxed context for a plugin
   */
  private createContext(pluginName: string, sourceAddress: number): PluginContext {
    return {
      sendPGN: (pgn: number, data: PGNData, destination?: number) => {
        this.emit('sendPGN', {
          plugin: pluginName,
          sourceAddress,
          pgn,
          data,
          destination: destination ?? 0xFF
        });
      },
      
      requestPGN: (pgn: number, destination?: number) => {
        this.emit('requestPGN', {
          plugin: pluginName,
          sourceAddress,
          pgn,
          destination: destination ?? 0xFF
        });
      },
      
      subscribePGN: (pgn: number) => {
        if (!this.subscriptions.has(pgn)) {
          this.subscriptions.set(pgn, new Set());
        }
        this.subscriptions.get(pgn)!.add(pluginName);
      },
      
      getTime: () => Date.now()
    };
  }

  /**
   * Validate plugin implements required interface
   */
  private validatePlugin(plugin: ECUPlugin): void {
    const required = ['name', 'version', 'sourceAddress', 'init', 'shutdown', 'onTick', 'onPGN'];
    
    for (const prop of required) {
      if (!(prop in plugin)) {
        throw new Error(`Plugin missing required property: ${prop}`);
      }
    }
    
    if (typeof plugin.init !== 'function') {
      throw new Error('Plugin.init must be a function');
    }
    if (typeof plugin.shutdown !== 'function') {
      throw new Error('Plugin.shutdown must be a function');
    }
    if (typeof plugin.onTick !== 'function') {
      throw new Error('Plugin.onTick must be a function');
    }
    if (typeof plugin.onPGN !== 'function') {
      throw new Error('Plugin.onPGN must be a function');
    }
  }

  /**
   * Tick all plugins
   */
  tick(now: number): void {
    for (const [name, loaded] of this.plugins) {
      try {
        loaded.plugin.onTick(now);
      } catch (error) {
        console.error(`[PluginLoader] Plugin ${name} tick error:`, error);
      }
    }
  }

  /**
   * Dispatch incoming message to subscribed plugins
   */
  dispatchMessage(message: J1939Message): void {
    const subscribers = this.subscriptions.get(message.pgn);
    if (!subscribers) return;
    
    for (const pluginName of subscribers) {
      const loaded = this.plugins.get(pluginName);
      if (!loaded) continue;
      
      try {
        loaded.plugin.onPGN(message);
      } catch (error) {
        console.error(`[PluginLoader] Plugin ${pluginName} onPGN error:`, error);
      }
    }
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    console.log('[PluginLoader] Shutting down plugins...');
    
    for (const [name, loaded] of this.plugins) {
      try {
        loaded.plugin.shutdown();
        console.log(`[PluginLoader] Shutdown plugin: ${name}`);
      } catch (error) {
        console.error(`[PluginLoader] Plugin ${name} shutdown error:`, error);
      }
    }
    
    this.plugins.clear();
    this.subscriptions.clear();
  }

  /**
   * Get loaded plugin count
   */
  getPluginCount(): number {
    return this.plugins.size;
  }

  /**
   * Get list of loaded plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
}

/**
 * Internal loaded plugin structure
 */
interface LoadedPlugin {
  plugin: ECUPlugin;
  config: PluginConfig;
  context: PluginContext;
  sourceAddress: number;
}
