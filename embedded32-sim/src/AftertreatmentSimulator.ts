/**
 * Aftertreatment ECU Simulator
 * 
 * Simulates:
 * - DEF Tank Level: 0-100%
 * - SCR Catalyst Temperature: 200-600°C
 * - DPF Soot Level: 0-100%
 * - Regeneration Status
 * 
 * Broadcasts PGN F470 (DEF Level), F471 (SCR Temp), F472 (DPF Status)
 */

export enum RegenerationStatus {
  Inactive = 0,
  Active = 1,
  Inhibited = 2,
  Complete = 3,
}

export interface AftertreatmentState {
  defTankLevel: number; // 0-100%
  scrCatalystTemp: number; // °C
  dpfSootLevel: number; // 0-100%
  regenerationStatus: RegenerationStatus;
  regenerationProgress: number; // 0-100%
  exhausTemp: number; // °C
  noxLevel: number; // ppm (parts per million)
  egrValvePosition: number; // 0-100%
}

/**
 * Aftertreatment ECU virtual device
 */
export class AftertreatmentSimulator {
  private state: AftertreatmentState = {
    defTankLevel: 100,
    scrCatalystTemp: 300,
    dpfSootLevel: 5,
    regenerationStatus: RegenerationStatus.Inactive,
    regenerationProgress: 0,
    exhausTemp: 200,
    noxLevel: 50,
    egrValvePosition: 0,
  };

  private regenerationEndTime: number | null = null;

  constructor(private updateInterval: number = 100) {}

  /**
   * Update aftertreatment state
   */
  tick(engineRpm: number, fuelRate: number, load: number) {
    // DEF consumption (about 3-5% of fuel consumption)
    const defConsumptionRate = fuelRate * 0.04 * (this.updateInterval / 1000) / 100;
    this.state.defTankLevel = Math.max(0, this.state.defTankLevel - defConsumptionRate);

    // Exhaust temperature based on RPM and load
    const baseTemp = 150;
    const maxTemp = 600;
    this.state.exhausTemp = baseTemp + (engineRpm / 2500) * 0.5 * (maxTemp - baseTemp) +
                           (load / 100) * 0.5 * (maxTemp - baseTemp);

    // SCR catalyst temperature follows exhaust temperature (with lag)
    this.state.scrCatalystTemp +=
      (Math.min(this.state.exhausTemp, 500) - this.state.scrCatalystTemp) * 0.15;

    // NOx emissions based on load and EGR effectiveness
    const baseNox = 300; // ppm at high load without treatment
    const loadNox = (load / 100) * baseNox;
    const egrReduction = (this.state.egrValvePosition / 100) * 0.3; // EGR reduces NOx by up to 30%
    const scrReduction = this.state.scrCatalystTemp > 250 ? 0.9 : 0.5; // SCR reduces NOx by 50-90%
    
    this.state.noxLevel = loadNox * (1 - egrReduction) * (1 - scrReduction);

    // EGR valve position based on load (closes at high load)
    if (load < 50) {
      this.state.egrValvePosition = 70 - load; // More EGR at low load
    } else {
      this.state.egrValvePosition = Math.max(0, this.state.egrValvePosition - 5);
    }

    // DPF soot accumulation (increases during idle, decreases during regen)
    const sootAccumulationRate = (
      (2500 - engineRpm) / 2500 * 0.05 + // More soot when idling
      (load / 100) * 0.03 // Some soot during load
    );

    if (this.state.regenerationStatus === RegenerationStatus.Active) {
      // Regeneration reduces soot
      const regenRate = 0.2 * (this.state.exhausTemp / 500); // Better regen at higher temps
      this.state.dpfSootLevel = Math.max(0, this.state.dpfSootLevel - regenRate);

      // Check if regeneration is complete
      if (this.state.dpfSootLevel < 5) {
        this.state.regenerationStatus = RegenerationStatus.Complete;
        this.state.regenerationProgress = 100;
        this.regenerationEndTime = null;
      }
    } else {
      // Normal soot accumulation
      this.state.dpfSootLevel = Math.min(100, this.state.dpfSootLevel + sootAccumulationRate);
    }

    // Trigger regeneration if soot level too high
    if (
      this.state.dpfSootLevel > 80 &&
      this.state.regenerationStatus === RegenerationStatus.Inactive
    ) {
      this.startRegeneration();
    }

    return this.state;
  }

  /**
   * Start DPF regeneration
   */
  private startRegeneration() {
    this.state.regenerationStatus = RegenerationStatus.Active;
    this.state.regenerationProgress = 0;
    this.regenerationEndTime = Date.now() + 30000; // 30 second regen cycle
  }

  /**
   * Inject DEF (for testing)
   */
  refillDEF() {
    this.state.defTankLevel = 100;
  }

