/**
 * Embedded32 SDK - J1939 Client
 * 
 * The main SDK client for interacting with J1939 networks.
 * This is the primary interface for external developers.
 */

import { EventEmitter } from 'events';
import type {
  IJ1939Client,
  J1939ClientConfig,
  J1939Message,
  PGNData,
  PGNHandler,
  ITransport,
  CANFrame
} from './types.js';
import { PGN } from './types.js';
import { VirtualTransport } from './transport/index.js';
import { decodeFrame, encodeFrame, buildJ1939Id, encodePGNData } from './j1939/index.js';

/**
 * J1939 Client
 * 
 * A client for connecting to and interacting with J1939 networks.
 * 
 * @example
 * ```typescript
 * const client = new J1939Client({
 *   interface: 'vcan0',
 *   sourceAddress: 0xFA
 * });
 * 
 * await client.connect();
 * 
 * client.onPGN(0xF004, (msg) => {
 *   console.log(msg.spns.engineSpeed);
 * });
 * 
 * await client.requestPGN(0xFEEE);
 * ```
 */
export class J1939Client extends EventEmitter implements IJ1939Client {
  private config: J1939ClientConfig;
  private transport: ITransport | null = null;
  private connected: boolean = false;
  private pgnHandlers: Map<number, Set<PGNHandler>> = new Map();
  private debug: boolean;

  constructor(config: J1939ClientConfig) {
    super();
    this.config = config;
    this.debug = config.debug || false;
    
    // Validate source address
    if (config.sourceAddress < 0 || config.sourceAddress > 0xFD) {
      throw new Error(`Invalid source address: ${config.sourceAddress}. Must be 0x00-0xFD`);
    }
  }

  /**
   * Connect to the J1939 network
   */
  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Already connected');
    }

    this.log(`Connecting to ${this.config.interface} as SA=0x${this.config.sourceAddress.toString(16).toUpperCase()}`);

    // Create transport based on config
    this.transport = this.createTransport();
    
    // Set up frame handler
    this.transport.onFrame((frame) => this.handleFrame(frame));
    
    // Connect
    await this.transport.connect();
    
    this.connected = true;
    this.log('Connected');
    this.emit('connected');
  }

  /**
   * Disconnect from the J1939 network
   */
  async disconnect(): Promise<void> {
    if (!this.connected || !this.transport) {
      return;
    }

    this.log('Disconnecting...');
    
    await this.transport.disconnect();
    this.transport = null;
    this.connected = false;
    this.pgnHandlers.clear();
    
    this.log('Disconnected');
    this.emit('disconnected');
  }

  /**
   * Subscribe to a specific PGN
   * 
   * @param pgn - Parameter Group Number to subscribe to
   * @param handler - Callback invoked with decoded message
   * @returns Unsubscribe function
   */
  onPGN(pgn: number, handler: PGNHandler): () => void {
    if (!this.pgnHandlers.has(pgn)) {
      this.pgnHandlers.set(pgn, new Set());
    }
    
    this.pgnHandlers.get(pgn)!.add(handler);
    this.log(`Subscribed to PGN 0x${pgn.toString(16).toUpperCase()}`);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.pgnHandlers.get(pgn);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.pgnHandlers.delete(pgn);
        }
      }
      this.log(`Unsubscribed from PGN 0x${pgn.toString(16).toUpperCase()}`);
    };
  }

  /**
   * Request a PGN from the network
   * 
   * Sends Request PGN (59904/0xEA00) asking for specific data.
   * The response will arrive via the onPGN handler.
   * 
   * @param pgn - Parameter Group Number to request
   * @param destination - Target address (default: 255 for broadcast)
   */
  async requestPGN(pgn: number, destination: number = 0xFF): Promise<void> {
    if (!this.connected || !this.transport) {
      throw new Error('Not connected');
    }

    this.log(`Requesting PGN 0x${pgn.toString(16).toUpperCase()} from SA=0x${destination.toString(16).toUpperCase()}`);

    // Build Request PGN frame (59904 / 0xEA00)
    const requestData = new Uint8Array(3);
    requestData[0] = pgn & 0xFF;
    requestData[1] = (pgn >> 8) & 0xFF;
    requestData[2] = (pgn >> 16) & 0xFF;

    const canId = buildJ1939Id(PGN.REQUEST, this.config.sourceAddress, 6, destination);
    
    const frame: CANFrame = {
      id: canId,
      data: requestData,
      isExtended: true,
      timestamp: Date.now()
    };

    await this.transport.send(frame);
    this.log(`Request sent`);
  }

  /**
   * Send a PGN with data
   * 
   * Encodes the data according to J1939 and transmits.
   * 
   * @param pgn - Parameter Group Number to send
   * @param data - Decoded data to encode and send
   * @param destination - Target address (default: 255 for broadcast)
   */
  async sendPGN(pgn: number, data: PGNData, destination: number = 0xFF): Promise<void> {
    if (!this.connected || !this.transport) {
      throw new Error('Not connected');
    }

    this.log(`Sending PGN 0x${pgn.toString(16).toUpperCase()} to SA=0x${destination.toString(16).toUpperCase()}`);

    const frame = encodeFrame(
      pgn,
      data,
      this.config.sourceAddress,
      6, // Default priority
      destination
    );

    await this.transport.send(frame);
    this.log(`PGN sent`);
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get client's source address
   */
  getSourceAddress(): number {
    return this.config.sourceAddress;
  }

  /**
   * Handle incoming CAN frame
   */
  private handleFrame(frame: CANFrame): void {
    try {
      const message = decodeFrame(frame);
      
      // Emit to global listeners
      this.emit('message', message);
      
      // Emit to PGN-specific handlers
      const handlers = this.pgnHandlers.get(message.pgn);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(message);
          } catch (err) {
            this.emit('error', err);
          }
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * Create appropriate transport based on config
   */
  private createTransport(): ITransport {
    const transportType = this.config.transport || this.detectTransport();
    
    switch (transportType) {
      case 'virtual':
        return new VirtualTransport({ interface: this.config.interface });
        
      case 'socketcan':
        // For now, fall back to virtual on unsupported platforms
        if (process.platform !== 'linux') {
          this.log('SocketCAN not available on this platform, using virtual transport');
          return new VirtualTransport({ interface: this.config.interface });
        }
        // TODO: Implement SocketCANTransport
        return new VirtualTransport({ interface: this.config.interface });
        
      case 'pcan':
        // TODO: Implement PCANTransport
        this.log('PCAN not yet implemented, using virtual transport');
        return new VirtualTransport({ interface: this.config.interface });
        
      default:
        return new VirtualTransport({ interface: this.config.interface });
    }
  }

  /**
   * Auto-detect transport type
   */
  private detectTransport(): 'socketcan' | 'pcan' | 'virtual' {
    const iface = this.config.interface.toLowerCase();
    
    if (iface.startsWith('vcan')) {
      return 'virtual';
    }
    
    if (iface.startsWith('can') && process.platform === 'linux') {
      return 'socketcan';
    }
    
    if (iface.startsWith('pcan')) {
      return 'pcan';
    }
    
    // Default to virtual
    return 'virtual';
  }

  /**
   * Log message if debug enabled
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[J1939Client] ${message}`);
    }
  }
}
