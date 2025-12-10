import { BaseModule } from "./Module.js";

export class HeartbeatModule extends BaseModule {
  private intervalId: any;

  constructor(name = "heartbeat", private interval = 1000) {
    super(name, "1.0.0");
  }

  onInit() {
    this.log("Heartbeat module initialized");
  }

  onStart() {
    this.log(`Heartbeat started (interval: ${this.interval}ms)`);

    this.intervalId = this.scheduler.every(this.interval, () => {
      this.bus.publish("system.heartbeat", {
        timestamp: Date.now(),
        module: this.name,
      });
    });
  }

  onStop() {
    this.log("Heartbeat module stopped");
    if (this.intervalId) this.scheduler.clear(this.intervalId);
  }
}
