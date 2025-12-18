#!/usr/bin/env node

import * as fs from 'fs';
import { ConfigLoader } from './config-loader';
import { PluginManager } from './plugin-manager';
import { Supervisor, Logger } from '@embedded32/supervisor';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

/**
 * Main CLI entry point for Embedded32
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const option = args[1];

  try {
    switch (command) {
      case 'start':
        await startRuntime(option);
        break;
      case 'demo':
        await startDemo();
        break;
      case 'init':
        await initializeConfig();
        break;
      case 'status':
        await showStatus(option);
        break;
      case 'add':
        await addPlugin(option);
        break;
      case 'help':
        showHelp();
        break;
      default:
        if (command) {
          console.error(`Unknown command: ${command}`);
        }
        showHelp();
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Start the runtime with configuration
 */
async function startRuntime(configPath?: string): Promise<never> {
  console.log('');
  console.log('  🚀 Embedded32 Runtime Launcher');
  console.log('  ═══════════════════════════════════');
  console.log('');

  // Load configuration
  const configLoader = new ConfigLoader(configPath);
  const config = configLoader.load();

  console.log(`  📋 Configuration loaded from: ${configLoader.getPath()}`);
  console.log('');

  // Create logger
  const logger = new Logger(config.logging?.level || 'info');

  // Create supervisor
  const supervisor = new Supervisor(config, logger);

  // Create plugin manager
  const pluginManager = new PluginManager(logger);

  // Register enabled modules based on config
  if (config.can?.enabled !== false) {
    supervisor.registerModule(pluginManager.createModule('can', config));
  }

  if (config.j1939?.enabled !== false) {
    supervisor.registerModule(pluginManager.createModule('j1939', config));
  }

  if (config.ethernet?.udp?.enabled || config.ethernet?.tcp?.enabled || config.ethernet?.mqtt?.enabled) {
    supervisor.registerModule(pluginManager.createModule('ethernet', config));
  }

  if (config.bridge?.canEthernet?.enabled || config.bridge?.canMqtt?.enabled) {
    supervisor.registerModule(pluginManager.createModule('bridge', config));
  }

  if (config.dashboard?.enabled) {
    supervisor.registerModule(pluginManager.createModule('dashboard', config));
  }

  if (config.simulator?.engine || config.simulator?.transmission || config.simulator?.brakes) {
    supervisor.registerModule(pluginManager.createModule('simulator', config));
  }

  // Register WebSocket Bridge for dashboard
  if (pluginManager.hasPlugin('ws-bridge')) {
    supervisor.registerModule(pluginManager.createModule('ws-bridge', config));
  }

  // Setup event listeners
  const eventBus = supervisor.getEventBus();
  eventBus.on('module-started', (data: any) => {
    console.log(`  ✅ ${data.moduleId} started`);
  });

  eventBus.on('module-failed', (data: any) => {
    console.error(`  ❌ ${data.moduleId} failed: ${data.error}`);
  });

  // Start supervisor
  await supervisor.start();

  console.log('');
  console.log('  ✨ All modules started successfully!');
  console.log('  📊 Dashboard: http://localhost:5173');
  console.log('  🔌 UDP Server: localhost:5000');
  console.log('  🔌 TCP Server: localhost:9000');
  console.log('');
  console.log('  Press Ctrl+C to stop the runtime...');
  console.log('');

  let isShuttingDown = false;

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n  ⏹️  Shutting down gracefully (${signal})...`);
    await supervisor.stop();
    console.log('  ✅ Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Keep the process running - return a promise that never resolves
  return new Promise<never>(() => {
    // This promise never resolves, keeping the process alive indefinitely
  });
}

/**
 * Start demo mode with all features enabled
 */
async function startDemo(): Promise<never> {
  console.log('');
  console.log('  🎮 Embedded32 Demo Mode');
  console.log('  ════════════════════════');
  console.log('');

  // Create demo configuration
  const demoConfig = ConfigLoader.createDefault();
  demoConfig.simulator = {
    engine: true,
    transmission: true,
    brakes: true
  };
  demoConfig.bridge = {
    canEthernet: {
      enabled: true,
      whitelist: [0xf004, 0xfeca, 0xff00],
      rateLimit: { default: 20, 0xf004: 50 }
    },
    canMqtt: {
      enabled: false
    }
  };

  const logger = new Logger('info');
  const supervisor = new Supervisor(demoConfig, logger);
  const pluginManager = new PluginManager(logger);

  // Enable all modules for demo
  supervisor.registerModule(pluginManager.createModule('can', demoConfig));
  supervisor.registerModule(pluginManager.createModule('j1939', demoConfig));
  supervisor.registerModule(pluginManager.createModule('ethernet', demoConfig));
  supervisor.registerModule(pluginManager.createModule('bridge', demoConfig));
  supervisor.registerModule(pluginManager.createModule('dashboard', demoConfig));
  supervisor.registerModule(pluginManager.createModule('simulator', demoConfig));

  // Register WebSocket Bridge for dashboard
  if (pluginManager.hasPlugin('ws-bridge')) {
    supervisor.registerModule(pluginManager.createModule('ws-bridge', demoConfig));
  }

  const eventBus = supervisor.getEventBus();
  eventBus.on('module-started', (data: any) => {
    console.log(`  ✅ ${data.moduleId} started`);
  });

  console.log('  📡 Starting all systems...\n');

  await supervisor.start();

  console.log('');
  console.log('  ✨ Demo mode active!');
  console.log('');
  console.log('  📊 Open dashboard: http://localhost:5173');
  console.log('  🚗 Simulator running with: Engine, Transmission, Brakes');
  console.log('  🔌 CAN bridge active on UDP/TCP');
  console.log('');
  console.log('  Press Ctrl+C to exit demo mode...');
  console.log('');

  let isShuttingDown = false;

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n  ⏹️  Exiting demo mode (${signal})...`);
    await supervisor.stop();
    console.log('  ✅ Demo ended');
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Keep the process alive - return a promise that never resolves
  return new Promise<never>(() => {
    // This promise never resolves, keeping the process alive indefinitely
  });
}

