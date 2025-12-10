# embedded32-dashboard

> Web-based real-time monitoring and visualization

## Overview

Browser-based dashboard for monitoring and controlling Embedded32 systems:

- **Real-time monitoring** - Live CAN/J1939 data
- **PGN/SPN explorer** - Browse and decode messages
- **Network topology** - Visualize device network
- **Data logging** - Record and replay sessions
- **Signal graphing** - Plot time-series data

## Installation

```bash
npm install embedded32-dashboard
```

## Features

- WebSocket-based real-time updates
- Responsive React UI
- Device discovery and status
- Custom dashboard layouts
- Export data to CSV/JSON

## Architecture

```
embedded32-dashboard/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Dashboard pages
│   ├── services/       # WebSocket services
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utilities
├── public/
└── server/             # Backend WebSocket server
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Quick Start

```bash
# Start the dashboard server
embedded32 dashboard --port 3000

# Open in browser
# http://localhost:3000
```

## Phase 2 Deliverables (Weeks 10-12)

- [ ] Real-time PGN viewer
- [ ] CAN frame inspector
- [ ] Device status panel
- [ ] Signal plotting
- [ ] Session logging

## License

MIT © Mukesh Mani Tripathi
