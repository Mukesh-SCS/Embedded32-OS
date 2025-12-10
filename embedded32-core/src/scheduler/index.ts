/**
 * Task Scheduler
 * 
 * Cooperative task scheduling for Embedded32 runtime.
 * Manages task priorities and execution order.
 */

import { Task } from './types';

export class Scheduler {
  private tasks: Map<string, Task> = new Map();
  private running: boolean = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * Add a task to the scheduler
   */
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  /**
   * Remove a task from the scheduler
   */
  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.scheduleNext();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }

  /**
   * Execute next task based on priority
   */
  private async scheduleNext(): Promise<void> {
    if (!this.running) return;

    // Get tasks sorted by priority (higher priority first)
    const sortedTasks = Array.from(this.tasks.values())
      .sort((a, b) => b.priority - a.priority);

    // Execute highest priority task
    if (sortedTasks.length > 0) {
      const task = sortedTasks[0];
      try {
        await task.execute();
      } catch (error) {
        console.error(`Task ${task.name} failed:`, error);
      }
    }

    // Schedule next execution
    this.intervalId = setTimeout(() => this.scheduleNext(), 0);
  }

  /**
   * Get number of registered tasks
   */
  getTaskCount(): number {
    return this.tasks.size;
  }
}