  /**
   * Encode aftertreatment state as J1939 frames
   */

  /**
   * Encode DEF tank level as J1939 AT1T1 (PGN FEDF) frame
   */
  encodeDEFLevel(): number[] {
    // PGN FEDF - Aftertreatment 1 Diesel Exhaust Fluid Tank 1
    const data = new Array(8).fill(0xff);

    // Byte 0: DEF Tank Level (0.4% / bit)
    data[0] = Math.round(this.state.defTankLevel / 0.4);

    // Byte 1: DEF Tank Temperature (1°C/bit, offset -40)
    const defTemp = 25; // Ambient temperature
    data[1] = Math.round(defTemp + 40) & 0xff;

    // Byte 2: DEF Tank Status
    if (this.state.defTankLevel < 10) {
      data[2] = 0x02; // Low level warning
    } else if (this.state.defTankLevel < 5) {
      data[2] = 0x01; // Critical low level
    } else {
      data[2] = 0x00; // Normal
    }

    // Bytes 3-7: Reserved
    data[3] = 0xff;
    data[4] = 0xff;
    data[5] = 0xff;
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Encode NOx levels as J1939 EGR1 (PGN FEEF) frame
   */
  encodeNOx(): number[] {
    // PGN FEEF - Engine Exhaust Gas Recirculation 1
    const data = new Array(8).fill(0xff);

    // Byte 0-1: NOx Level (0.05 ppm/bit)
    const noxValue = Math.round(this.state.noxLevel / 0.05);
    data[0] = noxValue & 0xff;
    data[1] = (noxValue >> 8) & 0xff;

    // Byte 2: EGR Valve Position (0.4% per bit)
    data[2] = Math.round(this.state.egrValvePosition / 0.4);

    // Byte 3-4: Intake Manifold Temperature (0.03125°C/bit, offset -273)
    const intakeTemp = 50; // Typical intake temp
    const tempValue = Math.round((intakeTemp + 273) / 0.03125);
    data[3] = tempValue & 0xff;
    data[4] = (tempValue >> 8) & 0xff;

    // Bytes 5-7: Reserved
    data[5] = 0xff;
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Encode DPF status as J1939 A1DPFC (PGN FEE5) frame
   */
  encodeDPFStatus(): number[] {
    // PGN FEE5 - Aftertreatment 1 Diesel Particulate Filter Control
    const data = new Array(8).fill(0xff);

    // Byte 0: DPF Soot Level (0.5% / bit)
    data[0] = Math.round(this.state.dpfSootLevel / 0.5);

    // Byte 1: DPF Regeneration Status
    data[1] = this.state.regenerationStatus;

    // Byte 2: Regeneration Progress (1% / bit)
    data[2] = Math.round(this.state.regenerationProgress);

    // Byte 3-4: DPF Differential Pressure (0.1 kPa/bit)
    const diffPressure = this.state.dpfSootLevel * 2; // Pressure increases with soot
    const pressureValue = Math.round(diffPressure / 0.1);
    data[3] = pressureValue & 0xff;
    data[4] = (pressureValue >> 8) & 0xff;

    // Byte 5-6: DPF Outlet Temperature (0.03125°C/bit, offset -273)
    const tempValue = Math.round((this.state.exhausTemp + 273) / 0.03125);
    data[5] = tempValue & 0xff;
    data[6] = (tempValue >> 8) & 0xff;

    // Byte 7: DPF Active Regeneration Status
    data[7] = this.state.regenerationStatus === RegenerationStatus.Active ? 0x01 : 0x00;

    return data;
  }

  /**
   * Encode SCR catalyst temperature (legacy method name for compatibility)
   */
  encodeSCRTemp(): number[] {
    // This can be part of the NOx/EGR frame or separate
    // For now, keeping it as exhaust temperature
    const data = new Array(8).fill(0xff);

    // Byte 0-1: SCR Inlet Gas Temperature (0.03125°C/bit, offset -273)
    const tempValue = Math.round((this.state.scrCatalystTemp + 273) / 0.03125);
    data[0] = tempValue & 0xff;
    data[1] = (tempValue >> 8) & 0xff;

    // Byte 2: Catalyst Status
    if (this.state.scrCatalystTemp < 200) {
      data[2] = 0x00; // Cold
    } else if (this.state.scrCatalystTemp < 400) {
      data[2] = 0x01; // Warming up
    } else {
      data[2] = 0x02; // Active
    }

    // Bytes 3-7: Reserved
    data[3] = 0xff;
    data[4] = 0xff;
    data[5] = 0xff;
    data[6] = 0xff;
    data[7] = 0xff;

    return data;
  }

  /**
   * Get current state
   */
  getState(): Readonly<AftertreatmentState> {
    return Object.freeze({ ...this.state });
  }
}
