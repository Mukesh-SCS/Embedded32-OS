# embedded32-core

> Lightweight OS runtime for Embedded32 platform

## Overview

The core runtime provides the foundation for all Embedded32 modules:

- **Task Scheduler** - Cooperative task scheduling
- **Message Bus** - Inter-module communication (IPC)
- **Module Registry** - Dynamic module loading and management
- **Logger** - Centralized logging system
- **Config Loader** - Configuration file management
- **Memory Pools** - Efficient memory allocation

## Installation

```bash
npm install embedded32-core
```

## Architecture

```
embedded32-core/
├── src/
│   ├── scheduler/      # Task scheduler
│   ├── messaging/      # Message bus (IPC)
│   ├── registry/       # Module registry
│   ├── logger/         # Logging system
│   ├── config/         # Configuration loader
│   └── memory/         # Memory management
├── tests/
└── examples/
```

## Quick Start

```typescript
import { Runtime, Module } from 'embedded32-core';

// Create runtime instance
const runtime = new Runtime({
  logLevel: 'info',
  configPath: './config.json'
});

// Register a module
runtime.registerModule(new MyCustomModule());

// Start the runtime
await runtime.start();
```

## Phase 1 Deliverables (Weeks 1-2)

- [x] Basic task scheduler
- [ ] Message bus implementation
- [ ] Module registry system
- [ ] Logger with multiple levels
- [ ] JSON config loader

## License

MIT © Mukesh Mani Tripathi
