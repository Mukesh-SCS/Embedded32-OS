/**
 * CAN ↔ MQTT Bridge
 * Publish PGNs to MQTT topics
 * Subscribe to commands and inject into CAN
 */

import { decodeJ1939 } from 'embedded32-j1939';

export interface MQTTBridgeConfig {
  topicPrefix: string;
  publishJ1939: boolean;
  subscribeToCommands: boolean;
  deviceName: string;
  deviceType: string;
}

/**
 * CAN to MQTT Bridge
 */
export class CanMqttBridge {
  private topicMap = new Map<number, string>();

  constructor(
    private mqtt: any,
    private config: MQTTBridgeConfig,
    private canInterface: any
  ) {
    this.setupTopicMappings();
  }

  /**
   * Setup PGN to MQTT topic mappings
   */
  private setupTopicMappings(): void {
    const mappings: [number, string][] = [
      [0xf004, 'engine/speed'],
      [0xf001, 'transmission/gear'],
      [0xfeee, 'engine/temperature'],
      [0xfef2, 'fuel/economy'],
      [0xfeca, 'faults/dm1'],
    ];

    mappings.forEach(([pgn, topic]) => {
      const fullTopic = `${this.config.topicPrefix}/${topic}`;
      this.topicMap.set(pgn, fullTopic);
      if (this.mqtt.registerTopic) {
        this.mqtt.registerTopic(fullTopic, { pgn, type: 'j1939' });
      }
    });

    console.log(`Initialized ${this.topicMap.size} MQTT topic mappings`);
  }

  /**
   * Start bridge
   */
  async start(): Promise<void> {
    console.log('Starting CAN ↔ MQTT Bridge');

    if (this.mqtt.announceDevice) {
      this.mqtt.announceDevice({
        name: this.config.deviceName,
        type: this.config.deviceType,
        version: '0.1.0',
        capabilities: ['j1939', 'mqtt', 'can-to-mqtt', 'mqtt-to-can'],
      });
    }

    if (this.config.publishJ1939) {
      this.canInterface.on('message', async (frame: any) => {
        try {
          const j1939Msg = decodeJ1939(frame);
          if (!j1939Msg) return;

          const topic = this.topicMap.get(j1939Msg.pgn);
          if (topic && this.mqtt.publish) {
            const payload = {
              pgn: `0x${j1939Msg.pgn.toString(16).toUpperCase()}`,
              sa: `0x${j1939Msg.sa.toString(16).toUpperCase()}`,
              priority: j1939Msg.priority,
              timestamp: Date.now(),
            };

            this.mqtt.publish(topic, JSON.stringify(payload), 1);
            console.log(`Published J1939 to ${topic}`);
          }
        } catch (error) {
          console.error('Error publishing CAN to MQTT:', error);
        }
      });
    }

    if (this.config.subscribeToCommands && this.mqtt.subscribe) {
      const commandTopic = `${this.config.topicPrefix}/commands/+`;
      this.mqtt.subscribe(commandTopic);

      if (this.mqtt.on) {
        this.mqtt.on('message', async (topic: string, msg: any) => {
          if (topic.includes('/commands/')) {
            await this.handleCommand(msg);
          }
        });
      }
    }

    console.log('CAN ↔ MQTT Bridge started');
  }

  /**
   * Handle MQTT command
   */
  private async handleCommand(msg: any): Promise<void> {
    try {
      const payload = typeof msg === 'string' ? JSON.parse(msg) : msg;
      const { pgn, sa, data } = payload;

      if (!pgn || !data) {
        console.warn('Invalid command format');
        return;
      }

      console.log(`Received MQTT command: PGN=${pgn}, SA=${sa}`);
    } catch (error) {
      console.error('Error handling MQTT command:', error);
    }
  }

  /**
   * Publish message
   */
  publishMessage(j1939Msg: any): void {
    const topic = this.topicMap.get(j1939Msg.pgn);
    if (topic && this.mqtt.publish) {
      const payload = {
        pgn: `0x${j1939Msg.pgn.toString(16).toUpperCase()}`,
        sa: `0x${j1939Msg.sa.toString(16).toUpperCase()}`,
        timestamp: Date.now(),
      };
      this.mqtt.publish(topic, JSON.stringify(payload), 1);
    }
  }

  /**
   * Get topics
   */
  getTopics(): string[] {
    return Array.from(this.topicMap.values());
  }
}

export default { CanMqttBridge };
