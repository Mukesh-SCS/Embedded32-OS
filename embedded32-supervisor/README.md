# embedded32-supervisor

Central runtime supervisor and module lifecycle manager for Embedded32.

## Overview

The supervisor manages the lifecycle of all modules, monitors health, distributes events, and handles graceful shutdown.

## Installation

```bash
npm install embedded32-supervisor
```

## Usage

### Create Supervisor

```typescript
import { Supervisor } from 'embedded32-supervisor';

const config: RuntimeConfig = {
  can: { interface: 'vcan0', enabled: true },
  logging: { level: 'info' }
};

const supervisor = new Supervisor(config);
```

### Register Modules

```typescript
supervisor.registerModule({
  id: 'my-module',
  name: 'My Module',
  version: '1.0.0',
  start: async () => { /* ... */ },
  stop: async () => { /* ... */ },
  getStatus: () => ({ /* ... */ })
});
```

### Start and Stop

```typescript
await supervisor.start();
// ...
await supervisor.stop();
```

### Module Lifecycle

```
CREATED → INITIALIZING → RUNNING ↔ RESTARTING
           ↓                       ↓
          ERROR ←──────────────────┘

RUNNING → STOPPING → STOPPED
```

## API Reference

### Supervisor

| Method | Description |
|--------|-------------|
| `start()` | Start supervisor and all modules |
| `stop()` | Stop supervisor and all modules |
| `registerModule(module)` | Register a module |
| `startModule(id)` | Start specific module |
| `stopModule(id)` | Stop specific module |
| `restartModule(id)` | Restart specific module |
| `getHealthStatus()` | Get runtime health status |
| `getModuleInfo()` | Get all module information |
| `getEventBus()` | Get runtime event bus |
| `getLogger()` | Get logger instance |
| `isRunningFlag()` | Check if running |

### Module Interface

```typescript
interface Module {
  id: string;
  name: string;
  version: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ModuleInfo;
}
```

### HealthStatus

```typescript
interface HealthStatus {
  healthy: boolean;
  modules: {
    [moduleId: string]: {
      state: ModuleState;
      uptime: number;
      restarts: number;
    };
  };
  timestamp: number;
  systemUptime: number;
}
```

## License

MIT © Mukesh Mani Tripathi
