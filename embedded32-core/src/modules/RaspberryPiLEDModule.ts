import { BaseModule } from "./Module.js";
import { Gpio } from "onoff";

export class RaspberryPiLEDModule extends BaseModule {
  private gpio: Gpio | null = null;
  private blinkInterval: any = null;
  private state: "on" | "off" = "off";

  constructor(
    name = "rpi-led",
    private pin: number = 17,        // default: GPIO17 (BCM)
    private activeLow: boolean = false
  ) {
    super(name, "1.0.0");
  }

  onInit() {
    this.log(`Initializing Raspberry Pi LED on GPIO ${this.pin}`);
    this.gpio = new Gpio(this.pin, "out");
    if (this.activeLow) {
      // For active-low configuration, we'd need additional setup
      // Most LEDs are active-high, so default is fine
    }
    this.setHardware(false);
  }

  onStart() {
    this.log("Raspberry Pi LED module started");

    // Topics are namespaced to avoid collisions
    this.bus.subscribe("gpio.led.on", () => this.turnOn());
    this.bus.subscribe("gpio.led.off", () => this.turnOff());
    this.bus.subscribe("gpio.led.blink", (msg: any) =>
      this.blink(msg.payload?.interval || 500)
    );
  }

  private setHardware(on: boolean) {
    if (!this.gpio) return;
    this.gpio.writeSync(on ? 1 : 0);
    this.state = on ? "on" : "off";
  }

  private turnOn() {
    this.clearBlink();
    this.setHardware(true);
    this.log("LED turned ON (GPIO)");
  }

  private turnOff() {
    this.clearBlink();
    this.setHardware(false);
    this.log("LED turned OFF (GPIO)");
  }

  private blink(interval: number) {
    this.clearBlink();
    this.log(`LED blinking every ${interval}ms (GPIO)`);

    this.blinkInterval = this.scheduler.every(interval, () => {
      const next = this.state === "on" ? false : true;
      this.setHardware(next);
      this.log(`LED ${this.state} (GPIO)`);
    });
  }

  private clearBlink() {
    if (this.blinkInterval) {
      this.scheduler.clear(this.blinkInterval);
      this.blinkInterval = null;
    }
  }

  onStop() {
    this.log("Raspberry Pi LED module stopped");

    this.clearBlink();
    if (this.gpio) {
      this.setHardware(false);
      this.gpio.unexport();
      this.gpio = null;
    }
  }
}
