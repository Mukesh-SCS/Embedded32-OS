import { CANFrame } from "./CANTypes.js";
import { ICANDriver } from "./CANDriver.js";

// Lazy require so the package can still be built without socketcan installed
let socketcan: any;
try {
  // @ts-ignore
  socketcan = await import("socketcan");
} catch {
  socketcan = null;
}

export class SocketCANDriver implements ICANDriver {
  private channel: any;

  constructor(iface: string = "can0") {
    if (!socketcan) {
      throw new Error("socketcan module not installed. Run: npm install socketcan");
    }
    this.channel = socketcan.createRawChannel(iface, true);
    this.channel.start();
  }

  send(frame: CANFrame) {
    this.channel.send({
      id: frame.id,
      data: Buffer.from(frame.data),
      ext: frame.extended ?? true
    });
  }

  onMessage(handler: (frame: CANFrame) => void) {
    this.channel.addListener("onMessage", (msg: any) => {
      handler({
        id: msg.id,
        data: Array.from(msg.data),
        extended: msg.ext,
        timestamp: Date.now()
      });
    });
  }

  close() {
    this.channel.stop();
  }
}
