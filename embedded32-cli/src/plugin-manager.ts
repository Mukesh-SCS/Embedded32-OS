import { Supervisor, Module, ModuleState } from '@embedded32/supervisor';
import { RuntimeConfig } from '@embedded32/supervisor';
import { Logger } from '@embedded32/supervisor';

/**
 * Plugin-based module system for extensibility
 */
export class PluginManager {
  private plugins: Map<string, ModuleFactory> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.registerBuiltins();
  }

  /**
   * Register a module factory
   */
  registerPlugin(name: string, factory: ModuleFactory): void {
    this.plugins.set(name, factory);
    this.logger.info(`Plugin registered: ${name}`);
  }

  /**
   * Create module from plugin
   */
  createModule(name: string, config: RuntimeConfig): Module {
    const factory = this.plugins.get(name);
    if (!factory) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return factory(config);
  }

  /**
   * List available plugins
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Register built-in modules
   */
  private registerBuiltins(): void {
    // CAN module
    this.registerPlugin('can', (config: RuntimeConfig) => ({
      id: 'can',
      name: 'CAN Bus',
      version: '0.1.0',
      start: async () => {
        this.logger.info('CAN Bus module starting...');
        // Initialize CAN interface
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('CAN Bus module stopping...');
      },
      getStatus: () => ({
        id: 'can',
        name: 'CAN Bus',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'can', enabled: true, priority: 100, restartPolicy: 'always', maxRestarts: 5 }
      })
    }));

    // J1939 module
    this.registerPlugin('j1939', (config: RuntimeConfig) => ({
      id: 'j1939',
      name: 'J1939 Decoder',
      version: '0.1.0',
      start: async () => {
        this.logger.info('J1939 module starting...');
        await new Promise(r => setTimeout(r, 50));
      },
      stop: async () => {
        this.logger.info('J1939 module stopping...');
      },
      getStatus: () => ({
        id: 'j1939',
        name: 'J1939 Decoder',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'j1939', enabled: true, priority: 90, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Ethernet module
    this.registerPlugin('ethernet', (config: RuntimeConfig) => ({
      id: 'ethernet',
      name: 'Ethernet Transport',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Ethernet module starting...');
        if (config.ethernet?.udp?.enabled) {
          this.logger.info(`  → UDP server on port ${config.ethernet.udp.port}`);
        }
        if (config.ethernet?.tcp?.enabled) {
          this.logger.info(`  → TCP server on port ${config.ethernet.tcp.port}`);
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Ethernet module stopping...');
      },
      getStatus: () => ({
        id: 'ethernet',
        name: 'Ethernet Transport',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'ethernet', enabled: true, priority: 80, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Bridge module
    this.registerPlugin('bridge', (config: RuntimeConfig) => ({
      id: 'bridge',
      name: 'Message Bridge',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Bridge module starting...');
        if (config.bridge?.canEthernet?.enabled) {
          this.logger.info('  → CAN ↔ Ethernet bridge active');
        }
        if (config.bridge?.canMqtt?.enabled) {
          this.logger.info('  → CAN ↔ MQTT bridge active');
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Bridge module stopping...');
      },
      getStatus: () => ({
        id: 'bridge',
        name: 'Message Bridge',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'bridge', enabled: true, priority: 70, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Dashboard module
    this.registerPlugin('dashboard', (config: RuntimeConfig) => ({
      id: 'dashboard',
      name: 'Web Dashboard',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Dashboard module starting...');
        if (config.dashboard?.enabled) {
          this.logger.info(`  → Server on http://${config.dashboard.host || 'localhost'}:${config.dashboard.port}`);
        }
        await new Promise(r => setTimeout(r, 150));
      },
      stop: async () => {
        this.logger.info('Dashboard module stopping...');
      },
      getStatus: () => ({
        id: 'dashboard',
        name: 'Web Dashboard',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'dashboard', enabled: true, priority: 60, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Simulator module
    this.registerPlugin('simulator', (config: RuntimeConfig) => ({
      id: 'simulator',
      name: 'CAN Simulator',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Simulator module starting...');
        const enabled = [];
        if (config.simulator?.engine) enabled.push('Engine');
        if (config.simulator?.transmission) enabled.push('Transmission');
        if (config.simulator?.brakes) enabled.push('Brakes');
        if (enabled.length > 0) {
          this.logger.info(`  → Simulating: ${enabled.join(', ')}`);
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Simulator module stopping...');
      },
      getStatus: () => ({
        id: 'simulator',
        name: 'CAN Simulator',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'simulator', enabled: true, priority: 50, restartPolicy: 'always', maxRestarts: 5 }
      })
    }));

    this.logger.debug('Built-in plugins registered');
  }
}

export type ModuleFactory = (config: RuntimeConfig) => Module;
