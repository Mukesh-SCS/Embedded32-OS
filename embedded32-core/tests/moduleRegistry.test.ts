/**
 * ModuleRegistry Tests
 */

import { ModuleRegistry } from '../src/registry/index';
import { Module } from '../src/types';

class TestModule implements Module {
  name: string;
  version: string = '1.0.0';

  constructor(name: string) {
    this.name = name;
  }

  bind = jest.fn();
  onInit = jest.fn();
  onStart = jest.fn();
  onStop = jest.fn();
}

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  describe('module registration', () => {
    it('should register a module', () => {
      const module = new TestModule('test-module');
      registry.register(module);

      expect(registry.get('test-module')).toBe(module);
    });

    it('should throw error when registering duplicate module', () => {
      const module1 = new TestModule('duplicate');
      const module2 = new TestModule('duplicate');

      registry.register(module1);

      expect(() => registry.register(module2)).toThrow();
    });

    it('should unregister a module', () => {
      const module = new TestModule('test-module');
      registry.register(module);
      registry.unregister('test-module');

      expect(registry.get('test-module')).toBeUndefined();
    });

    it('should get module by name', () => {
      const module = new TestModule('test-module');
      registry.register(module);

      const retrieved = registry.get('test-module');
      expect(retrieved).toBe(module);
    });

    it('should return undefined for non-existent module', () => {
      const result = registry.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('lifecycle management', () => {
    it('should initialize all modules', async () => {
      const module1 = new TestModule('module1');
      const module2 = new TestModule('module2');

      registry.register(module1);
      registry.register(module2);

      await registry.initAll();

      expect(module1.onInit).toHaveBeenCalled();
      expect(module2.onInit).toHaveBeenCalled();
    });

    it('should start all modules', async () => {
      const module1 = new TestModule('module1');
      const module2 = new TestModule('module2');

      registry.register(module1);
      registry.register(module2);

      await registry.startAll();

      expect(module1.onStart).toHaveBeenCalled();
      expect(module2.onStart).toHaveBeenCalled();
    });

    it('should stop all modules', async () => {
      const module1 = new TestModule('module1');
      const module2 = new TestModule('module2');

      registry.register(module1);
      registry.register(module2);

      await registry.stopAll();

      expect(module1.onStop).toHaveBeenCalled();
      expect(module2.onStop).toHaveBeenCalled();
    });

    it('should handle async module initialization', async () => {
      const module = new TestModule('async-module');
      module.onInit = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      registry.register(module);
      await registry.initAll();

      expect(module.onInit).toHaveBeenCalled();
    });
  });

  describe('module queries', () => {
    it('should get all module names', () => {
      const module1 = new TestModule('module1');
      const module2 = new TestModule('module2');

      registry.register(module1);
      registry.register(module2);

      const names = registry.getModuleNames();
      expect(names).toContain('module1');
      expect(names).toContain('module2');
      expect(names.length).toBe(2);
    });

    it('should get module count', () => {
      const module1 = new TestModule('module1');
      const module2 = new TestModule('module2');

      registry.register(module1);
      registry.register(module2);

      expect(registry.getModuleCount()).toBe(2);
    });

    it('should return empty names array when no modules', () => {
      const names = registry.getModuleNames();
      expect(names).toEqual([]);
    });

    it('should return zero count when no modules', () => {
      expect(registry.getModuleCount()).toBe(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent module initialization', async () => {
      const modules = Array.from({ length: 5 }, (_, i) => 
        new TestModule(`module${i}`)
      );

      modules.forEach(m => registry.register(m));

      await registry.initAll();

      modules.forEach(m => {
        expect(m.onInit).toHaveBeenCalled();
      });
    });
  });
});
