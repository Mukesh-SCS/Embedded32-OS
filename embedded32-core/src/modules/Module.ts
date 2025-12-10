import { Module, ModuleContext } from "../types.js";

export abstract class BaseModule implements Module {
  name: string;
  version: string;

  protected logger: any;
  protected bus: any;
  protected scheduler: any;
  protected config: any;

  constructor(name: string, version = "1.0.0") {
    this.name = name;
    this.version = version;
  }

  bind(context: ModuleContext) {
    this.logger = context.logger;
    this.bus = context.bus;
    this.scheduler = context.scheduler;
    this.config = context.config;
  }

  protected log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    if (this.logger) {
      this.logger[level](`[${this.name}] ${message}`);
    }
  }

  onInit(): Promise<void> | void {}
  onStart(): Promise<void> | void {}
  onStop(): Promise<void> | void {}
}
