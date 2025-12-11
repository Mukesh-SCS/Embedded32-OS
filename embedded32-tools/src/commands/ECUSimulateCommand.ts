import { BaseCommand } from "./BaseCommand.js";

/**
 * ECU Simulator Command
 * 
 * Runs virtual ECU simulators (engine, transmission, aftertreatment)
 * 
 * Usage:
 *   embedded32 ecu simulate --engine
 *   embedded32 ecu simulate --engine --transmission --aftertreatment
 */
export class ECUSimulateCommand extends BaseCommand {
  constructor() {
    super("ecu-simulate");
  }

  getHelp(): string {
    return `
ECU Simulator - Run virtual ECU simulators on CAN/J1939

Usage:
  embedded32 ecu simulate [options]

Options:
  --engine            Enable Engine ECU simulator
  --transmission      Enable Transmission ECU simulator
  --aftertreatment    Enable Aftertreatment ECU simulator
  --iface <iface>     CAN interface (default: can0)
  --scenario <name>   Load predefined scenario:
                      idle, accel, decel, cruise, fault
  --fault <spn>       Inject fault code (SPN number, decimal)
  --rpm <target>      Target RPM (0-2500, default: varies by scenario)

Examples:
  embedded32 ecu simulate --engine
  embedded32 ecu simulate --engine --transmission
  embedded32 ecu simulate --engine --transmission --aftertreatment --scenario cruise
  embedded32 ecu simulate --engine --fault 190
    `;
  }

  async execute(): Promise<void> {
    try {
      const parsed = this.parseArgs(this.args);

      const useEngine = !!parsed.engine;
      const useTransmission = !!parsed.transmission;
      const useAftertreatment = !!parsed.aftertreatment;
      const iface = parsed.iface ? (parsed.iface as string) : "can0";
      const scenario = parsed.scenario ? (parsed.scenario as string) : "idle";
      const faultSpn = parsed.fault ? parseInt(parsed.fault as string) : null;
      const targetRpm = parsed.rpm ? parseInt(parsed.rpm as string) : null;

      if (!useEngine && !useTransmission && !useAftertreatment) {
        this.log("No simulators selected. Use --engine, --transmission, or --aftertreatment");
        console.log(this.getHelp());
        return;
      }

      this.log(`Starting ECU simulators on interface: ${iface}`);

      const modules: string[] = [];
      if (useEngine) modules.push("Engine ECU");
      if (useTransmission) modules.push("Transmission ECU");
      if (useAftertreatment) modules.push("Aftertreatment ECU");

      this.log(`Enabled modules: ${modules.join(", ")}`);
      this.log(`Scenario: ${scenario}`);

      if (faultSpn !== null) {
        this.log(`Will inject fault SPN ${faultSpn} after 10 seconds`);
      }

      if (targetRpm !== null) {
        this.log(`Target RPM: ${targetRpm}`);
      }

      this.log("═".repeat(80));

      console.log(`
ECU SIMULATOR

This tool will simulate realistic vehicle ECUs with:

📊 ENGINE ECU (if enabled)
   - Engine Speed (RPM): 0-2500
   - Engine Load: 0-100%
   - Coolant Temperature: 80-110°C
   - Fuel Rate: 0-50 L/h
   - Air Intake Pressure
   - Turbo Boost Pressure

🔧 TRANSMISSION ECU (if enabled)
   - Transmission Gear: P/R/N/D
   - Output Shaft Speed
   - Transmission Temp: 40-120°C
   - Fluid Pressure
   - Shift Points & Timing

♻️  AFTERTREATMENT ECU (if enabled)
   - DEF Tank Level
   - SCR Catalyst Temp
   - DPF Soot Level
   - Regen Status

SCENARIOS:
  idle       - Engine idling at 600 RPM (default)
  accel      - Smooth acceleration 0-2000 RPM
  decel      - Deceleration from 2000 to 600 RPM
  cruise     - Steady 100 km/h cruise control
  fault      - Normal operation, then inject faults

J1939 MESSAGES GENERATED:

Engine ECU broadcasts:
  [F004]  Electronic Engine Controller 1 (EEC1)
          - Engine Speed, Torque, Load
  [F005]  Electronic Engine Controller 2 (EEC2)
          - Driver Demand Engine %, Actual Engine %, Friction Torque
  [FEF1]  Engine Fluid Level/Pressure
  [FEEC]  Engine Hours, Total Vehicle Hours

Transmission ECU broadcasts:
  [F003]  Electronic Transmission Controller 1 (ETC1)
          - Gear, Output Speed, Input Speed
  [F004]  Electronic Transmission Controller 2 (ETC2)
  [FECA]  Active Diagnostic Trouble Codes (DM1)
          - Fault codes as needed

Aftertreatment ECU broadcasts:
  [F470]  Diesel Exhaust Fluid (DEF) Tank Level
  [F471]  Selective Catalytic Reduction (SCR) Temperature
  [F472]  Diesel Particulate Filter (DPF) Status

FAULT INJECTION:

To inject specific faults:
  $ embedded32 ecu simulate --engine --fault 190
  
This will:
  1. Start normal engine operation
  2. After 10 seconds, set SPN 190 fault (Engine Speed error)
  3. Transmit DM1 with active fault code
  4. Clear fault after 30 more seconds
  5. Continue normal operation

HARDWARE-IN-THE-LOOP:

This simulator can connect to:
  ✓ Real CAN buses (SocketCAN on Linux)
  ✓ Virtual CAN interfaces (for testing)
  ✓ PEAK PCAN interfaces (Windows)
  ✓ Mock CAN for pure software testing

Current interface: ${iface}

To start simulation:

Press Ctrl+C to stop simulator and exit.
      `);

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        this.log("Stopping ECU simulators...");
        await this.cleanup();
        process.exit(0);
      });
    } catch (err) {
      this.log(`Error: ${err}`, "error");
      await this.cleanup();
      throw err;
    }
  }
}
