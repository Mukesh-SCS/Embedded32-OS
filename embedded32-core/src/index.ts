/**
 * Embedded32 Core Runtime
 * 
 * Main entry point for the Embedded32 platform runtime.
 * Provides task scheduling, messaging, module registry, and configuration.
 */

export { Runtime } from './runtime';
export { Scheduler } from './scheduler';
export { MessageBus } from './messaging';
export { ModuleRegistry } from './registry';
export { Logger } from './logger';
export { ConfigLoader } from './config';

export * from './types';
