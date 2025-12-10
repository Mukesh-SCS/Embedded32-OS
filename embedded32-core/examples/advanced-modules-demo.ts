/**
 * Advanced Modules Demo
 * 
 * Comprehensive example showcasing all available modules:
 * - HeartbeatModule: Periodic heartbeat signals
 * - SystemHealthModule: System monitoring and heartbeat supervision
 * - LEDModule: Software LED control
 * - RaspberryPiLEDModule: Hardware GPIO LED control (requires Raspberry Pi)
 * - CANGatewayModule: CAN bus gateway (simulation)
 * - J1939EngineModule: J1939 engine ECU simulation
 */

import {
  Runtime,
  HeartbeatModule,
  SystemHealthModule,
  LEDModule,
  RaspberryPiLEDModule,
  CANGatewayModule,
  J1939EngineModule,
} from "../src";

async function main() {
  const runtime = new Runtime({ logLevel: "info" });

  // System monitoring modules
  runtime.registerModule(new HeartbeatModule("heartbeat", 1000));
  runtime.registerModule(new SystemHealthModule("health", 5000, 2000));

  // LED modules (choose based on platform)
  runtime.registerModule(new LEDModule("led-software"));
  
  // Uncomment on Raspberry Pi:
  // runtime.registerModule(new RaspberryPiLEDModule("rpi-led", 17));

  // CAN and J1939 modules
  runtime.registerModule(new CANGatewayModule("can-gateway"));
  runtime.registerModule(new J1939EngineModule("j1939-engine"));

  // Start the runtime
  await runtime.start();

  // Get message bus for publishing events
  const bus = runtime.getMessageBus();

  // Subscribe to system health updates
  bus.subscribe("system.health", (msg: any) => {
    console.log("\n[HEALTH]", {
      load: msg.payload.loadAverage,
      memory: `${msg.payload.memoryRssMb} MB`,
      uptime: `${msg.payload.uptimeSeconds}s`,
    });
  });

  // Subscribe to J1939 engine data
  bus.subscribe("j1939.tx", (msg: any) => {
    if (msg.payload.pgn === 0xf004) {
      console.log("[J1939] Engine:", {
        rpm: msg.payload.rpm,
        torque: `${msg.payload.torquePercent}%`,
      });
    }
  });

  // Subscribe to CAN messages
  bus.subscribe("can.rx", (msg: any) => {
    console.log("[CAN RX]", msg.payload);
  });

  // Demo sequence
  console.log("\n=== Starting Demo Sequence ===\n");

  // 1. Control software LED
  setTimeout(() => {
    console.log("\n--- Software LED: ON ---");
    bus.publish("led.on", {});
  }, 1000);

  setTimeout(() => {
    console.log("\n--- Software LED: BLINK ---");
    bus.publish("led.blink", { interval: 300 });
  }, 3000);

  setTimeout(() => {
    console.log("\n--- Software LED: OFF ---");
    bus.publish("led.off", {});
  }, 6000);

  // 2. Control Raspberry Pi GPIO LED (if available)
  // Uncomment these on Raspberry Pi:
  /*
  setTimeout(() => {
    console.log("\n--- GPIO LED: ON ---");
    bus.publish("gpio.led.on", {});
  }, 7000);

  setTimeout(() => {
    console.log("\n--- GPIO LED: BLINK ---");
    bus.publish("gpio.led.blink", { interval: 200 });
  }, 9000);

  setTimeout(() => {
    console.log("\n--- GPIO LED: OFF ---");
    bus.publish("gpio.led.off", {});
  }, 12000);
  */

  // 3. Control J1939 engine
  setTimeout(() => {
    console.log("\n--- ENGINE: START ---");
    bus.publish("engine.command", { cmd: "start" });
  }, 8000);

  setTimeout(() => {
    console.log("\n--- ENGINE: STOP ---");
    bus.publish("engine.command", { cmd: "stop" });
  }, 15000);

  // 4. Send CAN message
  setTimeout(() => {
    console.log("\n--- CAN TX ---");
    bus.publish("can.tx", { id: 0x200, data: [0xaa, 0xbb, 0xcc] });
  }, 10000);

  // Keep running for 20 seconds
  setTimeout(async () => {
    console.log("\n=== Demo Complete ===\n");
    await runtime.stop();
    process.exit(0);
  }, 20000);
}

main().catch(console.error);
