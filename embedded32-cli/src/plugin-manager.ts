import { Supervisor, Module, ModuleState } from '@embedded32/supervisor';
import { RuntimeConfig } from '@embedded32/supervisor';
import { Logger } from '@embedded32/supervisor';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as WebSocket from 'ws';
import * as http from 'http';

/**
 * Plugin-based module system for extensibility
 */
export class PluginManager {
  private plugins: Map<string, ModuleFactory> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.registerBuiltins();
  }

  /**
   * Register a module factory
   */
  registerPlugin(name: string, factory: ModuleFactory): void {
    this.plugins.set(name, factory);
    this.logger.info(`Plugin registered: ${name}`);
  }

  /**
   * Create module from plugin
   */
  createModule(name: string, config: RuntimeConfig): Module {
    const factory = this.plugins.get(name);
    if (!factory) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return factory(config);
  }

  /**
   * List available plugins
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Register built-in modules
   */
  private registerBuiltins(): void {
    // CAN module
    this.registerPlugin('can', (config: RuntimeConfig) => ({
      id: 'can',
      name: 'CAN Bus',
      version: '0.1.0',
      start: async () => {
        this.logger.info('CAN Bus module starting...');
        // Initialize CAN interface
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('CAN Bus module stopping...');
      },
      getStatus: () => ({
        id: 'can',
        name: 'CAN Bus',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'can', enabled: true, priority: 100, restartPolicy: 'always', maxRestarts: 5 }
      })
    }));

    // J1939 module
    this.registerPlugin('j1939', (config: RuntimeConfig) => ({
      id: 'j1939',
      name: 'J1939 Decoder',
      version: '0.1.0',
      start: async () => {
        this.logger.info('J1939 module starting...');
        await new Promise(r => setTimeout(r, 50));
      },
      stop: async () => {
        this.logger.info('J1939 module stopping...');
      },
      getStatus: () => ({
        id: 'j1939',
        name: 'J1939 Decoder',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'j1939', enabled: true, priority: 90, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Ethernet module
    this.registerPlugin('ethernet', (config: RuntimeConfig) => ({
      id: 'ethernet',
      name: 'Ethernet Transport',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Ethernet module starting...');
        if (config.ethernet?.udp?.enabled) {
          this.logger.info(`  → UDP server on port ${config.ethernet.udp.port}`);
        }
        if (config.ethernet?.tcp?.enabled) {
          this.logger.info(`  → TCP server on port ${config.ethernet.tcp.port}`);
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Ethernet module stopping...');
      },
      getStatus: () => ({
        id: 'ethernet',
        name: 'Ethernet Transport',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'ethernet', enabled: true, priority: 80, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Bridge module
    this.registerPlugin('bridge', (config: RuntimeConfig) => ({
      id: 'bridge',
      name: 'Message Bridge',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Bridge module starting...');
        if (config.bridge?.canEthernet?.enabled) {
          this.logger.info('  → CAN ↔ Ethernet bridge active');
        }
        if (config.bridge?.canMqtt?.enabled) {
          this.logger.info('  → CAN ↔ MQTT bridge active');
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Bridge module stopping...');
      },
      getStatus: () => ({
        id: 'bridge',
        name: 'Message Bridge',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'bridge', enabled: true, priority: 70, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Dashboard module
    let dashboardProcess: ChildProcess | null = null;
    
    this.registerPlugin('dashboard', (config: RuntimeConfig) => ({
      id: 'dashboard',
      name: 'Web Dashboard',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Dashboard module starting...');
        const dashboardPath = path.resolve(process.cwd(), 'embedded32-dashboard');
        
        try {
          // On Windows, use shell with the command directly; on Unix use shell: false
          const isWindows = process.platform === 'win32';
          const command = 'npm run dev';
          
          if (isWindows) {
            dashboardProcess = spawn('cmd.exe', ['/c', command], {
              cwd: dashboardPath,
              stdio: 'pipe',
              env: { ...process.env, NODE_NO_WARNINGS: '1' }
            });
          } else {
            dashboardProcess = spawn('npm', ['run', 'dev'], {
              cwd: dashboardPath,
              stdio: 'pipe',
              env: { ...process.env, NODE_NO_WARNINGS: '1' }
            });
          }
          
          // Capture output for logging
          dashboardProcess.stdout?.on('data', (data) => {
            const output = data.toString().trim();
            if (output) this.logger.info(`[Dashboard] ${output}`);
          });
          
          dashboardProcess.stderr?.on('data', (data) => {
            const output = data.toString().trim();
            if (output) this.logger.warn(`[Dashboard] ${output}`);
          });
          
          dashboardProcess.on('error', (err) => {
            this.logger.error(`Dashboard process error: ${err.message}`);
            dashboardProcess = null;
          });
          
          dashboardProcess.on('exit', (code) => {
            if (code !== 0) {
              this.logger.warn(`Dashboard process exited with code ${code}`);
            }
            dashboardProcess = null;
          });
          
          // Give the server time to start
          await new Promise(r => setTimeout(r, 3000));
          
          if (config.dashboard?.enabled) {
            this.logger.info(`  → Server on http://${config.dashboard.host || 'localhost'}:${config.dashboard.port || 5173}`);
          }
        } catch (err) {
          this.logger.error(`Failed to start dashboard: ${err instanceof Error ? err.message : String(err)}`);
          throw err;
        }
      },
      stop: async () => {
        this.logger.info('Dashboard module stopping...');
        if (dashboardProcess) {
          dashboardProcess.kill();
          dashboardProcess = null;
        }
      },
      getStatus: () => ({
        id: 'dashboard',
        name: 'Web Dashboard',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'dashboard', enabled: true, priority: 60, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    // Simulator module
    this.registerPlugin('simulator', (config: RuntimeConfig) => ({
      id: 'simulator',
      name: 'CAN Simulator',
      version: '0.1.0',
      start: async () => {
        this.logger.info('Simulator module starting...');
        const enabled = [];
        if (config.simulator?.engine) enabled.push('Engine');
        if (config.simulator?.transmission) enabled.push('Transmission');
        if (config.simulator?.brakes) enabled.push('Brakes');
        if (enabled.length > 0) {
          this.logger.info(`  → Simulating: ${enabled.join(', ')}`);
        }
        await new Promise(r => setTimeout(r, 100));
      },
      stop: async () => {
        this.logger.info('Simulator module stopping...');
      },
      getStatus: () => ({
        id: 'simulator',
        name: 'CAN Simulator',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'simulator', enabled: true, priority: 50, restartPolicy: 'always', maxRestarts: 5 }
      })
    }));

    // WebSocket Bridge module for dashboard
    let wsServer: WebSocket.Server | null = null;
    let wsCleanup: (() => void) | null = null;
    let activeDM1Faults: Map<number, any> = new Map(); // Track active faults by SPN
    
    this.registerPlugin('ws-bridge', (config: RuntimeConfig) => ({
      id: 'ws-bridge',
      name: 'WebSocket Bridge',
      version: '0.1.0',
      start: async () => {
        this.logger.info('WebSocket Bridge module starting...');
        try {
          const wsPort = 9001; // Use port 9001 for WebSocket
          const httpServer = http.createServer();
          wsServer = new WebSocket.Server({ server: httpServer });

          wsServer.on('connection', (ws) => {
            this.logger.info('Dashboard connected via WebSocket');
            ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Embedded32 Backend' }));

            ws.on('message', (data) => {
              try {
                const msg = JSON.parse(data.toString());
                this.logger.debug(`Received from dashboard: ${msg.type}`);
                
                // Handle DM1 fault injection commands
                if (msg.type === 'j1939.dm1.inject') {
                  const fault = {
                    spn: msg.spn,
                    fmi: msg.fmi,
                    description: msg.description,
                    count: 1,
                    occurrence: 1
                  };
                  activeDM1Faults.set(msg.spn, fault);
                  this.logger.info(`DM1 Fault injected: SPN ${msg.spn}, FMI ${msg.fmi}`);
                  
                  // Send updated DM1 fault list to all clients
                  const faults = Array.from(activeDM1Faults.values());
                  wsServer?.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'dm1',
                        faults: faults
                      }));
                    }
                  });
                } else if (msg.type === 'j1939.dm1.clear') {
                  activeDM1Faults.clear();
                  this.logger.info('All DM1 faults cleared');
                  
                  // Send updated (empty) DM1 fault list to all clients
                  wsServer?.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'dm1',
                        faults: []
                      }));
                    }
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            });

            ws.on('close', () => {
              this.logger.info('Dashboard disconnected');
            });

            ws.on('error', (err) => {
              this.logger.error(`WebSocket error: ${err.message}`);
            });
          });

          // Mock J1939 data generation for dashboard
          let messageCount = 0;
          let lastStatsTime = Date.now();
          let messagesInWindow = 0;

          const j1939Interval = setInterval(() => {
            if (wsServer && wsServer.clients.size > 0) {
              const timestamp = Date.now();
              const mockMessages = [
                {
                  type: 'j1939',
                  timestamp: timestamp,
                  pgn: '0xF004',
                  sa: '0x00',
                  parameters: {
                    name: 'EEC1',
                    priority: 6,
                    spnValues: {
                      engineSpeed: Math.floor(800 + Math.random() * 3000),
                      coolantTemp: Math.floor(80 + Math.random() * 20),
                      acceleratorPedal: Math.floor(Math.random() * 100)
                    }
                  }
                },
                {
                  type: 'j1939',
                  timestamp: timestamp + 1,
                  pgn: '0xF001',
                  sa: '0x00',
                  parameters: {
                    name: 'ETC1',
                    priority: 6,
                    spnValues: {
                      transmissionGear: Math.floor(Math.random() * 6),
                      torquePercent: Math.floor(Math.random() * 100)
                    }
                  }
                }
              ];

              wsServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  mockMessages.forEach(msg => {
                    client.send(JSON.stringify(msg));
                    messageCount++;
                    messagesInWindow++;
                  });

                  // Send bus statistics every 1 second
                  const now = Date.now();
                  if (now - lastStatsTime >= 1000) {
                    const framesPerSec = messagesInWindow;
                    // Estimate bus load as percentage of max capacity (assuming 2500 frames/sec max)
                    const busLoad = (framesPerSec / 2500) * 100;
                    
                    const statsMsg = {
                      type: 'stats',
                      fps: framesPerSec,
                      load: busLoad,
                      timestamp: now
                    };
                    
                    client.send(JSON.stringify(statsMsg));
                    this.logger.debug(`WebSocket: Stats - ${framesPerSec} fps, ${busLoad.toFixed(1)}% load`);
                  }
                }
              });

              // Reset stats window after 1 second
              const now = Date.now();
              if (now - lastStatsTime >= 1000) {
                lastStatsTime = now;
                messagesInWindow = 0;
              }
              
              if (messageCount % 20 === 0) {
                this.logger.debug(`WebSocket: Sent ${messageCount} messages total to ${wsServer.clients.size} client(s)`);
              }
            }
          }, 500); // Send data every 500ms

          httpServer.listen(wsPort, () => {
            this.logger.info(`  → WebSocket Bridge on ws://localhost:${wsPort}`);
          });

          wsCleanup = () => {
            clearInterval(j1939Interval);
            wsServer?.close();
            httpServer.close();
          };

          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          this.logger.error(`Failed to start WebSocket Bridge: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
      stop: async () => {
        this.logger.info('WebSocket Bridge module stopping...');
        if (wsCleanup) {
          wsCleanup();
          wsCleanup = null;
        }
        if (wsServer) {
          wsServer = null;
        }
      },
      getStatus: () => ({
        id: 'ws-bridge',
        name: 'WebSocket Bridge',
        version: '0.1.0',
        state: ModuleState.RUNNING,
        uptime: 0,
        restartCount: 0,
        config: { name: 'ws-bridge', enabled: true, priority: 55, restartPolicy: 'on-failure', maxRestarts: 5 }
      })
    }));

    this.logger.debug('Built-in plugins registered');
  }
}

export type ModuleFactory = (config: RuntimeConfig) => Module;
