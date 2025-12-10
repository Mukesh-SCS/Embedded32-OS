import { CANFrame } from "./CANTypes.js";

export interface ICANDriver {
  send(frame: CANFrame): Promise<void> | void;
  onMessage(handler: (frame: CANFrame) => void): void;
  close(): void;
}

export class CANInterface {
  constructor(private driver: ICANDriver) {}

  send(frame: CANFrame) {
    return this.driver.send(frame);
  }

  onMessage(handler: (frame: CANFrame) => void) {
    this.driver.onMessage(handler);
  }

  close() {
    this.driver.close();
  }
}