/**
 * Initialize a new configuration file
 */
async function initializeConfig(): Promise<void> {
  console.log('');
  console.log('  📝 Initializing Embedded32 Configuration');
  console.log('  ════════════════════════════════════════');
  console.log('');

  const configPath = 'embedded32.yaml';

  if (fs.existsSync(configPath)) {
    console.log(`  ⚠️  Configuration already exists: ${configPath}`);
    return;
  }

  const defaultConfig = ConfigLoader.createDefault();
  const loader = new ConfigLoader();
  loader.save(defaultConfig, configPath);

  console.log('');
  console.log('  📖 Configuration template created');
  console.log(`  📍 Location: ${configPath}`);
  console.log('');
  console.log('  ⚡ Next steps:');
  console.log('  1. (Optional) Start dashboard: pushd embedded32-dashboard; npm run dev; popd');
  console.log('    2. Run: embedded32 start');
  console.log('');
}

/**
 * Add a plugin to the ecosystem
 */
async function addPlugin(pluginName?: string): Promise<void> {
  if (!pluginName) {
    console.log('  Usage: embedded32 add <plugin-name>');
    console.log('');
    console.log('  Available plugins:');
    console.log('    - embedded32-ethernet');
    console.log('    - embedded32-bridge');

/**
 * Attempt to start the embedded32-dashboard dev server (Vite) on port 5173.
 * Returns the spawned process or undefined if startup failed.
 */
async function tryStartDashboardDevServer(): Promise<ChildProcessWithoutNullStreams | undefined> {
  try {
    const dashboardDir = path.resolve(process.cwd(), 'embedded32-dashboard');
    // On Windows PowerShell, spawn via npm.cmd
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const proc = spawn(npmCmd, ['run', 'dev'], {
      cwd: dashboardDir,
      stdio: 'inherit',
      shell: false,
    });

    // Give it a short time to boot; non-blocking for the demo
    proc.on('error', (err) => {
      console.error(`  ⚠️  Dashboard dev server failed to start: ${err.message}`);
    });
    // Type guard: ensure stdio streams are not null
    if (proc.stdin && proc.stdout && proc.stderr) {
      return proc as ChildProcessWithoutNullStreams;
    }
    return undefined;
  } catch (err) {
    const e = err as Error;
    console.error(`  ⚠️  Could not start dashboard dev server: ${e.message}`);
    return undefined;
  }
}
    console.log('    - embedded32-dashboard');
    console.log('    - embedded32-simulator');
    return;
  }

  console.log(`  📦 Adding plugin: ${pluginName}`);
  console.log('');

  // In production, this would npm install the plugin package
  console.log(`  ✅ Plugin added: ${pluginName}`);
  console.log('');
  console.log('  💡 Configure it in embedded32.yaml and restart');
  console.log('');
}

/**
 * Show runtime status
 */
async function showStatus(configPath?: string): Promise<void> {
  try {
    const configLoader = new ConfigLoader(configPath);
    const config = configLoader.load();
    const logger = new Logger('warn');
    const supervisor = new Supervisor(config, logger);

    const health = supervisor.getHealthStatus();

    console.log('');
    console.log('  📊 Embedded32 Runtime Status');
    console.log('  ═════════════════════════════');
    console.log('');

    console.log(`  Overall: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`  Uptime: ${Math.floor(health.systemUptime / 1000)}s`);
    console.log('');
    console.log('  Modules:');

    for (const [moduleId, status] of Object.entries(health.modules)) {
      const moduleStatus = status as any;
      const icon = moduleStatus.state === 'running' ? '✅' : '⚠️';
      console.log(`    ${icon} ${moduleId}: ${moduleStatus.state} (uptime: ${Math.floor(moduleStatus.uptime / 1000)}s, restarts: ${moduleStatus.restarts})`);
    }

    console.log('');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.log(`  ⚠️  Unable to connect to runtime: ${err.message}`);
  }
}

/**
 * Show help text
 */
function showHelp(): void {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║         Embedded32 - Runtime Platform         ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Usage: embedded32 [command] [options]');
  console.log('');
  console.log('  Commands:');
  console.log('');
  console.log('    start [config.yaml]    Start runtime with configuration');
  console.log('    demo                   Launch demo mode (all features)');
  console.log('    init                   Initialize default config');
  console.log('    status [config.yaml]   Show runtime status');
  console.log('    add <plugin>           Add a plugin to ecosystem');
  console.log('    help                   Show this help message');
  console.log('');
  console.log('  Examples:');
  console.log('');
  console.log('    embedded32 demo                 # Run demo mode');
  console.log('    embedded32 init                 # Create config file');
  console.log('    embedded32 start                # Start with embedded32.yaml');
  console.log('    embedded32 start /etc/app.yaml  # Start with custom config');
  console.log('');
  console.log('  Configuration:');
  console.log('');
  console.log('    Edit embedded32.yaml to configure:');
  console.log('      - CAN interface');
  console.log('      - Ethernet (UDP, TCP, MQTT)');
  console.log('      - Message bridges');
  console.log('      - Dashboard');
  console.log('      - Simulators');
  console.log('');
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
