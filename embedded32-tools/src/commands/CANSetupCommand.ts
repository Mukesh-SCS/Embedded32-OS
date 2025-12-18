/**
 * Virtual CAN Setup Command
 * 
 * Sets up virtual CAN interface (vcan0) on Linux/WSL
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CANSetupResult {
  success: boolean;
  interface: string;
  message: string;
  platform: string;
}

/**
 * Check if running on Linux or WSL
 */
function detectPlatform(): 'linux' | 'wsl' | 'unsupported' {
  const platform = process.platform;
  
  if (platform === 'linux') {
    // Check for WSL
    try {
      const isWSL = require('fs').existsSync('/proc/version');
      if (isWSL) {
        const version = require('fs').readFileSync('/proc/version', 'utf-8');
        if (version.toLowerCase().includes('microsoft') || version.toLowerCase().includes('wsl')) {
          return 'wsl';
        }
      }
    } catch (e) {
      // Ignore
    }
    return 'linux';
  }
  
  return 'unsupported';
}

/**
 * Check if vcan module is loaded
 */
async function isVcanModuleLoaded(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('lsmod | grep vcan');
    return stdout.includes('vcan');
  } catch (e) {
    return false;
  }
}

/**
 * Check if interface exists
 */
async function interfaceExists(ifname: string): Promise<boolean> {
  try {
    await execAsync(`ip link show ${ifname}`);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if interface is up
 */
async function isInterfaceUp(ifname: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`ip link show ${ifname}`);
    return stdout.includes('state UP') || stdout.includes('state UNKNOWN');
  } catch (e) {
    return false;
  }
}

/**
 * Setup virtual CAN interface
 */
export async function setupVirtualCAN(ifname: string = 'vcan0'): Promise<CANSetupResult> {
  const platform = detectPlatform();
  
  if (platform === 'unsupported') {
    return {
      success: false,
      interface: ifname,
      platform: process.platform,
      message: `Virtual CAN is not supported on ${process.platform}.\n\n` +
        `To use virtual CAN, you need:\n` +
        `  • Linux with SocketCAN support, or\n` +
        `  • Windows with WSL2 (Windows Subsystem for Linux)\n\n` +
        `For WSL2 setup:\n` +
        `  1. Install WSL2: wsl --install\n` +
        `  2. Install Ubuntu: wsl --install -d Ubuntu\n` +
        `  3. Run this command inside WSL: embedded32 can up ${ifname}\n\n` +
        `The simulation will use an in-memory virtual CAN bus instead.`
    };
  }

  console.log(`  Platform: ${platform}`);
  console.log(`  Interface: ${ifname}`);
  console.log('');

  // Step 1: Load vcan module
  const moduleLoaded = await isVcanModuleLoaded();
  if (!moduleLoaded) {
    console.log('  Loading vcan kernel module...');
    try {
      await execAsync('sudo modprobe vcan');
      console.log('  ✓ vcan module loaded');
    } catch (e: any) {
      return {
        success: false,
        interface: ifname,
        platform,
        message: `Failed to load vcan module. Try:\n  sudo modprobe vcan\n\nError: ${e.message}`
      };
    }
  } else {
    console.log('  ✓ vcan module already loaded');
  }

  // Step 2: Create interface if needed
  const exists = await interfaceExists(ifname);
  if (!exists) {
    console.log(`  Creating ${ifname} interface...`);
    try {
      await execAsync(`sudo ip link add dev ${ifname} type vcan`);
      console.log(`  ✓ ${ifname} interface created`);
    } catch (e: any) {
      return {
        success: false,
        interface: ifname,
        platform,
        message: `Failed to create interface. Try:\n  sudo ip link add dev ${ifname} type vcan\n\nError: ${e.message}`
      };
    }
  } else {
    console.log(`  ✓ ${ifname} interface exists`);
  }

  // Step 3: Bring interface up
  const isUp = await isInterfaceUp(ifname);
  if (!isUp) {
    console.log(`  Bringing ${ifname} up...`);
    try {
      await execAsync(`sudo ip link set up ${ifname}`);
      console.log(`  ✓ ${ifname} is up`);
    } catch (e: any) {
      return {
        success: false,
        interface: ifname,
        platform,
        message: `Failed to bring interface up. Try:\n  sudo ip link set up ${ifname}\n\nError: ${e.message}`
      };
    }
  } else {
    console.log(`  ✓ ${ifname} is already up`);
  }

  // Verify
  console.log('');
  try {
    const { stdout } = await execAsync(`ip -details link show ${ifname}`);
    console.log('  Interface details:');
    console.log('  ' + stdout.split('\n').join('\n  '));
  } catch (e) {
    // Ignore
  }

  return {
    success: true,
    interface: ifname,
    platform,
    message: `${ifname} is ready for CAN traffic`
  };
}

/**
 * Print vcan setup instructions for manual setup
 */
export function printManualSetupInstructions(ifname: string = 'vcan0'): void {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    VIRTUAL CAN SETUP INSTRUCTIONS                          ║
╚════════════════════════════════════════════════════════════════════════════╝

To set up virtual CAN manually on Linux/WSL:

  # Load the vcan kernel module
  sudo modprobe vcan

  # Create virtual CAN interface
  sudo ip link add dev ${ifname} type vcan

  # Bring the interface up
  sudo ip link set up ${ifname}

  # Verify it's working
  ip -details link show ${ifname}

Once set up, you can run:

  embedded32 simulate vehicle/basic-truck
  embedded32 monitor ${ifname}

For Windows without WSL:
  The simulator will use an in-memory virtual CAN bus automatically.
  This works for development but won't integrate with real CAN tools.
`);
}
