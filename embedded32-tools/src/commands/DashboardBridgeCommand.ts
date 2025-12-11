import { Command } from 'commander';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
// Import runtime, CAN driver, J1939 decoder from embedded32-core and embedded32-can
// import { initializeRuntime, startCANDriver, startJ1939Decoder } from 'embedded32-core';

interface CommandOptions {
  port: string;
  iface: string;
}

const DashboardBridgeCommand = new Command('dashboard bridge')
  .description('Start Embedded32 WebSocket bridge for dashboard')
  .option('--port <port>', 'WebSocket port', '9000')
  .option('--iface <iface>', 'CAN interface', 'vcan0')
  .action(async (opts: CommandOptions) => {
    const port = parseInt(opts.port, 10);
    const iface = opts.iface;

    console.log(`Starting Embedded32 Dashboard Bridge...`);
    console.log(`Interface: ${iface}`);
    console.log(`WebSocket Port: ${port}`);

    // TODO: Initialize runtime, CAN driver, J1939 decoder
    // await initializeRuntime();
    // await startCANDriver(iface);
    // await startJ1939Decoder();

    const server = createServer();
    const wss = new WebSocketServer({ server });

    let engineRunning = false;
    let currentRPM = 800;
    let dm1Faults: any[] = [];
    let frameCount = 0;

    wss.on('connection', (ws) => {
      console.log('Dashboard client connected');
      
      // Handle incoming commands from dashboard
      ws.on('message', (data) => {
        try {
          const command = JSON.parse(data.toString());
          console.log('Received command:', command);

          // Handle engine commands
          if (command.type === 'command') {
            if (command.target === 'engine') {
              if (command.action === 'start') {
                engineRunning = true;
                currentRPM = 800;
                console.log('Engine started');
              } else if (command.action === 'stop') {
                engineRunning = false;
                currentRPM = 0;
                console.log('Engine stopped');
              }
            }
          }

          // Handle RPM adjustment
          if (command.type === 'engine.rpm.adjust') {
            if (engineRunning) {
              currentRPM = command.targetRpm || currentRPM;
              console.log('RPM adjusted to:', currentRPM);
            }
          }

          // Handle DM1 fault injection
          if (command.type === 'j1939.dm1.inject') {
            const fault = {
              spn: command.spn || 102,
              fmi: command.fmi || 1,
              description: command.description || 'Injected Fault',
              count: 1,
              occurrence: 1
            };
            dm1Faults.push(fault);
            console.log('Injected DM1 fault:', fault);
            
            // Send DM1 update
            ws.send(JSON.stringify({
              type: 'j1939.dm1',
              faults: dm1Faults,
              timestamp: Date.now() / 1000
            }));
          }

          // Handle DM1 clear
          if (command.type === 'j1939.dm1.clear') {
            dm1Faults = [];
            console.log('Cleared DM1 faults');
            
            // Send DM1 update
            ws.send(JSON.stringify({
              type: 'j1939.dm1',
              faults: [],
              timestamp: Date.now() / 1000
            }));
          }
        } catch (err) {
          console.error('Error processing command:', err);
        }
      });
      
      // Send mock data for testing
      const interval = setInterval(() => {
        frameCount++;

        // Send J1939 message
        const mockMessage = {
          type: 'j1939',
          timestamp: Date.now() / 1000,
          pgn: '0xF004',
          sa: '0x00',
          parameters: {
            engineSpeed: engineRunning ? currentRPM + Math.floor(Math.random() * 100) : 0,
            coolantTemp: engineRunning ? Math.floor(Math.random() * 20) + 70 : 25,
            priority: 3,
            name: 'EEC1',
            spnValues: {
              engineSpeed: engineRunning ? currentRPM + Math.floor(Math.random() * 100) : 0,
              coolantTemp: engineRunning ? Math.floor(Math.random() * 20) + 70 : 25
            }
          }
        };
        ws.send(JSON.stringify(mockMessage));

        // Send bus statistics every second
        if (frameCount % 10 === 0) {
          const fps = Math.floor(Math.random() * 200) + 250;
          const busLoad = (fps * 64 / 250000) * 100;
          
          ws.send(JSON.stringify({
            type: 'stats',
            fps: fps,
            load: busLoad
          }));
        }
      }, 100);

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
        clearInterval(interval);
      });
      
      // Forward decoded messages to dashboard clients
      // Example message:
      // ws.send(JSON.stringify({
      //   type: 'j1939',
      //   timestamp: Date.now() / 1000,
      //   pgn: '0xF004',
      //   sa: '0x00',
      //   parameters: { engineSpeed: 1575, coolantTemp: 82 }
      // }));
    });

    server.listen(port, () => {
      console.log(`WebSocket bridge listening on port ${port}`);
      console.log(`Dashboard UI: http://localhost:5173`);
      console.log(`Connect from dashboard to: ws://localhost:${port}`);
    });
  });

export default DashboardBridgeCommand;
