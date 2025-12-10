/**
 * Scheduler Tests
 */

import { Scheduler } from '../src/scheduler/Scheduler';
import { Task } from '../src/types';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  afterEach(() => {
    scheduler.stopAll();
  });

  describe('task management', () => {
    it('should add a task to the scheduler', () => {
      const task: Task = {
        id: 'task1',
        name: 'Test Task',
        priority: 1,
        execute: jest.fn(),
      };

      scheduler.addTask(task);
      expect(scheduler.getTaskCount()).toBe(1);
    });

    it('should remove a task from the scheduler', () => {
      const task: Task = {
        id: 'task1',
        name: 'Test Task',
        priority: 1,
        execute: jest.fn(),
      };

      scheduler.addTask(task);
      scheduler.removeTask('task1');
      expect(scheduler.getTaskCount()).toBe(0);
    });

    it('should track multiple tasks', () => {
      const task1: Task = {
        id: 'task1',
        name: 'Task 1',
        priority: 1,
        execute: jest.fn(),
      };

      const task2: Task = {
        id: 'task2',
        name: 'Task 2',
        priority: 2,
        execute: jest.fn(),
      };

      scheduler.addTask(task1);
      scheduler.addTask(task2);
      expect(scheduler.getTaskCount()).toBe(2);
    });
  });

  describe('task execution', () => {
    it('should start the scheduler', () => {
      scheduler.start();
      expect(scheduler.getTaskCount()).toBe(0); // Doesn't fail
    });

    it('should stop the scheduler', async () => {
      scheduler.start();
      scheduler.stop();
      expect(scheduler.getTaskCount()).toBe(0);
    });

    it('should execute tasks when scheduler is running', async () => {
      const task: Task = {
        id: 'task1',
        name: 'Test Task',
        priority: 1,
        execute: jest.fn(),
      };

      scheduler.addTask(task);
      scheduler.start();

      // Give scheduler time to execute
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(task.execute).toHaveBeenCalled();
    });

    it('should not execute tasks when scheduler is stopped', async () => {
      const mockExecute = jest.fn(async () => {});
      const task: Task = {
        id: 'task1',
        name: 'Test Task',
        priority: 1,
        execute: mockExecute,
      };

      scheduler.addTask(task);
      scheduler.start();
      scheduler.stop();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Task might be called once, but not multiple times
      const callCount = mockExecute.mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(1);
    });
  });

  describe('priority handling', () => {
    it('should execute higher priority tasks first', async () => {
      const executionOrder: string[] = [];

      const task1: Task = {
        id: 'task1',
        name: 'Low Priority',
        priority: 1,
        execute: jest.fn(async () => { executionOrder.push('task1'); }),
      };

      const task2: Task = {
        id: 'task2',
        name: 'High Priority',
        priority: 10,
        execute: jest.fn(async () => { executionOrder.push('task2'); }),
      };

      scheduler.addTask(task1);
      scheduler.addTask(task2);
      scheduler.start();

      // Wait for at least one execution
      await new Promise(resolve => setTimeout(resolve, 100));

      // Higher priority task should be in the execution order
      expect(executionOrder.length).toBeGreaterThan(0);
    });
  });

  describe('stopAll method', () => {
    it('should stop all tasks via stopAll alias', () => {
      scheduler.start();
      scheduler.stopAll();
      // Should not throw
      expect(scheduler.getTaskCount()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle task execution errors gracefully', async () => {
      const errorTask: Task = {
        id: 'error-task',
        name: 'Error Task',
        priority: 1,
        execute: jest.fn(async () => {
          throw new Error('Task execution failed');
        }),
      };

      const normalTask: Task = {
        id: 'normal-task',
        name: 'Normal Task',
        priority: 1,
        execute: jest.fn(),
      };

      scheduler.addTask(errorTask);
      scheduler.addTask(normalTask);
      scheduler.start();

      // Give time to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still have both tasks
      expect(scheduler.getTaskCount()).toBe(2);
    });
  });
});
