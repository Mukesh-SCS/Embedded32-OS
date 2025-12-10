# embedded32-j1939

> SAE J1939 protocol stack implementation

## Overview

Complete J1939 protocol implementation for heavy-duty vehicle networks:

- **PGN/SPN** encoding and decoding
- **Transport Protocol** (BAM and RTS/CTS)
- **Address Claim** procedure
- **Diagnostics** (DM1, DM2, DM3, etc.)
- **Network Management**

## Installation

```bash
npm install embedded32-j1939
```

## Features

- Full J1939-21, J1939-71, J1939-73 support
- PGN database with 500+ standard PGNs
- SPN value extraction and conversion
- Multi-packet message assembly
- Diagnostic trouble code (DTC) handling

## Architecture

```
embedded32-j1939/
├── src/
│   ├── pgn/            # PGN encoder/decoder
│   ├── spn/            # SPN definitions
│   ├── transport/      # Transport protocol
│   ├── address/        # Address claim
│   ├── diagnostics/    # DM1, DM2, DM3, etc.
│   └── database/       # PGN/SPN database
├── tests/
└── examples/
```

## Quick Start

```typescript
import { J1939 } from 'embedded32-j1939';

// Create J1939 instance
const j1939 = new J1939({
  interface: 'can0',
  address: 0x80,
  name: 0x0123456789ABCDEF
});

// Decode incoming PGN
j1939.on('pgn', (message) => {
  console.log(`PGN: ${message.pgn}`);
  console.log(`Source: ${message.source}`);
  console.log(`Data:`, message.spns);
});

// Send a PGN
await j1939.send({
  pgn: 61444, // Engine Speed
  priority: 3,
  data: {
    engineSpeed: 1500 // RPM
  }
});
```

## Phase 1 Deliverables (Weeks 3-5)

- [ ] PGN encoder/decoder
- [ ] Basic SPN extraction
- [ ] Transport Protocol (BAM)
- [ ] Transport Protocol (RTS/CTS)
- [ ] Address Claim
- [ ] DM1 diagnostic support

## License

MIT © Mukesh Mani Tripathi
