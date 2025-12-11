/**
 * Embedded32 SDK - CAN Bus API
 * Low-level CAN frame send/receive
 */

export interface CANFrame {
  id: number;
  data: number[];
  dlc?: number;
  flags?: number;
}

/**
 * CAN Bus Interface
 */
export class CANBus {
  constructor(private driver: any) {}

  /**
   * Send CAN frame
   */
  async send(frame: CANFrame): Promise<void> {
    if (!this.driver.send) {
      throw new Error('CAN driver does not support send()');
    }
    return this.driver.send(frame);
  }

  /**
   * Listen for CAN messages
   */
  onMessage(callback: (frame: CANFrame) => void): void {
    if (!this.driver.on) {
      throw new Error('CAN driver does not support event listeners');
    }
    this.driver.on('message', callback);
  }

  /**
   * Send J1939 message
   */
  async sendJ1939(msg: any): Promise<void> {
    const id =
      ((msg.priority & 0x7) << 26) |
      ((msg.pgn & 0x3ffff) << 8) |
      (msg.sa & 0xff);

    return this.send({
      id,
      data: msg.data || [],
    });
  }
}

export default { CANBus };
