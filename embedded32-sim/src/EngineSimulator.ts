/**
 * Engine ECU Simulator
 * 
 * Simulates:
 * - Engine Speed (RPM): 0-2500
 * - Engine Load: 0-100%
 * - Coolant Temperature: 80-110°C
 * - Fuel Rate: 0-50 L/h
 * - Air Intake Pressure
 * - Turbo Boost Pressure
 * 
 * Broadcasts PGN F004 (EEC1) and F005 (EEC2)
 */

export interface EngineState {
  rpm: number;
  load: number;
  coolantTemp: number;
  fuelRate: number;
  intakeAirPressure: number;
  turboPressure: number;
  running: boolean;
  torquePercent: number;
}

export interface EngineScenario {
  name: string;
  duration: number; // milliseconds
  targetRpm: (elapsed: number) => number;
  targetLoad: (elapsed: number) => number;
}

/**
 * Engine ECU virtual device
 */
export class EngineSimulator {
  private state: EngineState = {
    rpm: 0,
    load: 0,
    coolantTemp: 90,
    fuelRate: 0,
    intakeAirPressure: 101.3,
    turboPressure: 0,
    running: false,
    torquePercent: 0,
  };

  private currentScenario: EngineScenario | null = null;
  private scenarioStartTime: number = 0;

  constructor(private updateInterval: number = 100) {}

  /**
   * Start engine
   */
  start() {
    this.state.running = true;
    this.state.rpm = 600; // Idle
  }

  /**
   * Stop engine
   */
  stop() {
    this.state.running = false;
    this.state.rpm = 0;
    this.state.load = 0;
    this.state.fuelRate = 0;
    this.state.turboPressure = 0;
  }

  /**
   * Load a predefined scenario
   */
  loadScenario(scenario: EngineScenario) {
    this.currentScenario = scenario;
    this.scenarioStartTime = Date.now();
  }

  /**
   * Get idle scenario
   */
  static getIdleScenario(): EngineScenario {
    return {
      name: "idle",
      duration: Infinity,
      targetRpm: () => 600,
      targetLoad: () => 0,
    };
  }

  /**
   * Get acceleration scenario
   */
  static getAccelerationScenario(): EngineScenario {
    return {
      name: "accel",
      duration: 10000, // 10 seconds
      targetRpm: (elapsed) => {
        return Math.min(600 + (elapsed / 10000) * 1900, 2500);
      },
      targetLoad: (elapsed) => {
        return Math.min((elapsed / 10000) * 100, 100);
      },
    };
  }

  /**
   * Get cruise scenario
   */
  static getCruiseScenario(): EngineScenario {
    return {
      name: "cruise",
      duration: Infinity,
      targetRpm: () => 1800,
      targetLoad: () => 30,
    };
  }

  /**
   * Get deceleration scenario
   */
  static getDecelerationScenario(): EngineScenario {
    return {
      name: "decel",
      duration: 5000,
      targetRpm: (elapsed) => {
        return Math.max(2500 - (elapsed / 5000) * 1900, 600);
      },
      targetLoad: (elapsed) => {
        return Math.max(100 - (elapsed / 5000) * 100, 0);
      },
    };
  }

  /**
   * Update engine state (call periodically)
   */
  tick() {
    if (!this.state.running) {
      return this.state;
    }

    let targetRpm = 600;
    let targetLoad = 0;

    // Apply current scenario
    if (this.currentScenario) {
      const elapsed = Date.now() - this.scenarioStartTime;

      // Check if scenario duration has passed
      if (elapsed > this.currentScenario.duration) {
        // Scenario ended, go back to idle
        this.currentScenario = null;
      } else {
        targetRpm = this.currentScenario.targetRpm(elapsed);
        targetLoad = this.currentScenario.targetLoad(elapsed);
      }
    }

    // Smooth ramping towards target
    const rpmRamp = 0.1;
    const loadRamp = 0.1;

    this.state.rpm += (targetRpm - this.state.rpm) * rpmRamp;
    this.state.load += (targetLoad - this.state.load) * loadRamp;
    this.state.torquePercent = this.state.load;

    // Calculate derived values
    this.updateDerivedValues();

    return this.state;
  }

  private updateDerivedValues() {
    // Fuel consumption increases with load and RPM
    const baseConsumption = (this.state.rpm / 2500) * 20; // 0-20 L/h
    const loadConsumption = (this.state.load / 100) * 30; // 0-30 L/h
    this.state.fuelRate = (baseConsumption + loadConsumption) / 2;

    // Coolant temperature increases with load
    const idleTemp = 90;
    const maxTemp = 110;
    this.state.coolantTemp = idleTemp + (this.state.load / 100) * (maxTemp - idleTemp);

    // Turbo pressure increases with RPM and load
    const turboPressureMax = 180; // kPa
    this.state.turboPressure =
      (this.state.rpm / 2500) * 0.7 * turboPressureMax +
      (this.state.load / 100) * 0.3 * turboPressureMax;

    // Air intake pressure (relative to atmospheric)
    this.state.intakeAirPressure = 101.3 + this.state.turboPressure * 0.1;
  }

  /**
   * Encode engine state as J1939 EEC1 (PGN F004) frame
   */
  encodeEEC1(): number[] {
    const data = new Array(8).fill(0);

    // Byte 0-1: Engine Speed (0.125 rpm/bit)
    const rpmValue = Math.round(this.state.rpm / 0.125);
    data[0] = rpmValue & 0xff;
    data[1] = (rpmValue >> 8) & 0xff;

    // Byte 2: Engine Load (0.4% /bit)
    data[2] = Math.round(this.state.load / 0.4);

    // Byte 3: Engine Fuel Rate (0.05 L/h per bit)
    data[3] = Math.round(this.state.fuelRate / 0.05);

    // Byte 4: Coolant Temp (1°C/bit, offset -273)
    data[4] = Math.round(this.state.coolantTemp + 273) & 0xff;

    // Byte 5: Engine Request Torque (1% per bit)
    data[5] = Math.round(this.state.torquePercent);

    // Byte 6-7: Reserved
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Get current state
   */
  getState(): Readonly<EngineState> {
    return Object.freeze({ ...this.state });
  }
}
