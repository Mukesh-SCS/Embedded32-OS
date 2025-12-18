/**
 * Embedded32 SDK Example - Engine Monitor
 * 
 * Demonstrates how to use the SDK to:
 * 1. Connect to a J1939 network
 * 2. Subscribe to engine data
 * 3. Request specific PGNs
 * 4. Send control commands
 * 
 * Run with: npx ts-node examples/engine-monitor.ts
 */

import { J1939Client, PGN, SA } from '../src/index.js';

async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║      Embedded32 SDK - Engine Monitor          ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  // Create client as a diagnostic tool
  const client = new J1939Client({
    interface: 'vcan0',
    sourceAddress: SA.DIAG_TOOL_2,  // 0xFA
    debug: true
  });

  // Track engine state
  const engineState = {
    rpm: 0,
    torque: 0,
    coolantTemp: 0,
    messageCount: 0
  };

  try {
    // Connect to the network
    await client.connect();
    console.log('\n✅ Connected to J1939 network\n');

    // Subscribe to Engine Controller (EEC1)
    client.onPGN(PGN.EEC1, (msg) => {
      engineState.rpm = msg.spns.engineSpeed as number;
      engineState.torque = msg.spns.torque as number;
      engineState.messageCount++;
      console.log(`🔧 Engine: ${engineState.rpm.toFixed(1)} RPM, ${engineState.torque}% torque`);
    });

    // Subscribe to Engine Temperature
    client.onPGN(PGN.ET1, (msg) => {
      engineState.coolantTemp = msg.spns.coolantTemp as number;
      console.log(`🌡️  Coolant: ${engineState.coolantTemp}°C`);
    });

    // Subscribe to Transmission
    client.onPGN(PGN.PROP_TRANS_STATUS, (msg) => {
      console.log(`⚙️  Transmission: Gear ${msg.spns.gear}`);
    });

    // Request initial data
    console.log('\n📡 Requesting initial data...\n');
    await client.requestPGN(PGN.EEC1);
    await client.requestPGN(PGN.ET1);

    // After 5 seconds, send engine control command
    setTimeout(async () => {
      console.log('\n🎮 Sending engine control command: Target 1200 RPM\n');
      await client.sendPGN(PGN.ENGINE_CONTROL_CMD, {
        targetRpm: 1200,
        enable: true
      });
    }, 5000);

    // Run for 15 seconds
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('Session Summary:');
    console.log(`  Messages received: ${engineState.messageCount}`);
    console.log(`  Final RPM: ${engineState.rpm.toFixed(1)}`);
    console.log(`  Final Coolant Temp: ${engineState.coolantTemp}°C`);
    console.log('═══════════════════════════════════════════════\n');

  } finally {
    await client.disconnect();
    console.log('Disconnected\n');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
