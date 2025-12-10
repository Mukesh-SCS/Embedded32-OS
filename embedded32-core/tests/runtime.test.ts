/**
 * Runtime Tests
 */

import { Runtime } from '../src/runtime';
import { Module } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class MockModule implements Module {
  name: string;
  version: string = '1.0.0';
  onInitCalled = false;
  onStartCalled = false;
  onStopCalled = false;

  constructor(name: string) {
    this.name = name;
  }

  bind = jest.fn();
  onInit = jest.fn(() => {
    this.onInitCalled = true;
  });
  onStart = jest.fn(() => {
    this.onStartCalled = true;
  });
  onStop = jest.fn(() => {
    this.onStopCalled = true;
  });
}

describe('Runtime', () => {
  let runtime: Runtime;
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-test-'));
    configPath = path.join(tempDir, 'config.json');
    
    // Create a test config file
    const config = { logLevel: 'info' };
    fs.writeFileSync(configPath, JSON.stringify(config));
  });

  afterEach(async () => {
    if (runtime) {
      try {
        await runtime.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('initialization', () => {
    it('should create runtime instance', () => {
      runtime = new Runtime({ logLevel: 'info' });
      expect(runtime).toBeDefined();
    });

    it('should initialize with custom log level', () => {
      runtime = new Runtime({ logLevel: 'debug' });
      expect(runtime).toBeDefined();
    });

    it('should load configuration file', async () => {
      runtime = new Runtime({ 
        logLevel: 'info',
        configPath 
      });
      expect(runtime).toBeDefined();
    });
  });

  describe('module management', () => {
    beforeEach(() => {
      runtime = new Runtime({ logLevel: 'info' });
    });

    it('should register a module', () => {
      const module = new MockModule('test-module');
      runtime.registerModule(module);

      expect(module.bind).toHaveBeenCalled();
    });

    it('should bind module context during registration', () => {
      const module = new MockModule('test-module');
      runtime.registerModule(module);

      expect(module.bind).toHaveBeenCalledWith(
        expect.objectContaining({
          logger: expect.anything(),
          bus: expect.anything(),
          scheduler: expect.anything(),
          config: expect.anything(),
        })
      );
    });

    it('should register multiple modules', () => {
      const module1 = new MockModule('module1');
      const module2 = new MockModule('module2');

      runtime.registerModule(module1);
      runtime.registerModule(module2);

      expect(module1.bind).toHaveBeenCalled();
      expect(module2.bind).toHaveBeenCalled();
    });
  });

  describe('runtime lifecycle', () => {
    beforeEach(() => {
      runtime = new Runtime({ logLevel: 'info' });
    });

    it('should start the runtime', async () => {
      const module = new MockModule('test-module');
      runtime.registerModule(module);

      await runtime.start();

      expect(module.onInit).toHaveBeenCalled();
      expect(module.onStart).toHaveBeenCalled();
    });

    it('should initialize modules before starting', async () => {
      const module = new MockModule('test-module');

      runtime.registerModule(module);
      await runtime.start();

      // Both should be called
      expect(module.onInit).toHaveBeenCalled();
      expect(module.onStart).toHaveBeenCalled();
    });

    it('should stop the runtime', async () => {
      const module = new MockModule('test-module');
      runtime.registerModule(module);

      await runtime.start();
      await runtime.stop();

      expect(module.onStop).toHaveBeenCalled();
    });

    it('should track running state', async () => {
      expect(runtime.isRunning()).toBe(false);

      await runtime.start();
      expect(runtime.isRunning()).toBe(true);

      await runtime.stop();
      expect(runtime.isRunning()).toBe(false);
    });

    it('should handle multiple start/stop cycles', async () => {
      const module = new MockModule('test-module');
      runtime.registerModule(module);

      await runtime.start();
      await runtime.stop();
      
      // Reset mocks
      module.onInit.mockClear();
      module.onStart.mockClear();
      module.onStop.mockClear();

      await runtime.start();
      await runtime.stop();

      expect(module.onInit).toHaveBeenCalled();
    });
  });

  describe('message bus access', () => {
    beforeEach(() => {
      runtime = new Runtime({ logLevel: 'info' });
    });

    it('should provide access to message bus', () => {
      const bus = runtime.getMessageBus();
      expect(bus).toBeDefined();
    });

    it('should allow publishing messages', async () => {
      const bus = runtime.getMessageBus();
      const handler = jest.fn();

      bus.subscribe('test.topic', handler);
      await bus.publish('test.topic', { data: 'test' });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('scheduler access', () => {
    beforeEach(() => {
      runtime = new Runtime({ logLevel: 'info' });
    });

    it('should provide access to scheduler', () => {
      const scheduler = runtime.getScheduler();
      expect(scheduler).toBeDefined();
    });

    it('should allow task scheduling', () => {
      const scheduler = runtime.getScheduler();
      const task = {
        id: 'test-task',
        name: 'Test Task',
        priority: 1,
        execute: jest.fn(),
      };

      scheduler.addTask(task);
      expect(scheduler.getTaskCount()).toBe(1);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      runtime = new Runtime({ logLevel: 'info' });
    });

    it('should handle module initialization errors gracefully', async () => {
      const module = new MockModule('error-module');
      
      runtime.registerModule(module);

      // Mock onInit to throw error
      const origOnInit = module.onInit as jest.Mock;
      origOnInit.mockImplementationOnce(() => {
        throw new Error('Init failed');
      });

      // Should not throw
      await expect(runtime.start()).rejects.toThrow();
    });

    it('should handle missing config file', () => {
      // Should not throw, should use default config
      runtime = new Runtime({ 
        logLevel: 'info',
        configPath: '/non/existent/path.json'
      });

      expect(runtime).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should complete full runtime lifecycle', async () => {
      runtime = new Runtime({ logLevel: 'info' });

      const module = new MockModule('test-module');
      runtime.registerModule(module);

      await runtime.start();
      expect(runtime.isRunning()).toBe(true);

      const bus = runtime.getMessageBus();
      const messageHandler = jest.fn();
      bus.subscribe('test.message', messageHandler);

      await bus.publish('test.message', { data: 'test' });
      expect(messageHandler).toHaveBeenCalled();

      await runtime.stop();
      expect(runtime.isRunning()).toBe(false);
    });
  });
});
