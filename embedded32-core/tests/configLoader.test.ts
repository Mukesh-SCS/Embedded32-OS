/**
 * ConfigLoader Tests
 */

import { ConfigLoader } from '../src/config/ConfigLoader';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;
  let tempDir: string;
  let testConfigPath: string;

  beforeEach(() => {
    loader = new ConfigLoader();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    testConfigPath = path.join(tempDir, 'test-config.json');
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('loading configuration', () => {
    it('should load a valid JSON config file', async () => {
      const config = { logLevel: 'info', port: 3000 };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      const loaded = await loader.load(testConfigPath);

      expect(loaded).toEqual(config);
    });

    it('should handle missing config file gracefully', async () => {
      const loaded = await loader.load('/non/existent/path.json');

      expect(loaded).toEqual({});
    });

    it('should load nested configuration', async () => {
      const config = {
        server: {
          host: 'localhost',
          port: 3000,
        },
        database: {
          url: 'mongodb://localhost',
          pool: 10,
        },
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      const loaded = await loader.load(testConfigPath);

      expect(loaded.server.port).toBe(3000);
      expect(loaded.database.pool).toBe(10);
    });
  });

  describe('get configuration', () => {
    beforeEach(async () => {
      const config = {
        app: {
          name: 'TestApp',
          version: '1.0.0',
          features: {
            logging: true,
            caching: true,
          },
        },
        port: 3000,
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));
      await loader.load(testConfigPath);
    });

    it('should get top-level config value', () => {
      const port = loader.get('port');
      expect(port).toBe(3000);
    });

    it('should get nested config value', () => {
      const appName = loader.get('app.name');
      expect(appName).toBe('TestApp');
    });

    it('should get deeply nested config value', () => {
      const logging = loader.get('app.features.logging');
      expect(logging).toBe(true);
    });

    it('should return default value for missing key', () => {
      const value = loader.get('non.existent.key', 'default');
      expect(value).toBe('default');
    });

    it('should return undefined for missing key without default', () => {
      const value = loader.get('non.existent.key');
      expect(value).toBeUndefined();
    });

    it('should get all configuration', () => {
      const all = loader.getAll();
      expect(all).toHaveProperty('app');
      expect(all).toHaveProperty('port');
      expect(all.port).toBe(3000);
    });
  });

  describe('set configuration', () => {
    it('should set top-level config value', async () => {
      await loader.load(testConfigPath);
      loader.set('port', 8080);

      expect(loader.get('port')).toBe(8080);
    });

    it('should set nested config value', async () => {
      const config = { app: { name: 'Test' } };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));
      await loader.load(testConfigPath);

      loader.set('app.version', '2.0.0');

      expect(loader.get('app.version')).toBe('2.0.0');
    });

    it('should create nested path if not exists', async () => {
      await loader.load(testConfigPath);
      loader.set('new.nested.value', 42);

      expect(loader.get('new.nested.value')).toBe(42);
    });

    it('should override existing values', async () => {
      const config = { setting: 'old' };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));
      await loader.load(testConfigPath);

      loader.set('setting', 'new');

      expect(loader.get('setting')).toBe('new');
    });
  });

  describe('save configuration', () => {
    it('should save configuration to file', async () => {
      const config = { setting: 'value' };
      fs.writeFileSync(testConfigPath, JSON.stringify({}));
      await loader.load(testConfigPath);

      loader.set('setting', 'value');
      await loader.save(testConfigPath);

      const saved = fs.readFileSync(testConfigPath, 'utf-8');
      const parsed = JSON.parse(saved);
      expect(parsed.setting).toBe('value');
    });

    it('should preserve existing values when saving', async () => {
      const config = { existing: 'value', other: 'data' };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));
      await loader.load(testConfigPath);

      loader.set('new', 'field');
      await loader.save(testConfigPath);

      const saved = fs.readFileSync(testConfigPath, 'utf-8');
      const parsed = JSON.parse(saved);
      expect(parsed.existing).toBe('value');
      expect(parsed.new).toBe('field');
    });

    it('should create formatted JSON output', async () => {
      const config = { app: { name: 'Test' } };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));
      await loader.load(testConfigPath);

      await loader.save(testConfigPath);

      const saved = fs.readFileSync(testConfigPath, 'utf-8');
      expect(saved).toContain('\n');
      expect(saved).toContain('  ');
    });
  });

  describe('empty configuration', () => {
    it('should handle empty config file', async () => {
      fs.writeFileSync(testConfigPath, '{}');
      await loader.load(testConfigPath);

      const value = loader.get('any.key', 'default');
      expect(value).toBe('default');
    });

    it('should work with fresh ConfigLoader instance', () => {
      const freshLoader = new ConfigLoader();
      const value = freshLoader.get('any.key', 'default');
      expect(value).toBe('default');
    });
  });
});
