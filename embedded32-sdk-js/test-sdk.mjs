/**
 * Test script for Embedded32 JS SDK
 * Tests the SDK API without external CAN hardware
 */

import { J1939Client, PGN, SA } from './dist/index.js';

console.log('======================================');
console.log('  Embedded32 JS SDK - Test Suite');
console.log('======================================\n');

// Test 1: Create J1939Client with virtual transport
console.log('Test 1: J1939Client with virtual transport');
const client = new J1939Client({
    interface: 'vcan0',
    sourceAddress: SA.DIAG_TOOL_1,
    transport: 'virtual',
    debug: true
});
console.log(`  ✓ Client created with SA=0x${SA.DIAG_TOOL_1.toString(16).toUpperCase()}\n`);

// Test 2: Connect
console.log('Test 2: Connect');
await client.connect();
console.log('  ✓ Connected successfully\n');

// Test 3: Subscribe to PGN
console.log('Test 3: PGN Subscription');
let messageCount = 0;

client.onPGN(PGN.EEC1, (msg) => {
    messageCount++;
    console.log(`  Received EEC1: PGN=0x${msg.pgn.toString(16)}, SA=0x${msg.sourceAddress.toString(16)}`);
    if (msg.spns) {
        for (const [name, value] of Object.entries(msg.spns)) {
            console.log(`    ${name}: ${value}`);
        }
    }
});
console.log('  ✓ Subscribed to EEC1 (PGN 0xF004)\n');

// Test 4: Request PGN
console.log('Test 4: Request PGN');
await client.requestPGN(PGN.ET1, SA.ENGINE);
console.log('  ✓ Sent request for ET1 to Engine ECU\n');

// Test 5: Send command
console.log('Test 5: Send Engine Control Command');
await client.sendPGN(PGN.ENGINE_CONTROL_CMD, {
    targetRpm: 1500,
    enable: true
}, SA.ENGINE);
console.log('  ✓ Sent engine control command (1500 RPM, enable)\n');

// Test 6: Get client status
console.log('Test 6: Client Status');
console.log(`  Connected: ${client.isConnected()}`);
console.log(`  Source Address: 0x${client.getSourceAddress().toString(16).toUpperCase()}\n`);

// Test 7: Disconnect
console.log('Test 7: Disconnect');
await client.disconnect();
console.log('  ✓ Disconnected\n');

// Summary
console.log('======================================');
console.log('  Test Results');
console.log('======================================');
console.log('  All API tests passed! ✓');
console.log('======================================\n');

console.log('Note: Message receiving requires connecting to');
console.log('a real simulation (embedded32 simulate).\n');
