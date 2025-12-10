# embedded32-core

> Lightweight OS runtime for Embedded32 platform

## Overview

The core runtime provides the foundation for all Embedded32 modules:

Core responsibilities:

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
│   ├── runtime/        # Runtime orchestrator
│   ├── modules/        # Module base class
│   ├── scheduler/      # Task scheduler
│   ├── messaging/      # Message bus
│   ├── registry/       # Module registry
│   ├── logger/         # Logging system
│   ├── config/         # Config loader
│   └── memory/         # Memory utilities
├── tests/
└── examples/
```

## Quick Start

### 1. Creating a Runtime

```typescript
import { Runtime } from 'embedded32-core';

const runtime = new Runtime({
  logLevel: 'info',
  configPath: './config.json'
});

await runtime.start();
```

### 2. Creating a Custom Module

```typescript
import { Module } from 'embedded32-core';

class MotorModule extends Module {
  onInit() {
    this.log('Motor module initialized');
  }

  onStart() {
    this.log('Motor module started');
    
    // Listen to messages
    this.bus.subscribe('motor.speed.set', (payload) => {
      this.log('Setting speed:', payload.value);
    });
  }

  onStop() {
    this.log('Motor module stopped');
  }
}
```

### 3. Registering Modules

```typescript
runtime.registerModule(new MotorModule({ name: 'motor' }));
await runtime.start();
```

## Core Concepts

### Runtime

Handles module initialization, scheduling, shutdown, logging, and IPC wiring.

### Modules

Each module implements lifecycle hooks:
- `onInit()` - Setup
- `onStart()` - Execution
- `onStop()` - Cleanup

### Message Bus

Publish or subscribe to events:

```typescript
bus.publish('system.ready');
bus.subscribe('sensor.data', handler);
```

### Scheduler

Run periodic tasks:

```typescript
scheduler.every(1000, () => console.log('Tick'));
```

### Logger

Structured logging:

```typescript
logger.info('Information');
logger.warn('Warning');
logger.error('Error');
logger.debug('Debug');
```

## License

MIT © Mukesh Mani Tripathi