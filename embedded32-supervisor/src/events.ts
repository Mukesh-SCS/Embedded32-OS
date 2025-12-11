import { EventEmitter } from 'events';
import { RuntimeEvent } from './types';

/**
 * Central event bus for runtime events
 */
export class RuntimeEventBus extends EventEmitter {
  private eventHistory: RuntimeEvent[] = [];
  private maxHistorySize: number = 1000;

  emitModuleStarted(moduleId: string, data?: Record<string, unknown>): void {
    this.emit('module-started', { moduleId, data });
    this.recordEvent({
      type: 'module-started',
      moduleId,
      timestamp: Date.now(),
      data
    });
  }

  emitModuleStopped(moduleId: string, data?: Record<string, unknown>): void {
    this.emit('module-stopped', { moduleId, data });
    this.recordEvent({
      type: 'module-stopped',
      moduleId,
      timestamp: Date.now(),
      data
    });
  }

  emitModuleFailed(moduleId: string, error: Error): void {
    this.emit('module-failed', { moduleId, error: error.message });
    this.recordEvent({
      type: 'module-failed',
      moduleId,
      timestamp: Date.now(),
      data: { error: error.message }
    });
  }

  emitConfigLoaded(data: Record<string, unknown>): void {
    this.emit('config-loaded', { data });
    this.recordEvent({
      type: 'config-loaded',
      timestamp: Date.now(),
      data
    });
  }

  emitSupervisorStarted(data?: Record<string, unknown>): void {
    this.emit('supervisor-started', { data });
    this.recordEvent({
      type: 'supervisor-started',
      timestamp: Date.now(),
      data
    });
  }

  emitSupervisorStopped(data?: Record<string, unknown>): void {
    this.emit('supervisor-stopped', { data });
    this.recordEvent({
      type: 'supervisor-stopped',
      timestamp: Date.now(),
      data
    });
  }

  emitHealthCheck(data: Record<string, unknown>): void {
    this.emit('health-check', { data });
    this.recordEvent({
      type: 'health-check',
      timestamp: Date.now(),
      data
    });
  }

  private recordEvent(event: RuntimeEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  getEventHistory(limit: number = 100): RuntimeEvent[] {
    return this.eventHistory.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}
