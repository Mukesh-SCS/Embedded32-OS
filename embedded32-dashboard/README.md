# embedded32-dashboard

Web-based real-time monitoring and visualization for Embedded32.

## Overview

Browser-based dashboard for monitoring and controlling Embedded32 systems:

- **Real-time Monitoring** - Live CAN/J1939 data visualization
- **PGN/SPN Explorer** - Browse and decode messages
- **Network Topology** - Visualize device network
- **Data Logging** - Record and replay sessions
- **Signal Graphing** - Plot time-series data

## Installation

```bash
npm install embedded32-dashboard
```

## Usage

### Start Dashboard

```bash
# Using CLI
embedded32 dashboard --port 3000

# Open browser
# http://localhost:3000
```

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Features

- WebSocket-based real-time updates
- Responsive React UI
- Device discovery and status
- Custom dashboard layouts
- Export data to CSV/JSON

## License

MIT © Mukesh Mani Tripathi
