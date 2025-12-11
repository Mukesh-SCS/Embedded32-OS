/**
 * MQTT Client - Publish/Subscribe J1939 messages
 * Auto-reconnect, topic registry, device discovery
 */

import { connect, MqttClient, IClientOptions } from 'mqtt';
import { J1939NanoProto } from './nanoproto';
import { EventEmitter } from 'events';

export interface MQTTOptions extends IClientOptions {
  brokerUrl: string;
  clientId: string;
  topicPrefix?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export interface MQTTMessage {
  topic: string;
  pgn?: number;
  sa?: number;
  priority?: number;
  data?: Buffer;
  timestamp?: number;
  [key: string]: any;
}

/**
 * MQTT Client with auto-reconnect and topic registry
 */
export class MQTTClient extends EventEmitter {
  private client: MqttClient | null = null;
  private subscribedTopics = new Set<string>();
  private topicRegistry = new Map<string, any>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;
  private isConnected = false;

  constructor(private options: MQTTOptions) {
    super();
    this.reconnectInterval = options.reconnectInterval || 5000;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const clientOptions: IClientOptions = {
          ...this.options,
          clientId: this.options.clientId,
          reconnectPeriod: this.reconnectInterval,
          will: {
            topic: `${this.options.topicPrefix || 'embedded32'}/status`,
            payload: JSON.stringify({ status: 'offline', clientId: this.options.clientId }),
            qos: 1,
            retain: false,
          },
        };

        this.client = connect(this.options.brokerUrl, clientOptions);

        this.client.on('connect', () => {
          console.log(`MQTT Connected: ${this.options.clientId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Publish online status
          const statusTopic = `${this.options.topicPrefix || 'embedded32'}/status`;
          this.publish(statusTopic, {
            status: 'online',
            clientId: this.options.clientId,
            timestamp: Date.now(),
          });

          // Resubscribe to all topics
          this.subscribedTopics.forEach((topic) => {
            this.client!.subscribe(topic, { qos: 1 });
          });

          this.emit('connected');
          resolve();
        });

        this.client.on('message', (topic: string, payload: Buffer) => {
          try {
            // Try to decode as NanoProto J1939 message
            try {
              const msg = J1939NanoProto.decode(payload);
              this.emit('j1939', { ...msg, topic });
            } catch {
              // Fall back to JSON
              const jsonMsg = JSON.parse(payload.toString());
              this.emit('message', { ...jsonMsg, topic });
            }
          } catch (error) {
            console.error('Error processing MQTT message:', error);
          }
        });

        this.client.on('error', (error) => {
          console.error('MQTT Error:', error);
          this.emit('error', error);
        });

        this.client.on('disconnect', () => {
          console.log('MQTT Disconnected');
          this.isConnected = false;
          this.emit('disconnected');
        });

        this.client.on('offline', () => {
          this.isConnected = false;
          console.log('MQTT Offline - attempting to reconnect');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(topic: string, qos: number = 1): void {
    this.subscribedTopics.add(topic);
    if (this.client && this.isConnected) {
      this.client.subscribe(topic, { qos: qos as 0 | 1 | 2 });
      console.log(`Subscribed to: ${topic}`);
    }
  }

  unsubscribe(topic: string): void {
    this.subscribedTopics.delete(topic);
    if (this.client && this.isConnected) {
      this.client.unsubscribe(topic);
    }
  }

  /**
   * Publish J1939 message
   */
  publishJ1939(baseTopic: string, message: any, qos: number = 1): void {
    const buffer = J1939NanoProto.encode(message);
    this.client?.publish(baseTopic, buffer, { qos: qos as 0 | 1 | 2, retain: false });
  }

  /**
   * Publish generic message (JSON)
   */
  publish(topic: string, payload: any, qos: number = 1): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.client?.publish(topic, data, { qos: qos as 0 | 1 | 2, retain: false });
    console.log(`Published to ${topic}`);
  }

  /**
   * Register topic in registry
   */
  registerTopic(topic: string, schema: any): void {
    this.topicRegistry.set(topic, schema);
  }

  /**
   * Get topic schema from registry
   */
  getTopic(topic: string): any {
    return this.topicRegistry.get(topic);
  }

  /**
   * List all registered topics
   */
  listTopics(): string[] {
    return Array.from(this.topicRegistry.keys());
  }

  /**
   * Device discovery - broadcast device info
   */
  announceDevice(deviceInfo: {
    name: string;
    type: string;
    version: string;
    capabilities: string[];
  }): void {
    const topic = `${this.options.topicPrefix || 'embedded32'}/devices/${deviceInfo.name}`;
    this.publish(topic, { ...deviceInfo, timestamp: Date.now() }, 1);
  }

  /**
   * Subscribe to device discovery
   */
  discoverDevices(): void {
    const topic = `${this.options.topicPrefix || 'embedded32'}/devices/+`;
    this.subscribe(topic);
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, () => {
          this.isConnected = false;
          this.client = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default { MQTTClient };
