import { BaseModule } from "./Module.js";

export class LEDModule extends BaseModule {
  private blinkInterval: any = null;
  private state: "on" | "off" = "off";

  constructor(name = "led") {
    super(name, "1.0.0");
  }

  onInit() {
    this.log("LED module initialized");
  }

  onStart() {
    this.log("LED module started");

    this.bus.subscribe("led.on", () => this.turnOn());
    this.bus.subscribe("led.off", () => this.turnOff());
    this.bus.subscribe("led.blink", (msg: any) => this.blink(msg.payload?.interval || 500));
  }

  private turnOn() {
    this.clearBlink();
    this.state = "on";
    this.log("LED turned ON");
  }

  private turnOff() {
    this.clearBlink();
    this.state = "off";
    this.log("LED turned OFF");
  }

  private blink(interval: number) {
    this.clearBlink();
    this.log(`LED blinking every ${interval}ms`);

    this.blinkInterval = this.scheduler.every(interval, () => {
      this.state = this.state === "on" ? "off" : "on";
      this.log(`LED ${this.state}`);
    });
  }

  private clearBlink() {
    if (this.blinkInterval) {
      this.scheduler.clear(this.blinkInterval);
      this.blinkInterval = null;
    }
  }

  onStop() {
    this.clearBlink();
    this.log("LED module stopped");
  }
}
