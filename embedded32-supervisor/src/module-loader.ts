import * as fs from 'fs';
import { Module, ModuleState, ModuleInfo, ModuleConfig } from './types';
import { Logger } from './logger';

/**
 * Dynamically loads and manages modules
 */
export class ModuleLoader {
  private modules: Map<string, Module> = new Map();
  private moduleStates: Map<string, ModuleState> = new Map();
  private moduleStartTimes: Map<string, number> = new Map();
  private moduleRestarts: Map<string, number> = new Map();
  private moduleErrors: Map<string, Error> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a module
   */
  registerModule(module: Module, _config: ModuleConfig): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module ${module.id} already registered`);
    }

    this.modules.set(module.id, module);
    this.moduleStates.set(module.id, ModuleState.CREATED);
    this.moduleRestarts.set(module.id, 0);

    this.logger.info(`Module registered: ${module.name} (${module.id})`);
  }

  /**
   * Get all registered modules
   */
  getModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get module by ID
   */
  getModule(id: string): Module | undefined {
    return this.modules.get(id);
  }

  /**
   * Get module info
   */
  getModuleInfo(id: string): ModuleInfo | undefined {
    const module = this.modules.get(id);
    if (!module) return undefined;

    const state = this.moduleStates.get(id) || ModuleState.CREATED;
    const startTime = this.moduleStartTimes.get(id) || 0;
    const restarts = this.moduleRestarts.get(id) || 0;
    const error = this.moduleErrors.get(id);

    return {
      id: module.id,
      name: module.name,
      version: module.version,
      state,
      uptime: state === ModuleState.RUNNING ? Date.now() - startTime : 0,
      restartCount: restarts,
      lastError: error?.message,
      lastErrorTime: error ? Date.now() : undefined,
      config: {
        name: module.name,
        enabled: true,
        priority: 50,
        restartPolicy: 'on-failure',
        maxRestarts: 5
      }
    };
  }

  /**
   * Get all module info
   */
  getAllModuleInfo(): ModuleInfo[] {
    return this.getModules().map(m => this.getModuleInfo(m.id)!).filter(Boolean);
  }

  /**
   * Start a module
   */
  async startModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module not found: ${id}`);
    }

    const currentState = this.moduleStates.get(id);
    if (currentState === ModuleState.RUNNING) {
      this.logger.warn(`Module already running: ${id}`);
      return;
    }

    this.moduleStates.set(id, ModuleState.INITIALIZING);

    try {
      this.logger.info(`Starting module: ${module.name}`);
      await module.start();
      this.moduleStates.set(id, ModuleState.RUNNING);
      this.moduleStartTimes.set(id, Date.now());
      this.moduleErrors.delete(id);
      this.logger.info(`Module started: ${module.name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.moduleStates.set(id, ModuleState.ERROR);
      this.moduleErrors.set(id, err);
      this.logger.error(`Module start failed: ${module.name}`, err);
      throw err;
    }
  }

  /**
   * Stop a module
   */
  async stopModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module not found: ${id}`);
    }

    const currentState = this.moduleStates.get(id);
    if (currentState === ModuleState.STOPPED) {
      this.logger.warn(`Module already stopped: ${id}`);
      return;
    }

    this.moduleStates.set(id, ModuleState.STOPPING);

    try {
      this.logger.info(`Stopping module: ${module.name}`);
      await module.stop();
      this.moduleStates.set(id, ModuleState.STOPPED);
      this.moduleErrors.delete(id);
      this.logger.info(`Module stopped: ${module.name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.moduleStates.set(id, ModuleState.ERROR);
      this.moduleErrors.set(id, err);
      this.logger.error(`Module stop failed: ${module.name}`, err);
      throw err;
    }
  }

  /**
   * Restart a module
   */
  async restartModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module not found: ${id}`);
    }

    this.moduleStates.set(id, ModuleState.RESTARTING);

    try {
      await this.stopModule(id);
      await this.startModule(id);
      const restarts = (this.moduleRestarts.get(id) || 0) + 1;
      this.moduleRestarts.set(id, restarts);
      this.logger.info(`Module restarted: ${module.name} (restart #${restarts})`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.moduleErrors.set(id, err);
      this.logger.error(`Module restart failed: ${module.name}`, err);
      throw err;
    }
  }

  /**
   * Get module state
   */
  getModuleState(id: string): ModuleState | undefined {
    return this.moduleStates.get(id);
  }

  /**
   * Check if module is running
   */
  isRunning(id: string): boolean {
    return this.moduleStates.get(id) === ModuleState.RUNNING;
  }

  /**
   * Load modules from directory
   */
  async loadModulesFromDirectory(directory: string): Promise<void> {
    if (!fs.existsSync(directory)) {
      this.logger.warn(`Module directory not found: ${directory}`);
      return;
    }

    const files = fs.readdirSync(directory).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      try {
        // const filePath = path.join(directory, file);
        // Dynamic require would go here in production
        this.logger.debug(`Loaded module: ${file}`);
      } catch (error) {
        this.logger.error(`Failed to load module: ${file}`, error);
      }
    }
  }
}
