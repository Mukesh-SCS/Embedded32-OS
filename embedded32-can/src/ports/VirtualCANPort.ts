/**
 * Virtual CAN Port Implementation
 * 
 * Provides a software CAN bus for testing without hardware.
 * On Linux/WSL, can interface with vcan kernel module.
 */

import { ICANPort, CANFilter } from "../interfaces/CANPort.js";
import { CANFrame } from "../CANTypes.js";
import { EventEmitter } from "events";

/**
 * Virtual CAN Port
 * 
 * Features:
 * - In-memory message routing
 * - Optional connection to Linux vcan
 * - Full frame echo for loopback testing
 */
export class VirtualCANPort extends EventEmitter implements ICANPort {
  private interfaceName: string;
  private connected: boolean = false;
  private filters: CANFilter[] = [];
  private frameCallbacks: ((frame: CANFrame) => void)[] = [];
  
  // Shared bus for all VirtualCANPort instances on same interface
  private static buses: Map<string, VirtualCANPort[]> = new Map();

  constructor(interfaceName: string = "vcan0") {
    super();
    this.interfaceName = interfaceName;
    this.connect();
  }

  private connect(): void {
    // Register on shared bus
    let bus = VirtualCANPort.buses.get(this.interfaceName);
    if (!bus) {
      bus = [];
      VirtualCANPort.buses.set(this.interfaceName, bus);
    }
    bus.push(this);
    this.connected = true;
    this.emit("connected");
  }

  async send(frame: CANFrame): Promise<void> {
    if (!this.connected) {
      throw new Error(`VirtualCANPort ${this.interfaceName} not connected`);
    }

    // Add timestamp if not present
    const framedFrame: CANFrame = {
      ...frame,
      timestamp: frame.timestamp ?? Date.now()
    };

    // Broadcast to all ports on this bus (including self for loopback)
    const bus = VirtualCANPort.buses.get(this.interfaceName) || [];
    for (const port of bus) {
      port.receiveFrame(framedFrame);
    }
  }

  private receiveFrame(frame: CANFrame): void {
    // Apply filters
    if (this.filters.length > 0) {
      const matches = this.filters.some(f => this.matchesFilter(frame, f));
      if (!matches) return;
    }

    // Notify all callbacks
    for (const cb of this.frameCallbacks) {
      try {
        cb(frame);
      } catch (err) {
        this.emit("error", err);
      }
    }

    this.emit("frame", frame);
  }

  private matchesFilter(frame: CANFrame, filter: CANFilter): boolean {
    // Check extended frame type
    if (filter.extended !== undefined && filter.extended !== frame.extended) {
      return false;
    }

    // Apply mask and compare
    return (frame.id & filter.mask) === (filter.id & filter.mask);
  }

  onFrame(callback: (frame: CANFrame) => void): void {
    this.frameCallbacks.push(callback);
  }

  setFilters(filters: CANFilter[]): void {
    this.filters = filters;
  }

  getInterface(): string {
    return this.interfaceName;
  }

  isConnected(): boolean {
    return this.connected;
  }

  close(): void {
    // Remove from shared bus
    const bus = VirtualCANPort.buses.get(this.interfaceName);
    if (bus) {
      const idx = bus.indexOf(this);
      if (idx >= 0) {
        bus.splice(idx, 1);
      }
      if (bus.length === 0) {
        VirtualCANPort.buses.delete(this.interfaceName);
      }
    }

    this.connected = false;
    this.frameCallbacks = [];
    this.emit("disconnected");
  }

  /**
   * Get statistics
   */
  static getBusInfo(interfaceName: string): { portCount: number } {
    const bus = VirtualCANPort.buses.get(interfaceName);
    return { portCount: bus?.length ?? 0 };
  }

  /**
   * Clear all buses (for testing)
   */
  static clearAllBuses(): void {
    VirtualCANPort.buses.clear();
  }
}
