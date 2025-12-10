/**
 * Basic Runtime Example
 * 
 * Demonstrates how to use embedded32-core to create a simple runtime
 * with custom modules and message bus communication.
 */

import { Runtime, BaseModule } from '../src';

/**
 * Example motor module
 */
class MotorModule extends BaseModule {
  onInit() {
    this.log("Motor module initialized");
  }

  onStart() {
    this.log("Motor module started");

    // Subscribe to speed control messages
    this.bus.subscribe("motor.speed.set", async (msg: any) => {
      this.log(`Motor speed set to: ${msg.payload.value}`);
    });

    // Publish a ready message
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
  private readingInterval: any;

  onStart() {
    this.log("Sensor module started");

    // Simulate periodic sensor readings
    this.readingInterval = setInterval(async () => {
      const value = Math.random() * 100;
      this.bus.publish("sensor.data", { 
        type: "temperature", 
        value: value.toFixed(2),
        timestamp: Date.now()
      });
    }, 5000);
  }

  onStop() {
    this.log("Sensor module stopped");
    if (this.readingInterval) {
      clearInterval(this.readingInterval);
    }
  }
}

/**
 * Main function
 */
async function main() {
  // Create runtime instance
  const runtime = new Runtime({
    logLevel: "info",
    configPath: "./config.json"
  });

  // Register modules
  runtime.registerModule(new MotorModule("motor"));
  runtime.registerModule(new SensorModule("sensor"));

  // Start the runtime
  await runtime.start();

  // Publish a test message
  const bus = runtime.getMessageBus();
  bus.publish("motor.speed.set", { value: 50 });

  // Keep running for 10 seconds
  setTimeout(async () => {
    await runtime.stop();
    process.exit(0);
  }, 10000);
}

// Run the example
main().catch(console.error);
