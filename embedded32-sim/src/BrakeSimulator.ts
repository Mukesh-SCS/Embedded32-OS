/**
 * Brake ECU Simulator
 * 
 * Simulates:
 * - ABS (Anti-lock Braking System)
 * - Brake Circuit Pressures (Front/Rear)
 * - Brake Pedal Position
 * - Wheel Speeds (FL, FR, RL, RR)
 * 
 * Broadcasts:
 * - PGN FEEE (ABS Status)
 * - PGN FEAE (Brake Pressure / Air Suspension Control 2)
 */

export interface WheelSpeeds {
  frontLeft: number;   // km/h
  frontRight: number;  // km/h
  rearLeft: number;    // km/h
  rearRight: number;   // km/h
}

export interface BrakeState {
  absActive: boolean;
  tractionControlActive: boolean;
  brakePedalPosition: number;      // 0-100%
  frontBrakePressure: number;      // kPa
  rearBrakePressure: number;       // kPa
  parkingBrakeEngaged: boolean;
  wheelSpeeds: WheelSpeeds;
  airPressure: number;             // kPa (for air brake systems)
}

/**
 * Brake ECU virtual device
 */
export class BrakeSimulator {
  private state: BrakeState = {
    absActive: false,
    tractionControlActive: false,
    brakePedalPosition: 0,
    frontBrakePressure: 0,
    rearBrakePressure: 0,
    parkingBrakeEngaged: true,
    wheelSpeeds: {
      frontLeft: 0,
      frontRight: 0,
      rearLeft: 0,
      rearRight: 0,
    },
    airPressure: 800, // Normal air brake system pressure
  };

  constructor(private updateInterval: number = 100) {}

  /**
   * Release parking brake
   */
  releaseParkingBrake() {
    this.state.parkingBrakeEngaged = false;
  }

  /**
   * Engage parking brake
   */
  engageParkingBrake() {
    this.state.parkingBrakeEngaged = true;
  }

  /**
   * Apply brakes (manual control for testing)
   */
  applyBrake(pedalPosition: number) {
    this.state.brakePedalPosition = Math.max(0, Math.min(100, pedalPosition));
  }

  /**
   * Update brake state
   * @param vehicleSpeed - Current vehicle speed in km/h
   * @param engineLoad - Engine load (0-100%) - affects brake force needed
   */
  tick(vehicleSpeed: number, engineLoad: number) {
    // Auto-brake simulation: light braking when decelerating
    if (vehicleSpeed > 5 && engineLoad < 20) {
      this.state.brakePedalPosition = Math.min(30, this.state.brakePedalPosition + 2);
    } else if (engineLoad > 50) {
      // Release brakes when accelerating
      this.state.brakePedalPosition = Math.max(0, this.state.brakePedalPosition - 5);
    }

    // Calculate brake pressures based on pedal position
    const maxPressure = 600; // kPa
    const frontBias = 0.6; // 60% front, 40% rear
    const rearBias = 0.4;

    this.state.frontBrakePressure =
      (this.state.brakePedalPosition / 100) * maxPressure * frontBias;
    this.state.rearBrakePressure =
      (this.state.brakePedalPosition / 100) * maxPressure * rearBias;

    // Parking brake adds pressure to rear
    if (this.state.parkingBrakeEngaged) {
      this.state.rearBrakePressure = Math.max(this.state.rearBrakePressure, 200);
    }

    // Update wheel speeds (all equal unless ABS active)
    const baseWheelSpeed = vehicleSpeed;
    
    if (this.state.brakePedalPosition > 70 && vehicleSpeed > 20) {
      // Heavy braking at speed - ABS activates
      this.state.absActive = true;
      
      // ABS causes slight wheel speed variations
      this.state.wheelSpeeds = {
        frontLeft: baseWheelSpeed * (0.95 + Math.random() * 0.05),
        frontRight: baseWheelSpeed * (0.95 + Math.random() * 0.05),
        rearLeft: baseWheelSpeed * (0.92 + Math.random() * 0.06),
        rearRight: baseWheelSpeed * (0.92 + Math.random() * 0.06),
      };
    } else {
      this.state.absActive = false;
      
      // Normal operation - all wheels equal
      this.state.wheelSpeeds = {
        frontLeft: baseWheelSpeed,
        frontRight: baseWheelSpeed,
        rearLeft: baseWheelSpeed,
        rearRight: baseWheelSpeed,
      };
    }

    // Air pressure management (for air brake systems)
    // Pressure drops with brake application, replenishes when released
    if (this.state.brakePedalPosition > 0) {
      this.state.airPressure = Math.max(
        650,
        this.state.airPressure - this.state.brakePedalPosition * 0.02
      );
    } else {
      // Compressor replenishes air
      this.state.airPressure = Math.min(850, this.state.airPressure + 2);
    }

    return this.state;
  }

  /**
   * Encode brake state as J1939 ABS frame (PGN FEEE)
   */
  encodeABS(): number[] {
    const data = new Array(8).fill(0xff);

    // Byte 0-1: Front Left Wheel Speed (1/256 km/h per bit)
    const flSpeed = Math.round(this.state.wheelSpeeds.frontLeft * 256);
    data[0] = flSpeed & 0xff;
    data[1] = (flSpeed >> 8) & 0xff;

    // Byte 2-3: Front Right Wheel Speed
    const frSpeed = Math.round(this.state.wheelSpeeds.frontRight * 256);
    data[2] = frSpeed & 0xff;
    data[3] = (frSpeed >> 8) & 0xff;

    // Byte 4-5: Rear Left Wheel Speed
    const rlSpeed = Math.round(this.state.wheelSpeeds.rearLeft * 256);
    data[4] = rlSpeed & 0xff;
    data[5] = (rlSpeed >> 8) & 0xff;

    // Byte 6-7: Rear Right Wheel Speed
    const rrSpeed = Math.round(this.state.wheelSpeeds.rearRight * 256);
    data[6] = rrSpeed & 0xff;
    data[7] = (rrSpeed >> 8) & 0xff;

    return data;
  }

  /**
   * Encode brake pressure as J1939 ASC2 frame (PGN FEAE)
   */
  encodeBrakePressure(): number[] {
    const data = new Array(8).fill(0xff);

    // Byte 0: Brake Pedal Position (0.4% per bit)
    data[0] = Math.round(this.state.brakePedalPosition / 0.4);

    // Byte 1-2: Front Brake Circuit Pressure (2 kPa per bit)
    const frontPressure = Math.round(this.state.frontBrakePressure / 2);
    data[1] = frontPressure & 0xff;
    data[2] = (frontPressure >> 8) & 0xff;

    // Byte 3-4: Rear Brake Circuit Pressure (2 kPa per bit)
    const rearPressure = Math.round(this.state.rearBrakePressure / 2);
    data[3] = rearPressure & 0xff;
    data[4] = (rearPressure >> 8) & 0xff;

    // Byte 5-6: Air Pressure (4 kPa per bit)
    const airPressure = Math.round(this.state.airPressure / 4);
    data[5] = airPressure & 0xff;
    data[6] = (airPressure >> 8) & 0xff;

    // Byte 7: Status flags
    let status = 0x00;
    if (this.state.absActive) status |= 0x01;
    if (this.state.tractionControlActive) status |= 0x02;
    if (this.state.parkingBrakeEngaged) status |= 0x04;
    data[7] = status;

    return data;
  }

  /**
   * Get current state
   */
  getState(): Readonly<BrakeState> {
    return Object.freeze({ ...this.state });
  }
}
