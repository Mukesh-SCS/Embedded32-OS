/**
 * J1939 Address Claim
 *
 * Handles device address allocation on the J1939 network.
 *
 * Phase 1: Basic skeleton
 * Phase 2: Full address negotiation and conflict resolution
 */

export interface J1939DeviceInfo {
  sourceAddress: number;
  industryGroup: number;
  deviceClass: number;
  deviceInstance: number;
  systemInstance: number;
  manufacturerCode: number;
  identityNumber: number;
}

/**
 * Address Claim Manager
 *
 * In Phase 2, this will:
 * - Handle address claim broadcasts
 * - Resolve address conflicts
 * - Manage address pools
 * - Track device identification
 */
export class AddressClaimManager {
  private claimedAddresses: Map<number, J1939DeviceInfo> = new Map();

  /**
   * Register a device claiming an address
   */
  claimAddress(device: J1939DeviceInfo): void {
    this.claimedAddresses.set(device.sourceAddress, device);
    console.log(`[AC] Device claimed address 0x${device.sourceAddress.toString(16)}`);
  }

  /**
   * Request address claim from all devices
   */
  requestAddressClaim(): void {
    // Placeholder for Phase 2
    console.log(`[AC] Requesting all devices to claim addresses...`);
  }

  /**
   * Get device info by source address
   */
  getDevice(sourceAddress: number): J1939DeviceInfo | undefined {
    return this.claimedAddresses.get(sourceAddress);
  }

  /**
   * Get all claimed addresses
   */
  getAllAddresses(): number[] {
    return Array.from(this.claimedAddresses.keys());
  }
}
