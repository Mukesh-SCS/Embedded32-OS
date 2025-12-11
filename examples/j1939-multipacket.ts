/**
 * J1939 Multi-Packet (TP) Example
 *
 * Demonstrates:
 * - BAM (Broadcast Announce Message) for broadcast multi-packet
 * - RTS/CTS (Request-to-Send/Clear-to-Send) for point-to-point
 * - Reassembly of fragmented messages
 * - Session management
 */

import { J1939TransportProtocol, parseBAM, parseRTS, parseCTS } from "@embedded32/j1939";

async function multiPacketExample(): Promise<void> {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  J1939 Multi-Packet (TP) Example       ║");
  console.log("╚════════════════════════════════════════╝\n");

  const tp = new J1939TransportProtocol();

  // ========== 1. BAM Session ==========
  console.log("1. BAM Session (Broadcast)");
  console.log("─".repeat(40));

  // Create a 50-byte message (requires 8 packets of 7 bytes each)
  const totalBytes = 50;
  const requiredPackets = Math.ceil(totalBytes / 7);

  console.log(`Message size: ${totalBytes} bytes`);
  console.log(`Packets needed: ${requiredPackets}`);

  // Start BAM session for PGN 0xFEF1 (Cruise Control / Vehicle Speed)
  const pgn = 0xfef1;
  const bamSession = tp.startBAM(pgn, totalBytes, requiredPackets);

  console.log(`BAM Session started:`);
  console.log(`  PGN: 0x${pgn.toString(16).toUpperCase().padStart(5, "0")}`);
  console.log(`  Total bytes: ${bamSession.messageLength}`);
  console.log(`  Packets: ${bamSession.numberOfPackets}`);

  // Simulate receiving packets
  console.log(`\nReceiving packets...`);
  for (let i = 1; i <= requiredPackets; i++) {
    // Each packet contains 7 bytes of actual data
    const packetData = Array.from({ length: 7 }, (_, j) => (i - 1) * 7 + j);
    tp.addBAMPacket(pgn, i, packetData);
    console.log(`  Packet ${i}: ${packetData.join(", ")}`);
  }

  // Verify assembly
  if (bamSession.complete) {
    console.log(`\n✅ BAM Assembly complete: ${bamSession.assembledData.length} bytes received`);
  }

  // ========== 2. RTS/CTS Session ==========
  console.log("\n2. RTS/CTS Session (Point-to-Point)");
  console.log("─".repeat(40));

  // Create 100-byte message (requires 15 packets)
  const totalBytes2 = 100;
  const requiredPackets2 = Math.ceil(totalBytes2 / 7);
  const rtsSessionPgn = 0xfef2;
  const destinationAddress = 0x03;

  console.log(`Message size: ${totalBytes2} bytes`);
  console.log(`Packets needed: ${requiredPackets2}`);

  // Start RTS session
  const rtsSession = tp.startRTS(rtsSessionPgn, totalBytes2, requiredPackets2, destinationAddress);

  console.log(`\nRTS Session started:`);
  console.log(`  PGN: 0x${rtsSessionPgn.toString(16).toUpperCase().padStart(5, "0")}`);
  console.log(`  Destination: 0x${destinationAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  State: ${rtsSession.state}`);

  // Simulate CTS response
  console.log(`\nReceiving CTS response...`);
  const ctsData = [0x05, 0x0f, 0x00, 0x00, 0xf2, 0xfe, 0x00, 0xff];
  const cts = parseCTS(ctsData);
  console.log(`  Next packet: ${cts.nextPacketNumber}`);
  console.log(`  Packets to send: ${cts.numberOfPackets}`);

  tp.processCTS(rtsSessionPgn, destinationAddress, cts);
  console.log(`  State: ${rtsSession.state}`);

  // Simulate sending all packets
  console.log(`\nSending packets...`);
  for (let i = 1; i <= requiredPackets2; i++) {
    const packetData = Array.from({ length: 7 }, (_, j) => (i - 1) * 7 + j);
    tp.addRTSPacket(rtsSessionPgn, destinationAddress, i, packetData);

    if (i % 5 === 0) {
      console.log(`  Packets 1-${i} sent`);
    }
  }

  // Verify assembly
  if (rtsSession.complete) {
    console.log(`\n✅ RTS Assembly complete: ${rtsSession.assembledData.length} bytes received`);
    console.log(`  Final state: ${rtsSession.state}`);
  }

  // ========== 3. Session Status ==========
  console.log("\n3. Session Status");
  console.log("─".repeat(40));

  const status = tp.getStatus();
  console.log(`Active BAM sessions: ${status.activeBamSessions}`);
  console.log(`Active RTS sessions: ${status.activeRtsSessions}`);
  console.log(`Complete BAM messages: ${status.completeBamMessages}`);
  console.log(`Complete RTS messages: ${status.completeRtsMessages}`);

  // ========== 4. BAM Message Parsing Example ==========
  console.log("\n4. BAM Message Parsing");
  console.log("─".repeat(40));

  // BAM frame format: [PS1, PS2, Reserved, Reserved, PGN_HP, PGN_MB, PGN_LB, Reserved]
  const bamFrameData = [
    50,      // Byte 0: Total length LSB
    0,       // Byte 1: Total length MSB
    8,       // Byte 2: Number of packets
    0,       // Byte 3: Reserved
    0xf1,   // Byte 4: PGN LSB
    0xfe,   // Byte 5: PGN middle
    0x00,   // Byte 6: PGN MSB (parts)
    0xff,   // Byte 7: Reserved
  ];

  const bamParsed = parseBAM(bamFrameData);
  console.log(`Parsed BAM message:`);
  console.log(`  Message length: ${bamParsed.messageLength} bytes`);
  console.log(`  Number of packets: ${bamParsed.numberOfPackets}`);
  console.log(`  PGN: 0x${bamParsed.pgn.toString(16).toUpperCase().padStart(5, "0")}`);

  // ========== 5. Cleanup ==========
  console.log("\n5. Session Cleanup");
  console.log("─".repeat(40));

  tp.cleanup(1000);
  const finalStatus = tp.getStatus();
  console.log(`After cleanup:`);
  console.log(`  Active BAM sessions: ${finalStatus.activeBamSessions}`);
  console.log(`  Active RTS sessions: ${finalStatus.activeRtsSessions}`);

  console.log("\n✅ Multi-packet example completed");
}

// Run example
multiPacketExample().catch(console.error);
