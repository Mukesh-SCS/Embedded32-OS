/**
 * Module Registry
 * 
 * Manages registration and lifecycle of Embedded32 modules.
 */

import { Module } from '../types';

export class ModuleRegistry {
  private modules: Map<string, Module> = new Map();

  /**
   * Register a module
   */
  register(module: Module): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }
    this.modules.set(module.name, module);
  }

  /**
   * Unregister a module
   */
  unregister(moduleName: string): void {
    this.modules.delete(moduleName);
  }

  /**
   * Get a module by name
   */
  get(moduleName: string): Module | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Initialize all registered modules
   */
  async initAll(): Promise<void> {
    const promises = Array.from(this.modules.values()).map(module =>
      Promise.resolve(module.onInit())
    );
    await Promise.all(promises);
  }

  /**
   * Start all registered modules
   */
  async startAll(): Promise<void> {
    const promises = Array.from(this.modules.values()).map(module =>
      Promise.resolve(module.onStart())
    );
    await Promise.all(promises);
  }

  /**
   * Shutdown all registered modules
   */
  async stopAll(): Promise<void> {
    const promises = Array.from(this.modules.values()).map(module =>
      Promise.resolve(module.onStop())
    );
    await Promise.all(promises);
  }

  /**
   * Get all module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get number of registered modules
   */
  getModuleCount(): number {
    return this.modules.size;
  }
}
