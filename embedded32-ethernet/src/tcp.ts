/**
 * TCP Module - TCP Server & Client for J1939 messaging
 */

import { Server, Socket, createServer } from 'net';
import { J1939NanoProto } from './nanoproto';
import { EventEmitter } from 'events';

export interface TCPOptions {
  port: number;
  address?: string;
  maxConnections?: number;
}

export interface TCPMessage {
  pgn: number;
  sa: number;
  priority: number;
  data: Buffer;
  timestamp: number;
}

/**
 * TCP Server - Handle multiple client connections
 */
export class TCPServer extends EventEmitter {
  private server: Server;
  private clientConnections = new Map<string, Socket>();

  constructor(private options: TCPOptions) {
    super();
    this.server = createServer();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('connection', (socket: Socket) => {
        const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`TCP Client connected: ${clientId}`);
        this.clientConnections.set(clientId, socket);

        let buffer = Buffer.alloc(0);

        socket.on('data', (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);

          // Try to decode NanoProto messages from buffer
          while (buffer.length > 0) {
            try {
              const msg = J1939NanoProto.decode(buffer);
              this.emit('message', msg, clientId);

              // Remove processed bytes from buffer
              // This is simplified - real implementation would need proper framing
              buffer = Buffer.alloc(0);
              break;
            } catch (error) {
              // Incomplete message, wait for more data
              break;
            }
          }
        });

        socket.on('error', (error) => {
          console.error(`TCP Client error (${clientId}):`, error);
          this.emit('error', error, clientId);
        });

        socket.on('end', () => {
          console.log(`TCP Client disconnected: ${clientId}`);
          this.clientConnections.delete(clientId);
          this.emit('disconnect', clientId);
        });
      });

      this.server.on('error', reject);

      this.server.listen(this.options.port, this.options.address, () => {
        if (this.options.maxConnections) {
          this.server.maxConnections = this.options.maxConnections;
        }
        console.log(`TCP Server listening on ${this.options.address || '0.0.0.0'}:${this.options.port}`);
        resolve();
      });
    });
  }

  broadcast(message: TCPMessage): void {
    const buffer = J1939NanoProto.encode(message);
    this.clientConnections.forEach((socket) => {
      if (socket.writable) {
        socket.write(buffer);
      }
    });
  }

  sendToClient(clientId: string, message: TCPMessage): void {
    const socket = this.clientConnections.get(clientId);
    if (socket && socket.writable) {
      const buffer = J1939NanoProto.encode(message);
      socket.write(buffer);
    }
  }

  getClientCount(): number {
    return this.clientConnections.size;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all client connections
      this.clientConnections.forEach((socket) => socket.destroy());
      this.clientConnections.clear();

      this.server.close(() => resolve());
    });
  }
}

/**
 * TCP Client - Connect to TCP server and send/receive messages
 */
export class TCPClient extends EventEmitter {
  private socket: Socket | null = null;
  private buffer = Buffer.alloc(0);

  constructor(private host: string, private port: number) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new Socket();

      this.socket.on('connect', () => {
        console.log(`TCP Client connected to ${this.host}:${this.port}`);
        resolve();
      });

      this.socket.on('data', (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        // Try to decode messages
        while (this.buffer.length > 0) {
          try {
            const msg = J1939NanoProto.decode(this.buffer);
            this.emit('message', msg);
            this.buffer = Buffer.alloc(0);
            break;
          } catch (error) {
            break;
          }
        }
      });

      this.socket.on('error', (error) => {
        console.error('TCP Client error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('close', () => {
        console.log('TCP Client disconnected');
        this.emit('disconnect');
      });

      this.socket.connect(this.port, this.host);
    });
  }

  send(message: TCPMessage): void {
    if (!this.socket || !this.socket.writable) {
      throw new Error('TCP Client not connected');
    }
    const buffer = J1939NanoProto.encode(message);
    this.socket.write(buffer);
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.end(resolve);
      } else {
        resolve();
      }
    });
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.writable);
  }
}

export default { TCPServer, TCPClient };
