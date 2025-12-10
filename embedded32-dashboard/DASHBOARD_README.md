# Embedded32 Dashboard

A modern, real-time web dashboard for monitoring CAN and J1939 traffic, inspired by Vector CANalyzer. The dashboard connects to the Embedded32 runtime via WebSocket and provides live visualization of:

- **Live CAN frames** - Raw CAN bus traffic
- **Live J1939 decoded PGNs** - Parameter Group Numbers with SPN values
- **Engine speed & temperature charts** - Real-time graphing with Recharts
- **DM1 fault codes** - Diagnostic trouble codes
- **Filter panel** - Filter by PGN, SA (Source Address), priority
- **Connection manager** - Connect to can0, vcan0, or PCAN interfaces
- **ECU simulator controls** - Control simulated ECUs (future feature)

## Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│   Dashboard UI  │ ◄────────────────────────► │  Bridge Server   │
│  (React + Vite) │      ws://localhost:9000    │  (Node.js + ws)  │
└─────────────────┘                             └──────────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  CAN Driver  │
                                                  │  J1939 Stack │
                                                  └──────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A CAN interface (can0, vcan0, or PCAN)

### Installation

From the monorepo root:

```bash
# Install all dependencies
npm install

# Build the tools package
npm run build --workspace embedded32-tools
```

### Running the Dashboard

#### Step 1: Start the WebSocket Bridge

The bridge connects to your CAN interface and forwards decoded J1939 messages to the dashboard:

```bash
node embedded32-tools/dist/cli.js dashboard bridge --port 9000 --iface vcan0
```

Options:
- `--port <port>` - WebSocket port (default: 9000)
- `--iface <iface>` - CAN interface name (default: vcan0)

You should see:
```
Starting Embedded32 Dashboard Bridge...
Interface: vcan0
WebSocket Port: 9000
WebSocket bridge listening on port 9000
Dashboard UI: http://localhost:5173
Connect from dashboard to: ws://localhost:9000
```

#### Step 2: Start the Dashboard UI

In a separate terminal:

```bash
cd embedded32-dashboard
npm run dev
```

The Vite dev server will start:
```
VITE ready in 233 ms
➜  Local:   http://localhost:5173/
```

#### Step 3: Open and Connect

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. The WebSocket URL should be pre-filled: `ws://localhost:9000`
3. Click **Connect**
4. You should see "Status: Connected" and live data streaming in!

### Generating Test Data

To see the dashboard in action, you can:

1. **Use the built-in mock data** - The bridge automatically sends simulated engine data
2. **Run J1939 simulators**:
   ```bash
   node embedded32-tools/dist/cli.js ecu simulate --engine
   ```
3. **Send custom J1939 messages**:
   ```bash
   node embedded32-tools/dist/cli.js j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF"
   ```

## Features

### Live PGN Table
- Displays all incoming J1939 messages
- Color-coded by message type:
  - 🔵 Blue: Engine (EEC1)
  - 🟠 Orange: Transmission (ETC1)
  - 🟢 Green: Aftertreatment
  - 🔴 Red: Faults (DM1)
- Shows: Priority, PGN, Name, SA, Timestamp, Raw bytes, SPN values

### Engine Charts
- Real-time line charts using Recharts
- Tracks engine speed (RPM) and coolant temperature (°C)
- Auto-updating as new data arrives

### DM1 Fault Viewer
- Displays active diagnostic trouble codes
- Shows: SPN, FMI, Description, Occurrence count
- Highlighted in red for visibility

### Filter Panel
- Filter messages by:
  - PGN (Parameter Group Number)
  - SA (Source Address)
  - Priority level
- Filters persist in localStorage

### Connection Manager
- Connect/disconnect from WebSocket bridge
- Configure WebSocket URL
- Shows connection status
- URL persists in localStorage

### Raw CAN Frame Viewer
- Low-level CAN frame display
- Useful for debugging
- Shows CAN ID, data bytes, timestamp

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Connection Manager  │  Filters                             │
├─────────────────────────────────────────────────────────────┤
│  Live PGN Table (left)          │  Engine Charts (right)    │
│                                  │                           │
├─────────────────────────────────────────────────────────────┤
│  DM1 Fault Viewer                                           │
├─────────────────────────────────────────────────────────────┤
│  Raw CAN Frames (optional, for debugging)                   │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Project Structure

```
embedded32-dashboard/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main app layout
│   ├── components/           # UI components
│   │   ├── ConnectionManager.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── PGNTable.tsx
│   │   ├── EngineChart.tsx
│   │   ├── DM1Viewer.tsx
│   │   ├── CANFrameList.tsx
│   │   └── ECUSimulatorControls.tsx
│   ├── hooks/                # React hooks
│   │   └── useDashboardState.tsx
│   ├── services/             # WebSocket client
│   │   └── ws.ts
│   └── styles/               # Global CSS
│       └── global.css
├── index.html                # HTML entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

### WebSocket Message Format

The bridge sends messages in this format:

```json
{
  "type": "j1939",
  "timestamp": 1713200234,
  "pgn": "0xF004",
  "sa": "0x00",
  "parameters": {
    "engineSpeed": 1575,
    "coolantTemp": 82,
    "priority": 3,
    "name": "EEC1",
    "spnValues": {
      "engineSpeed": 1575,
      "coolantTemp": 82
    }
  }
}
```

Message types:
- `j1939` - Decoded J1939 messages
- `can` - Raw CAN frames
- `dm1` - Diagnostic trouble codes

### Building for Production

```bash
npm run build
```

The build output will be in `dist/`.

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Dashboard won't connect
- Ensure the bridge is running: `node embedded32-tools/dist/cli.js dashboard bridge`
- Check the WebSocket URL is correct: `ws://localhost:9000`
- Check browser console for errors

### No data showing
- Verify CAN interface is active: `ip link show vcan0`
- Check if simulators are running
- Look at bridge terminal output for errors

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Ensure TypeScript dependencies are installed
- Check Node.js version (18+ required)

## Future Enhancements

- [ ] ECU simulator controls in UI
- [ ] Save/load sessions
- [ ] Export data to CSV/JSON
- [ ] DBC file import for message definitions
- [ ] Multiple CAN interface support
- [ ] Dark mode theme
- [ ] Playback recorded sessions
- [ ] Advanced filtering (regex, ranges)
- [ ] Custom chart configurations
- [ ] Alert/notification system

## License

MIT

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

For issues or questions, please open an issue on GitHub.
