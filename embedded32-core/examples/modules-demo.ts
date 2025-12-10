/**
 * Modules Demo Example
 * 
 * Demonstrates the HeartbeatModule, LEDModule, and CANGatewayModule
 * working together with the message bus for inter-module communication.
 */

import { Runtime, HeartbeatModule, LEDModule, CANGatewayModule } from "../src";

async function main() {
  const runtime = new Runtime({ logLevel: "info" });

  // Register all modules
  runtime.registerModule(new HeartbeatModule());
  runtime.registerModule(new LEDModule());
  runtime.registerModule(new CANGatewayModule());

  // Start the runtime
  await runtime.start();

  // Get message bus for publishing events
  const bus = runtime.getMessageBus();

  // Trigger LED actions
  bus.publish("led.on", {});
  setTimeout(() => bus.publish("led.blink", { interval: 300 }), 2000);
  setTimeout(() => bus.publish("led.off", {}), 6000);

  // Send internal → CAN
  bus.publish("can.tx", { id: 0x200, data: [1, 2, 3] });

  // Keep running for 15 seconds
  setTimeout(async () => {
    await runtime.stop();
    process.exit(0);
  }, 15000);
}

main().catch(console.error);
