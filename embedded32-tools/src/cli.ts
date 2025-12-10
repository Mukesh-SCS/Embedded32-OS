#!/usr/bin/env node

import { Runtime } from "@embedded32/core";
import { HeartbeatModule } from "@embedded32/core/dist/modules/HeartbeatModule.js";
import { SystemHealthModule } from "@embedded32/core/dist/modules/SystemHealthModule.js";
import { J1939EngineModule } from "@embedded32/core/dist/modules/J1939EngineModule.js";
import { J1939GatewayModule } from "@embedded32/core/dist/modules/J1939GatewayModule.js";

function printHelp() {
  console.log(`
Embedded32 CLI

Usage:
  embedded32 demo:j1939 [--iface can0]

Commands:
  demo:j1939      Run J1939 engine + gateway demo
`);
}

async function runJ1939Demo(iface: string) {
  const runtime = new Runtime({
    logLevel: "info",
    configPath: "./config.json"
  });

  runtime.registerModule(new HeartbeatModule());
  runtime.registerModule(new SystemHealthModule());
  runtime.registerModule(new J1939EngineModule());
  runtime.registerModule(new J1939GatewayModule("j1939-gw", iface));

  await runtime.start();

  console.log(`J1939 demo running on ${iface}. Press Ctrl+C to exit.`);

  const bus = runtime.getMessageBus();
  bus.subscribe("j1939.tx", (msg: any) => {
    console.log("J1939 TX:", msg.payload);
  });

  bus.subscribe("j1939.rx", (msg: any) => {
    console.log("J1939 RX:", msg.payload);
  });

  // Start engine
  bus.publish("engine.command", { cmd: "start" });

  process.on("SIGINT", async () => {
    console.log("\nStopping runtime...");
    await runtime.stop();
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }

  if (cmd === "demo:j1939") {
    const ifaceIndex = args.indexOf("--iface");
    const iface = ifaceIndex !== -1 ? args[ifaceIndex + 1] : "can0";
    await runJ1939Demo(iface);
    return;
  }

  console.error("Unknown command:", cmd);
  printHelp();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
