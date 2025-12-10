import { Module } from "../types.js";

export class ModuleRegistry {
  private modules = new Map<string, Module>();

  register(module: Module) {
    if (this.modules.has(module.name)) {
      throw new Error(`Module '${module.name}' already registered`);
    }
    this.modules.set(module.name, module);
  }

  getAll() {
    return Array.from(this.modules.values());
  }

  async initAll() {
    for (const module of this.getAll()) {
      await module.onInit();
    }
  }

  async startAll() {
    for (const module of this.getAll()) {
      await module.onStart();
    }
  }

  async stopAll() {
    for (const module of this.getAll()) {
      await module.onStop();
    }
  }
}
