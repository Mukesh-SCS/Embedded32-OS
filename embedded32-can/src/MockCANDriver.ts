import { CANFrame } from "./CANTypes.js";
import { ICANDriver } from "./CANDriver.js";

export class MockCANDriver implements ICANDriver {
  private handlers: ((frame: CANFrame) => void)[] = [];

  send(frame: CANFrame) {
    // Echo back as if received from the bus
    setTimeout(() => {
      this.handlers.forEach(h => h({ ...frame, timestamp: Date.now() }));
    }, 10);
  }

  onMessage(handler: (frame: CANFrame) => void) {
    this.handlers.push(handler);
  }

  close() {
    this.handlers = [];
  }
}
