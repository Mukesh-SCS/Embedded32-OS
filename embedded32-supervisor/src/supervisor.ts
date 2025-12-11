import { RuntimeConfig, ModuleState, HealthStatus, Module, ModuleInfo } from './types';
import { ModuleLoader } from './module-loader';
import { RuntimeEventBus } from './events';
import { Logger } from './logger';

/**
 * Central supervisor managing the entire Embedded32 runtime
 * 
 * Responsibilities:
 * - Load and manage modules
 * - Handle module lifecycle (start, stop, restart)
 * - Monitor module health
 * - Manage configuration
 * - Emit runtime events
 * - Handle graceful shutdown
 */
export class Supervisor {
  private config: RuntimeConfig;
  private moduleLoader: ModuleLoader;
  private eventBus: RuntimeEventBus;
  private logger: Logger;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: RuntimeConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger(config.logging?.level || 'info');
    this.moduleLoader = new ModuleLoader(this.logger);
    this.eventBus = new RuntimeEventBus();

    this.setupEventHandlers();
  }

  /**
   * Start the supervisor and all enabled modules
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Supervisor already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    try {
      this.logger.info('🚀 Starting Embedded32 Supervisor');
      this.eventBus.emitSupervisorStarted({ config: this.config });

      // Start modules in priority order (highest first)
      await this.startAllModules();

      // Start health check
      this.startHealthCheck();

      this.logger.info('✅ Supervisor started successfully');
    } catch (error) {
      this.isRunning = false;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Supervisor startup failed', err);
      throw err;
    }
  }

  /**
   * Stop the supervisor and all modules
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Supervisor not running');
      return;
    }

    this.isRunning = false;

    try {
      this.logger.info('🛑 Stopping Embedded32 Supervisor');

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      await this.stopAllModules();

      this.eventBus.emitSupervisorStopped({ uptime: Date.now() - this.startTime });
      this.logger.info('✅ Supervisor stopped');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Supervisor shutdown failed', err);
      throw err;
    }
  }

  /**
   * Register a module with the supervisor
   */
  registerModule(module: Module): void {
    this.moduleLoader.registerModule(module, {
      name: module.name,
      enabled: true,
      priority: 50,
      restartPolicy: 'on-failure',
      maxRestarts: 5
    });
  }

  /**
   * Start a specific module
   */
  async startModule(moduleId: string): Promise<void> {
    await this.moduleLoader.startModule(moduleId);
  }

  /**
   * Stop a specific module
   */
  async stopModule(moduleId: string): Promise<void> {
    await this.moduleLoader.stopModule(moduleId);
  }

  /**
   * Restart a specific module
   */
  async restartModule(moduleId: string): Promise<void> {
    await this.moduleLoader.restartModule(moduleId);
  }

  /**
   * Get health status of the runtime
   */
  getHealthStatus(): HealthStatus {
    const modules = this.moduleLoader.getAllModuleInfo();
    const moduleStatuses: { [key: string]: any } = {};

    for (const moduleInfo of modules) {
      moduleStatuses[moduleInfo.id] = {
        state: moduleInfo.state,
        uptime: moduleInfo.uptime,
        restarts: moduleInfo.restartCount
      };
    }

    return {
      healthy: this.isRunning && modules.every(m => m.state === ModuleState.RUNNING),
      modules: moduleStatuses,
      timestamp: Date.now(),
      systemUptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Get all module information
   */
  getModuleInfo(): ModuleInfo[] {
    return this.moduleLoader.getAllModuleInfo();
  }

  /**
   * Get event bus for listening to runtime events
   */
  getEventBus(): RuntimeEventBus {
    return this.eventBus;
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get config
   */
  getConfig(): RuntimeConfig {
    return this.config;
  }

  /**
   * Check if supervisor is running
   */
  isRunningFlag(): boolean {
    return this.isRunning;
  }

  /**
   * Start all enabled modules
   */
  private async startAllModules(): Promise<void> {
    const modules = this.moduleLoader.getModules();

    // Sort by priority (higher first)
    const sortedModules = modules.sort((a, b) => {
      const aPriority = (a as any).priority || 50;
      const bPriority = (b as any).priority || 50;
      return bPriority - aPriority;
    });

    for (const module of sortedModules) {
      try {
        await this.moduleLoader.startModule(module.id);
      } catch (error) {
        this.logger.error(`Failed to start module: ${module.name}`, error);
        // Continue starting other modules
      }
    }
  }

  /**
   * Stop all running modules
   */
  private async stopAllModules(): Promise<void> {
    const modules = this.moduleLoader.getModules();

    // Reverse priority order (lower first)
    const sortedModules = modules.sort((a, b) => {
      const aPriority = (a as any).priority || 50;
      const bPriority = (b as any).priority || 50;
      return aPriority - bPriority;
    });

    for (const module of sortedModules) {
      try {
        if (this.moduleLoader.isRunning(module.id)) {
          await this.moduleLoader.stopModule(module.id);
        }
      } catch (error) {
        this.logger.error(`Failed to stop module: ${module.name}`, error);
        // Continue stopping other modules
      }
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getHealthStatus();
      this.eventBus.emitHealthCheck(health as unknown as Record<string, unknown>);

      // Check for failed modules and restart if needed
      for (const [moduleId, status] of Object.entries(health.modules)) {
        if (status.state === ModuleState.ERROR) {
          this.logger.warn(`Module in ERROR state, attempting restart: ${moduleId}`);
          this.restartModule(moduleId).catch(err =>
            this.logger.error(`Failed to restart module: ${moduleId}`, err)
          );
        }
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.eventBus.on('module-started', (data: any) => {
      this.logger.info(`Module started: ${data.moduleId}`);
    });

    this.eventBus.on('module-failed', (data: any) => {
      this.logger.error(`Module failed: ${data.moduleId}`, new Error(data.error));
    });
  }
}

export { ModuleState };
