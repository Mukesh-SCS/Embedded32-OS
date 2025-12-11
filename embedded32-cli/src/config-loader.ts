import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { RuntimeConfig } from '@embedded32/supervisor';

/**
 * Configuration loader - reads and validates embedded32.yaml
 */
export class ConfigLoader {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
  }

  /**
   * Find configuration file in standard locations
   */
  private findConfigFile(): string {
    const locations = [
      './embedded32.yaml',
      './config/embedded32.yaml',
      path.join(process.cwd(), 'embedded32.yaml'),
      path.join(process.cwd(), 'config', 'embedded32.yaml'),
      path.join(__dirname, '../embedded32.yaml'),
      path.join(__dirname, '../../embedded32.yaml')
    ];

    for (const location of locations) {
      if (fs.existsSync(location)) {
        return location;
      }
    }

    throw new Error('embedded32.yaml not found in standard locations');
  }

  /**
   * Load configuration from file
   */
  load(): RuntimeConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    try {
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const config = YAML.parse(fileContent) as RuntimeConfig;
      this.validate(config);
      return config;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Failed to load configuration: ${err.message}`);
    }
  }

  /**
   * Validate configuration structure
   */
  private validate(config: RuntimeConfig): void {
    if (!config) {
      throw new Error('Configuration is empty');
    }

    // Basic validation - can be extended
    if (config.can && !config.can.interface) {
      throw new Error('CAN interface must be specified');
    }

    if (config.ethernet?.mqtt?.enabled && !config.ethernet.mqtt.broker) {
      throw new Error('MQTT broker URL is required when MQTT is enabled');
    }

    if (config.dashboard?.enabled && !config.dashboard.port) {
      throw new Error('Dashboard port must be specified');
    }
  }

  /**
   * Create default configuration
   */
  static createDefault(): RuntimeConfig {
    return {
      can: {
        interface: 'vcan0',
        baudrate: 250000,
        enabled: true
      },
      j1939: {
        enabled: true,
        databasePath: './data/j1939.db'
      },
      ethernet: {
        udp: {
          enabled: true,
          port: 5000
        },
        tcp: {
          enabled: true,
          port: 9000
        },
        mqtt: {
          enabled: false,
          broker: 'mqtt://localhost:1883',
          clientId: 'embedded32-default'
        }
      },
      bridge: {
        canEthernet: {
          enabled: true,
          whitelist: [0xf004, 0xfeca],
          rateLimit: {
            default: 10,
            0xf004: 20
          }
        },
        canMqtt: {
          enabled: false,
          topicPrefix: 'vehicle',
          payloadFormat: 'nanoproto'
        }
      },
      dashboard: {
        enabled: true,
        port: 5173,
        host: 'localhost'
      },
      simulator: {
        engine: false,
        transmission: false,
        brakes: false
      },
      logging: {
        level: 'info',
        console: true
      }
    };
  }

  /**
   * Save configuration to file
   */
  save(config: RuntimeConfig, filepath: string): void {
    try {
      const yaml = YAML.stringify(config);
      fs.writeFileSync(filepath, yaml, 'utf-8');
      console.log(`✅ Configuration saved to: ${filepath}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Failed to save configuration: ${err.message}`);
    }
  }

  /**
   * Get configuration path
   */
  getPath(): string {
    return this.configPath;
  }
}
