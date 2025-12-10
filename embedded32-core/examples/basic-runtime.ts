/**
 * Basic Runtime Example
 */

import { Runtime, BaseModule } from "../src";

/**
 * Example motor module
 */
class MotorModule extends BaseModule {
  onInit() {
    this.log("Motor module initialized");
  }

  onStart() {
    this.log("Motor module started");

    // Listen for speed control messages
    this.bus.subscribe("motor.speed.set", (msg: any) => {
      this.log(`Motor speed set to: ${msg.payload.value}`);
    });

    // Notify system that motor is ready
    this.bus.publish("motor.ready", { status: "ready" });
  }

  onStop() {
    this.log("Motor module stopped");
  }
}

/**
 * Example sensor module
 */
class SensorModule extends BaseModule {
  private intervalId: any;

  onStart() {
    this.log("Sensor module started");

    // Use scheduler instead of raw setInterval
    this.intervalId = this.scheduler.every(5000, () => {
      const value = Number((Math.random() * 100).toFixed(2));
      this.bus.publish("sensor.data", {
        type: "temperature",
        value,
        timestamp: Date.now(),
      });
    });
  }

  onStop() {
    this.log("Sensor module stopped");
    if (this.intervalId) this.scheduler.clear(this.intervalId);
  }
}

/**
 * Main
 */
async function main() {
  const runtime = new Runtime({
    logLevel: "info",
    configPath: "./config.json",
  });

  runtime.registerModule(new MotorModule("motor"));
  runtime.registerModule(new SensorModule("sensor"));

  await runtime.start();

  // Publish a test message
  runtime.getMessageBus().publish("motor.speed.set", { value: 50 });

  setTimeout(async () => {
    await runtime.stop();
    process.exit(0);
  }, 10000);
}

main().catch(console.error);
