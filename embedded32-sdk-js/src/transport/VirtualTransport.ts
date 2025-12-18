/**
 * Embedded32 SDK - Virtual Transport
 * 
 * In-memory transport that connects to VirtualCANPort
 * Used for testing and Windows development
 */

import { EventEmitter } from 'events';
import type { ITransport, CANFrame, TransportConfig } from '../types.js';

/**
 * Virtual Transport implementation
 * Connects to an in-memory CAN bus for simulation
 */
export class VirtualTransport extends EventEmitter implements ITransport {
  private config: TransportConfig;
  private connected: boolean = false;
  private frameHandler?: (frame: CANFrame) => void;
  
  // Static bus registry for inter-process communication simulation
  private static buses: Map<string, VirtualTransport[]> = new Map();

  constructor(config: TransportConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Already connected');
    }

    // Register with the virtual bus
    const busName = this.config.interface;
    if (!VirtualTransport.buses.has(busName)) {
      VirtualTransport.buses.set(busName, []);
    }
    VirtualTransport.buses.get(busName)!.push(this);
    
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    // Unregister from the virtual bus
    const busName = this.config.interface;
    const bus = VirtualTransport.buses.get(busName);
    if (bus) {
      const idx = bus.indexOf(this);
      if (idx >= 0) {
        bus.splice(idx, 1);
      }
    }

    this.connected = false;
    this.frameHandler = undefined;
    this.emit('disconnected');
  }

  async send(frame: CANFrame): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    // Broadcast to all other transports on same bus
    const busName = this.config.interface;
    const bus = VirtualTransport.buses.get(busName) || [];
    
    for (const transport of bus) {
      if (transport !== this && transport.frameHandler) {
        // Simulate async delivery
        setImmediate(() => {
          transport.frameHandler!({
            ...frame,
            timestamp: Date.now()
          });
        });
      }
    }
  }

  onFrame(handler: (frame: CANFrame) => void): void {
    this.frameHandler = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Inject a frame as if received from the bus (for testing)
   */
  injectFrame(frame: CANFrame): void {
    if (this.frameHandler) {
      this.frameHandler({
        ...frame,
        timestamp: frame.timestamp || Date.now()
      });
    }
  }

  /**
   * Get the bus name this transport is connected to
   */
  getBusName(): string {
    return this.config.interface;
  }
}
