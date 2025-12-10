/**
 * Configuration Loader
 * 
 * Load and manage runtime configuration from JSON files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export class ConfigLoader {
  private config: any = {};

  /**
   * Load configuration from file
   */
  async load(configPath: string): Promise<any> {
    try {
      const absolutePath = path.resolve(configPath);
      const data = await fs.readFile(absolutePath, 'utf-8');
      this.config = JSON.parse(data);
      return this.config;
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error);
      return {};
    }
  }

  /**
   * Get configuration value
   */
  get(key: string, defaultValue?: any): any {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): void {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Get entire configuration
   */
  getAll(): any {
    return { ...this.config };
  }

  /**
   * Save configuration to file
   */
  async save(configPath: string): Promise<void> {
    const absolutePath = path.resolve(configPath);
    const data = JSON.stringify(this.config, null, 2);
    await fs.writeFile(absolutePath, data, 'utf-8');
  }
}
