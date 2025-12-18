/**
 * Canonical Example: JS SDK Engine Monitor
 * 
 * This is the reference JS SDK client that:
 * 1. Connects to the simulation
 * 2. Subscribes to engine data (EEC1, ET1)
 * 3. Displays decoded SPNs in real-time
 * 
 * Usage:
 *   node examples/canonical/js-monitor.mjs
 * 
 * Prerequisites:
 *   - Simulation running: npx embedded32 simulate vehicle/basic-truck
 */

import { J1939Client, PGN, SA } from '../../embedded32-sdk-js/dist/index.js';

console.log('╔════════════════════════════════════════╗');
console.log('║   Embedded32 JS SDK - Engine Monitor   ║');
console.log('╚════════════════════════════════════════╝');
console.log();

// Create client
const client = new J1939Client({
  interface: 'vcan0',
  sourceAddress: SA.DIAG_TOOL_1,  // 0xF9
  transport: 'virtual',
  debug: false
});

// Track state
let lastRpm = 0;
let lastCoolant = 0;
let messageCount = 0;

// Subscribe to Engine Controller 1 (EEC1)
client.onPGN(PGN.EEC1, (msg) => {
  messageCount++;
  const rpm = msg.spns?.engineSpeed ?? 0;
  const torque = msg.spns?.actualTorque ?? 0;
  
  // Only print if RPM changed
  if (Math.abs(rpm - lastRpm) > 5) {
    console.log(`[JS SDK] Engine Speed: ${rpm.toFixed(0)} RPM (torque: ${torque}%)`);
    lastRpm = rpm;
  }
});

// Subscribe to Engine Temperature 1 (ET1)
client.onPGN(PGN.ET1, (msg) => {
  messageCount++;
  const coolant = msg.spns?.coolantTemp ?? 0;
  
  if (coolant !== lastCoolant) {
    if (coolant > 105) {
      console.log(`[JS SDK] WARNING: Coolant temp rising!`);
      console.log(`[JS SDK] Coolant: ${coolant}°C - OVERHEAT CONDITION`);
    } else if (coolant > 95) {
      console.log(`[JS SDK] Coolant: ${coolant}°C`);
    }
    lastCoolant = coolant;
  }
});

// Connect
console.log(`[JS SDK] Connecting as SA=0x${SA.DIAG_TOOL_1.toString(16).toUpperCase()}...`);
await client.connect();
console.log('[JS SDK] Connected');
console.log('[JS SDK] Subscribed to PGN 0xF004 (EEC1)');
console.log('[JS SDK] Subscribed to PGN 0xFEEE (ET1)');
console.log('[JS SDK] Waiting for engine data...');
console.log();

// Request initial data
await client.requestPGN(PGN.EEC1);
await client.requestPGN(PGN.ET1);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log();
  console.log('─'.repeat(40));
  console.log(`[JS SDK] Received ${messageCount} messages`);
  console.log('[JS SDK] Disconnecting...');
  await client.disconnect();
  console.log('[JS SDK] Goodbye!');
  process.exit(0);
});

// Keep running
console.log('Press Ctrl+C to exit');
console.log('─'.repeat(40));

// Keep the process alive
setInterval(() => {
  // Poll for any pending messages
}, 100);
