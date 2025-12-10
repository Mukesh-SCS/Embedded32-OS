/**
 * Runtime class - Core runtime orchestrator
 * 
 * Manages the lifecycle of all Embedded32 modules:
 * - Module registration and initialization
 * - Task scheduling
 * - Inter-module messaging
 * - Configuration management
 */

import { Logger } from './logger';
import { Scheduler } from './scheduler';
import { MessageBus } from './messaging';
import { ModuleRegistry } from './registry';
import { ConfigLoader } from './config';
import { RuntimeConfig, Module } from './types';

export class Runtime {
  private logger: Logger;
  private scheduler: Scheduler;
  private messageBus: MessageBus;
  private registry: ModuleRegistry;
  private config: RuntimeConfig;
  private running: boolean = false;

  constructor(config?: Partial<RuntimeConfig>) {
    this.config = {
      logLevel: config?.logLevel || 'info',
      configPath: config?.configPath || './config.json',
      enableMetrics: config?.enableMetrics || false,
    };

    // Initialize core subsystems
    this.logger = new Logger(this.config.logLevel);
    this.scheduler = new Scheduler();
    this.messageBus = new MessageBus();
    this.registry = new ModuleRegistry();

    this.logger.info('Embedded32 Runtime initialized');
  }

  /**
   * Register a module with the runtime
   */
  registerModule(module: Module): void {
    this.logger.info(`Registering module: ${module.name}`);
    this.registry.register(module);
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    this.logger.info('Starting Embedded32 Runtime...');
    
    // Load configuration
    if (this.config.configPath) {
      const configLoader = new ConfigLoader();
      await configLoader.load(this.config.configPath);
    }

    // Initialize all registered modules
    await this.registry.initializeAll();

    // Start scheduler
    this.scheduler.start();
    this.running = true;

    this.logger.info('Runtime started successfully');
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping Embedded32 Runtime...');
    
    this.scheduler.stop();
    await this.registry.shutdownAll();
    this.running = false;

    this.logger.info('Runtime stopped');
  }

  /**
   * Get the message bus instance
   */
  getMessageBus(): MessageBus {
    return this.messageBus;
  }

  /**
   * Get the scheduler instance
   */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * Check if runtime is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
