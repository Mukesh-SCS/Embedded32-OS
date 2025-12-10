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

    wss.on('connection', (ws) => {
      console.log('Dashboard client connected');
      
      // Send mock data for testing
      const interval = setInterval(() => {
        const mockMessage = {
          type: 'j1939',
          timestamp: Date.now() / 1000,
          pgn: '0xF004',
          sa: '0x00',
          parameters: {
            engineSpeed: Math.floor(Math.random() * 2000) + 500,
            coolantTemp: Math.floor(Math.random() * 50) + 60,
            priority: 3,
            name: 'EEC1',
            spnValues: {
              engineSpeed: Math.floor(Math.random() * 2000) + 500,
              coolantTemp: Math.floor(Math.random() * 50) + 60
            }
          }
        };
        ws.send(JSON.stringify(mockMessage));
      }, 1000);

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
