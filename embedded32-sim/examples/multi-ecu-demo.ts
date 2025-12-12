/**
 * Multi-ECU Simulation Demo
 * 
 * Demonstrates comprehensive vehicle simulation with:
 * - Engine Controller (PGN F004, FEE9, FEF2)
 * - Transmission Controller (PGN F003, F00C, FE6C)
 * - Brake Controller (PGN FEEE, FEAE)
 * - Aftertreatment Controller (PGN FEDF, FEEF, FEE5)
 * 
 * This creates a realistic multi-ECU J1939 network similar to real vehicles.
 */

import { VehicleSimulator, EngineSimulator } from "../src/index.js";

console.log("🚛 Embedded32 Multi-ECU Vehicle Simulator");
console.log("==========================================\n");

// Create a full vehicle simulation with all ECUs enabled
const simulator = new VehicleSimulator({
  enabled: {
    engine: true,
    transmission: true,
    aftertreatment: true,
    brakes: true,
  },
  scenario: EngineSimulator.getAccelerationScenario(),
  broadcastInterval: 100, // Broadcast J1939 messages every 100ms
});

// Track total messages broadcast
let messageCount = 0;
let uniquePGNs = new Set<number>();

// Listen to J1939 message broadcasts
simulator.on("message", (messages: any[]) => {
  messageCount += messages.length;
  
  messages.forEach(msg => {
    uniquePGNs.add(msg.pgn);
    
    const pgnHex = `0x${msg.pgn.toString(16).toUpperCase().padStart(4, '0')}`;
    const saHex = `0x${msg.sa.toString(16).toUpperCase().padStart(2, '0')}`;
    const dataHex = msg.data.map((b: number) => 
      `0x${b.toString(16).toUpperCase().padStart(2, '0')}`
    ).join(' ');
    
    console.log(`[J1939] ${msg.name}`);
    console.log(`  PGN: ${pgnHex} | SA: ${saHex} | Data: [${dataHex}]`);
  });
  console.log(`\n--- Broadcast complete (${messages.length} PGNs) ---\n`);
});

// Listen to simulation state updates
simulator.on("tick", (data: any) => {
  const { engine, vehicleSpeed } = data;
  
  console.log(`📊 Vehicle State Update`);
  console.log(`  Engine RPM: ${engine.rpm.toFixed(0)} rpm`);
  console.log(`  Engine Load: ${engine.load.toFixed(1)}%`);
  console.log(`  Coolant Temp: ${engine.coolantTemp.toFixed(1)}°C`);
  console.log(`  Fuel Rate: ${engine.fuelRate.toFixed(2)} L/h`);
  console.log(`  Vehicle Speed: ${vehicleSpeed.toFixed(1)} km/h`);
  console.log(`  Instant Fuel Economy: ${engine.instantFuelEconomy.toFixed(2)} km/L`);
  console.log();
});

// Start the simulation
console.log("🟢 Starting simulation with acceleration scenario...\n");
simulator.start();

// Run for 15 seconds to see the full acceleration cycle
setTimeout(() => {
  simulator.stop();
  
  console.log("\n🔴 Simulation stopped\n");
  console.log("📈 Statistics:");
  console.log(`  Total J1939 messages broadcast: ${messageCount}`);
  console.log(`  Unique PGNs transmitted: ${uniquePGNs.size}`);
  console.log(`  PGNs: ${Array.from(uniquePGNs).map(p => 
    `0x${p.toString(16).toUpperCase().padStart(4, '0')}`
  ).join(', ')}`);
  
  // Show final state
  const finalState = simulator.getState();
  console.log("\n🏁 Final Vehicle State:");
  
  if (finalState.engine) {
    console.log("\n  Engine:");
    console.log(`    RPM: ${finalState.engine.rpm.toFixed(0)}`);
    console.log(`    Load: ${finalState.engine.load.toFixed(1)}%`);
    console.log(`    Coolant: ${finalState.engine.coolantTemp.toFixed(1)}°C`);
    console.log(`    Oil Temp: ${finalState.engine.oilTemp.toFixed(1)}°C`);
    console.log(`    Fuel Rate: ${finalState.engine.fuelRate.toFixed(2)} L/h`);
  }
  
  if (finalState.transmission) {
    console.log("\n  Transmission:");
    console.log(`    Gear: ${finalState.transmission.gearPosition}`);
    console.log(`    Output Speed: ${finalState.transmission.outputShaftSpeed.toFixed(0)} rpm`);
    console.log(`    Fluid Temp: ${finalState.transmission.fluidTemperature.toFixed(1)}°C`);
    console.log(`    Fluid Pressure: ${finalState.transmission.fluidPressure.toFixed(0)} kPa`);
    console.log(`    Torque Converter Lockup: ${finalState.transmission.torqueConverterLockup}`);
  }
  
  if (finalState.brakes) {
    console.log("\n  Brakes:");
    console.log(`    Pedal Position: ${finalState.brakes.brakePedalPosition.toFixed(1)}%`);
    console.log(`    Front Pressure: ${finalState.brakes.frontBrakePressure.toFixed(0)} kPa`);
    console.log(`    Rear Pressure: ${finalState.brakes.rearBrakePressure.toFixed(0)} kPa`);
    console.log(`    ABS Active: ${finalState.brakes.absActive}`);
    console.log(`    Air Pressure: ${finalState.brakes.airPressure.toFixed(0)} kPa`);
  }
  
  if (finalState.aftertreatment) {
    console.log("\n  Aftertreatment:");
    console.log(`    DEF Level: ${finalState.aftertreatment.defTankLevel.toFixed(1)}%`);
    console.log(`    NOx Level: ${finalState.aftertreatment.noxLevel.toFixed(1)} ppm`);
    console.log(`    DPF Soot: ${finalState.aftertreatment.dpfSootLevel.toFixed(1)}%`);
    console.log(`    SCR Temp: ${finalState.aftertreatment.scrCatalystTemp.toFixed(0)}°C`);
    console.log(`    EGR Valve: ${finalState.aftertreatment.egrValvePosition.toFixed(0)}%`);
  }
  
  console.log(`\n  Vehicle Speed: ${finalState.vehicleSpeed.toFixed(1)} km/h\n`);
  
  process.exit(0);
}, 15000);
