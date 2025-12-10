/**
 * Transmission ECU Simulator
 * 
 * Simulates:
 * - Transmission Gear: P/R/N/D/S
 * - Output Shaft Speed
 * - Transmission Temperature: 40-120°C
 * - Fluid Pressure: 0-500 kPa
 * - Shift Points & Timing
 * 
 * Broadcasts PGN F003 (ETC1)
 */

export enum GearPosition {
  Park = 0,
  Reverse = 1,
  Neutral = 2,
  Drive = 3,
  Sport = 4,
}

export interface TransmissionState {
  gearPosition: GearPosition;
  outputShaftSpeed: number; // rpm
  inputShaftSpeed: number; // rpm
  fluidPressure: number; // kPa
  fluidTemperature: number; // °C
  shiftInProgress: boolean;
}

/**
 * Transmission ECU virtual device
 */
export class TransmissionSimulator {
  private state: TransmissionState = {
    gearPosition: GearPosition.Park,
    outputShaftSpeed: 0,
    inputShaftSpeed: 0,
    fluidPressure: 50,
    fluidTemperature: 90,
    shiftInProgress: false,
  };

  private gearRatios: Record<GearPosition, number> = {
    [GearPosition.Park]: 0,
    [GearPosition.Reverse]: 3.2,
    [GearPosition.Neutral]: 0,
    [GearPosition.Drive]: 2.5,
    [GearPosition.Sport]: 2.0,
  };

  constructor(private updateInterval: number = 100) {}

  /**
   * Set gear position
   */
  setGearPosition(gear: GearPosition) {
    if (this.state.gearPosition !== gear) {
      this.state.gearPosition = gear;
      this.state.shiftInProgress = true;
    }
  }

  /**
   * Get current gear position
   */
  getGearPosition(): GearPosition {
    return this.state.gearPosition;
  }

  /**
   * Update transmission state
   */
  tick(engineRpm: number, load: number) {
    // Calculate output speed based on gear ratio
    const gearRatio = this.gearRatios[this.state.gearPosition];
    const theoreticalOutput = engineRpm / gearRatio;

    if (gearRatio === 0) {
      // Park or Neutral
      this.state.outputShaftSpeed = 0;
      this.state.inputShaftSpeed = engineRpm;
    } else {
      this.state.outputShaftSpeed += (theoreticalOutput - this.state.outputShaftSpeed) * 0.1;
      this.state.inputShaftSpeed = engineRpm;
    }

    // Fluid pressure increases with load
    const basePressure = 50;
    const maxPressure = 300;
    this.state.fluidPressure = basePressure + (load / 100) * (maxPressure - basePressure);

    // Temperature increases with pressure and friction
    const idleTemp = 70;
    const maxTemp = 120;
    const tempIncrease = (this.state.fluidPressure / maxPressure) * (maxTemp - idleTemp);
    this.state.fluidTemperature += (idleTemp + tempIncrease - this.state.fluidTemperature) * 0.05;

    // Clear shift in progress flag after 500ms
    // (would need timing context - simplified for now)
    if (this.state.shiftInProgress) {
      // In real implementation, would track shift timing
      this.state.shiftInProgress = false;
    }

    return this.state;
  }

  /**
   * Encode transmission state as J1939 ETC1 (PGN F003) frame
   */
  encodeETC1(): number[] {
    const data = new Array(8).fill(0);

    // Byte 0: Transmission Current Gear (bits 0-3)
    data[0] = (this.state.gearPosition & 0x0f);

    // Byte 1-2: Output Shaft Speed (0.125 rpm/bit)
    const outputSpeed = Math.round(this.state.outputShaftSpeed / 0.125);
    data[1] = outputSpeed & 0xff;
    data[2] = (outputSpeed >> 8) & 0xff;

    // Byte 3-4: Input Shaft Speed (0.125 rpm/bit)
    const inputSpeed = Math.round(this.state.inputShaftSpeed / 0.125);
    data[3] = inputSpeed & 0xff;
    data[4] = (inputSpeed >> 8) & 0xff;

    // Byte 5: Transmission Fluid Pressure (5 kPa/bit)
    data[5] = Math.round(this.state.fluidPressure / 5);

    // Byte 6: Transmission Fluid Temperature (1°C/bit, offset -273)
    data[6] = Math.round(this.state.fluidTemperature + 273) & 0xff;

    // Byte 7: Status/Controls
    data[7] = this.state.shiftInProgress ? 0x01 : 0x00;

    return data;
  }

  /**
   * Get current state
   */
  getState(): Readonly<TransmissionState> {
    return Object.freeze({ ...this.state });
  }
}
