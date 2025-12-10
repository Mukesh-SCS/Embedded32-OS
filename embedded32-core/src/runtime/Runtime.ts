import { Logger } from "../logger/Logger.js";
import { Scheduler } from "../scheduler/Scheduler.js";
import { MessageBus } from "../messaging/MessageBus.js";
import { ModuleRegistry } from "../registry/ModuleRegistry.js";
import { ConfigLoader } from "../config/ConfigLoader.js";
import { RuntimeConfig, Module } from "../types.js";

export class Runtime {
  private logger: Logger;
  private scheduler: Scheduler;
  private bus: MessageBus;
  private registry: ModuleRegistry;
  private config: any;
  private running = false;

  constructor(options: Partial<RuntimeConfig> = {}) {
    this.logger = new Logger(options.logLevel || "info");
    this.scheduler = new Scheduler();
    this.bus = new MessageBus();
    this.registry = new ModuleRegistry();

    const loader = new ConfigLoader();
    this.config = loader.load(options.configPath || "./config.json");
  }

  registerModule(module: Module) {
    this.logger.info(`Registering module: ${module.name}`);

    module.bind({
      logger: this.logger,
      bus: this.bus,
      scheduler: this.scheduler,
      config: this.config,
    });

    this.registry.register(module);
  }

  async start() {
    this.logger.info("Runtime initializing...");
    await this.registry.initAll();

    this.logger.info("Starting modules...");
    await this.registry.startAll();

    this.running = true;
    this.logger.info("Runtime started.");
  }

  async stop() {
    if (!this.running) return;

    this.logger.info("Stopping runtime...");
    await this.registry.stopAll();

    this.scheduler.stopAll();
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  getMessageBus() {
    return this.bus;
  }

  getScheduler() {
    return this.scheduler;
  }

  getLogger() {
    return this.logger;
  }

  getConfig() {
    return this.config;
  }
}
