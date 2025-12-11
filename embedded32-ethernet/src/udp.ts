/**
 * UDP Module - Simple Rx/Tx helpers for J1939 over Ethernet
 */

import { Socket, createSocket, RemoteInfo } from 'dgram';
import { J1939NanoProto } from './nanoproto';

export interface UDPOptions {
  port: number;
  address?: string;
  broadcast?: boolean;
  reuseAddr?: boolean;
}

export interface UDPMessage {
  pgn: number;
  sa: number;
  priority: number;
  data: Buffer;
  timestamp: number;
  remoteAddress?: string;
  remotePort?: number;
}

/**
 * UDP Server - Listen for incoming J1939 messages
 */
export class UDPServer {
  private socket: Socket;
  private listeners: ((msg: UDPMessage, info: RemoteInfo) => void)[] = [];

  constructor(private options: UDPOptions) {
    this.socket = createSocket('udp4');
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.on('message', (buffer, remoteInfo) => {
        try {
          const msg = J1939NanoProto.decode(buffer);
          this.listeners.forEach(listener => listener(msg, remoteInfo));
        } catch (error) {
          console.error('Error decoding UDP message:', error);
        }
      });

      this.socket.on('error', reject);

      this.socket.bind(this.options.port, this.options.address, () => {
        if (this.options.broadcast) {
          this.socket.setBroadcast(true);
        }
        console.log(`UDP Server listening on ${this.options.address || '0.0.0.0'}:${this.options.port}`);
        resolve();
      });
    });
  }

  onMessage(callback: (msg: UDPMessage, info: RemoteInfo) => void): void {
    this.listeners.push(callback);
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.close(resolve);
    });
  }
}

/**
 * UDP Client - Send J1939 messages over UDP
 */
export class UDPClient {
  private socket: Socket;

  constructor(private options: UDPOptions) {
    this.socket = createSocket('udp4');
    if (this.options.broadcast) {
      this.socket.setBroadcast(true);
    }
  }

  async send(message: UDPMessage, remoteAddress: string, remotePort: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const buffer = J1939NanoProto.encode(message);
      this.socket.send(buffer, 0, buffer.length, remotePort, remoteAddress, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async broadcast(message: UDPMessage): Promise<void> {
    const broadcastAddr = this.options.address || '255.255.255.255';
    return this.send(message, broadcastAddr, this.options.port);
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.close(resolve);
    });
  }
}

export default { UDPServer, UDPClient };
