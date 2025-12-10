import { BaseModule } from "./Module.js";

export class CANGatewayModule extends BaseModule {
  private can: any; // TODO Placeholder for actual CAN interface (future embedded32-can)

  constructor(name = "can-gateway") {
    super(name, "1.0.0");
  }

  onInit() {
    this.log("CAN Gateway initialized");

    // TODO: Replace with real CAN interface once embedded32-can is ready
    this.can = {
      send: (frame: any) => this.log("CAN TX:", frame),
      onMessage: (handler: any) => {
        // Simulated CAN listener
        setInterval(() => {
          handler({
            id: 0x123,
            data: [0x01, 0x02, 0x03],
            timestamp: Date.now(),
          });
        }, 3000);
      },
    };
  }

  onStart() {
    this.log("CAN Gateway started");

    // Forward CAN messages → message bus
    this.can.onMessage((frame: any) => {
      this.bus.publish("can.rx", frame);
    });

    // Listen for internal messages → send to CAN
    this.bus.subscribe("can.tx", (msg: any) => {
      this.can.send(msg.payload);
    });

    this.log("CAN Gateway connected (simulation mode)");
  }

  onStop() {
    this.log("CAN Gateway stopped");
  }
}
