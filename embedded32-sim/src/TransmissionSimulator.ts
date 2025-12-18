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
  clutchPressure: number; // kPa
  torqueConverterLockup: boolean;
  oilLevel: number; // 0-100%
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
    clutchPressure: 0,
    torqueConverterLockup: false,
    oilLevel: 100,
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
      this.state.torqueConverterLockup = false;
    } else {
      this.state.outputShaftSpeed += (theoreticalOutput - this.state.outputShaftSpeed) * 0.1;
      this.state.inputShaftSpeed = engineRpm;
      
      // Torque converter lockup at cruise
      this.state.torqueConverterLockup = (engineRpm > 1500 && load > 20 && load < 70);
    }

    // Fluid pressure increases with load
    const basePressure = 50;
    const maxPressure = 300;
    this.state.fluidPressure = basePressure + (load / 100) * (maxPressure - basePressure);

    // Clutch pressure follows fluid pressure
    this.state.clutchPressure = this.state.fluidPressure * 0.8;

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
    let status = 0x00;
    if (this.state.shiftInProgress) status |= 0x01;
    if (this.state.torqueConverterLockup) status |= 0x02;
    data[7] = status;

    return data;
  }

  /**
   * Encode transmission fluids as J1939 TF (PGN F00C) frame
   */
  encodeTF(): number[] {
    const data = new Array(8).fill(0xff);

    // Byte 0: Transmission Oil Temperature (1°C/bit, offset -40)
    data[0] = Math.round(this.state.fluidTemperature + 40) & 0xff;

    // Byte 1-2: Transmission Oil Pressure (2 kPa/bit)
    const oilPressure = Math.round(this.state.fluidPressure / 2);
    data[1] = oilPressure & 0xff;
    data[2] = (oilPressure >> 8) & 0xff;

    // Byte 3: Transmission Oil Level (0.4% per bit)
    data[3] = Math.round(this.state.oilLevel / 0.4);

    // Byte 4: Transmission Filter Differential Pressure
    data[4] = 0x00; // Normal (no restriction)

    // Bytes 5-7: Reserved
    data[5] = 0xff;
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Encode clutch/torque data as J1939 TC1 (PGN FE6C) frame
   */
  encodeTC1(): number[] {
    const data = new Array(8).fill(0xff);

    // Byte 0-1: Clutch Pressure (2 kPa/bit)
    const clutchPressure = Math.round(this.state.clutchPressure / 2);
    data[0] = clutchPressure & 0xff;
    data[1] = (clutchPressure >> 8) & 0xff;

    // Byte 2: Torque Converter Status
    data[2] = this.state.torqueConverterLockup ? 0x02 : 0x00;

    // Byte 3: Transmission Range (same as gear position)
    data[3] = this.state.gearPosition;

    // Byte 4-5: Transmission Output Shaft Speed (0.125 rpm/bit)
    const outputSpeed = Math.round(this.state.outputShaftSpeed / 0.125);
    data[4] = outputSpeed & 0xff;
    data[5] = (outputSpeed >> 8) & 0xff;

    // Bytes 6-7: Reserved
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Get current state
   */
  getState(): Readonly<TransmissionState> {
    return Object.freeze({ ...this.state });
  }
}
