/**
 * J1939 Diagnostics Example
 *
 * Demonstrates:
 * - Processing DM1 messages (active diagnostic trouble codes)
 * - Extracting lamp status and DTCs
 * - Filtering by SPN/FMI
 * - Generating diagnostic reports
 */

import { DiagnosticsManager, DiagnosticTroubleCode } from "@embedded32/j1939";

async function diagnosticsExample(): Promise<void> {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  J1939 Diagnostics Example             ║");
  console.log("╚════════════════════════════════════════╝\n");

  const dm = new DiagnosticsManager();

  // ========== 1. Simulate DM1 Message ==========
  console.log("1. Processing DM1 Messages (Active DTCs)");
  console.log("─".repeat(40));

  // DM1 format: Byte 0 = lamp status, Bytes 1-4 = DTC 1, Bytes 5-8 = DTC 2
  // Lamp status bits: Bit 2=MIL, Bit 3=Flash, Bit 5=Amber, Bit 6=Protect
  // DTC format: Bytes 0-2 = SPN (21 bits), Byte 2 bit 5 = CM, Byte 3 = FMI (5 bits) + OC (3 bits)

  // Example DM1: Device at SA=0x01, MIL lamp on, SPN=6393 (Engine Speed), FMI=9 (Condition Exists)
  // Byte 0: 0x04 (MIL bit set)
  // Bytes 1-4: SPN 6393 = 0x18E9, little-endian = [0xE9, 0x18, 0x00, FMI=0x09]
  const dm1Data1 = [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00];
  const msg1 = dm.processDM1(0x01, dm1Data1);

  if (msg1) {
    console.log(`Device SA=0x${msg1.sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
    console.log(`  MIL Status: ${msg1.lamps.mil ? "ON" : "OFF"}`);
    console.log(`  Flash: ${msg1.lamps.flash ? "ON" : "OFF"}`);
    console.log(`  Amber: ${msg1.lamps.amber ? "ON" : "OFF"}`);
    console.log(`  Protect: ${msg1.lamps.protect ? "ON" : "OFF"}`);
    console.log(`  Active DTCs: ${msg1.activeDTCs.length}`);

    for (const dtc of msg1.activeDTCs) {
      console.log(`    - SPN ${dtc.spn}: ${dtc.spnDescription}`);
      console.log(`      FMI ${dtc.fmi}: ${dtc.fmiDescription}`);
      console.log(`      Occurrence: ${dtc.oc}`);
    }
  }

  // ========== 2. Multiple Devices ==========
  console.log("\n2. Processing Multiple Devices");
  console.log("─".repeat(40));

  // Device 0x02: Different fault
  // SPN=26 (Engine Coolant Temperature), FMI=1 (Below Normal)
  const dm1Data2 = [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00];
  dm.processDM1(0x02, dm1Data2);

  // Device 0x03: Multiple flags
  // Amber + Protect lamps, SPN=4794 (DEF Tank Level), FMI=0 (Above Normal)
  const dm1Data3 = [0x60, 0xaa, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00];
  dm.processDM1(0x03, dm1Data3);

  // ========== 3. Diagnostic Summary ==========
  console.log("\n3. Diagnostic Summary");
  console.log("─".repeat(40));

  const summary = dm.getSummary();
  console.log(`Total Active DTCs: ${summary.totalActiveDTCs}`);
  console.log(`Device Count: ${summary.deviceCount}`);
  console.log(`Lamp Status:`);
  console.log(`  MIL: ${summary.lampStatus.mil} devices`);
  console.log(`  Amber: ${summary.lampStatus.amber} devices`);
  console.log(`  Protect: ${summary.lampStatus.protect} devices`);
  console.log(`Critical Faults: ${summary.hasCriticalFaults ? "YES" : "NO"}`);

  // ========== 4. Get All Active DTCs ==========
  console.log("\n4. All Active DTCs");
  console.log("─".repeat(40));

  const allDTCs = dm.getActiveDTCs();
  console.log(`Total: ${allDTCs.length} codes\n`);

  for (const dtc of allDTCs) {
    console.log(dm.formatDTC(dtc));
  }

  // ========== 5. Filter by Device ==========
  console.log("\n5. Device-Specific DTCs");
  console.log("─".repeat(40));

  const device1DTCs = dm.getActiveDTCs(0x01);
  console.log(`Device 0x01: ${device1DTCs.length} active DTC(s)`);
  for (const dtc of device1DTCs) {
    console.log(`  ${dm.formatDTC(dtc)}`);
  }

  // ========== 6. DM2 Message (Previously Active) ==========
  console.log("\n6. Processing DM2 Messages (Previously Active DTCs)");
  console.log("─".repeat(40));

  // Simulate DM2: Historical fault that's no longer active
  const dm2Data = [0x00, 0x1a, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00];
  const dm2Msg = dm.processDM1(0x01, dm2Data); // Using processDM1 for this example

  if (dm2Msg) {
    console.log(`Device SA=0x${dm2Msg.sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
    console.log(`Previously Active DTCs: ${dm2Msg.activeDTCs.length}`);
  }

  console.log("\n✅ Diagnostics example completed");
}

// Run example
diagnosticsExample().catch(console.error);
