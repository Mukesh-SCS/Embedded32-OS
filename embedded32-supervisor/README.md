# embedded32-supervisor

> Central runtime supervisor and module lifecycle manager

## Overview

The supervisor is the heart of Embedded32's runtime system. It manages the lifecycle of all modules, monitors their health, distributes runtime events, and handles graceful shutdown.

Think of it as the "operating system kernel" for Embedded32 - it coordinates all the moving parts.

## Installation

```bash
npm install embedded32-supervisor
```

## Core Concepts

### Module

A module is any component that can be started, stopped, and monitored:

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

### Module State

```
CREATED → INITIALIZING → RUNNING ↔ RESTARTING
           ↓                       ↓
          ERROR ←──────────────────┘

RUNNING → STOPPING → STOPPED
```

### Supervisor

Central controller:

```typescript
import { Supervisor } from 'embedded32-supervisor';

const config: RuntimeConfig = {
  can: { interface: 'vcan0', enabled: true },
  logging: { level: 'info' }
};

const supervisor = new Supervisor(config);
supervisor.registerModule(myModule);
await supervisor.start();
```

## API Reference

### Constructor

```typescript
new Supervisor(config: RuntimeConfig, logger?: Logger)
```

Creates a new supervisor instance.

**Parameters:**
- `config` - Runtime configuration
- `logger` - Optional logger instance (created if not provided)

### Methods

#### start()

```typescript
await supervisor.start(): Promise<void>
```

Starts the supervisor and all registered modules.

**Behavior:**
- Starts modules in priority order (highest first)
- Initializes health checks
- Emits `supervisor-started` event

#### stop()

```typescript
await supervisor.stop(): Promise<void>
```

Stops the supervisor and all modules.

**Behavior:**
- Stops modules in reverse priority order
- Clears health check intervals
- Emits `supervisor-stopped` event

#### registerModule()

```typescript
supervisor.registerModule(module: Module): void
```

Registers a module with the supervisor.

**Example:**
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

#### startModule()

```typescript
await supervisor.startModule(moduleId: string): Promise<void>
```

Starts a specific module at runtime.

#### stopModule()

```typescript
await supervisor.stopModule(moduleId: string): Promise<void>
```

Stops a specific module at runtime.

#### restartModule()

```typescript
await supervisor.restartModule(moduleId: string): Promise<void>
```

Restarts a specific module.

#### getHealthStatus()

```typescript
supervisor.getHealthStatus(): HealthStatus
```

Returns the current health status of the runtime.

**Returns:**
```typescript
{
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

#### getModuleInfo()

```typescript
supervisor.getModuleInfo(): ModuleInfo[]
```

Returns detailed information about all modules.

#### getEventBus()

```typescript
supervisor.getEventBus(): RuntimeEventBus
```

Returns the event bus for subscribing to runtime events.

#### getLogger()

```typescript
supervisor.getLogger(): Logger
```

Returns the logger instance.

#### isRunningFlag()

```typescript
supervisor.isRunningFlag(): boolean
```

Checks if the supervisor is currently running.

## Events

The supervisor emits events through its event bus:

```typescript
const eventBus = supervisor.getEventBus();

eventBus.on('module-started', (data) => {
  console.log(`Module started: ${data.moduleId}`);
});

eventBus.on('module-stopped', (data) => {
  console.log(`Module stopped: ${data.moduleId}`);
});

eventBus.on('module-failed', (data) => {
  console.error(`Module failed: ${data.moduleId}: ${data.error}`);
});

eventBus.on('health-check', (data) => {
  console.log('Health status:', data);
});
```

### Event Types

| Event | When | Data |
|-------|------|------|
| `module-started` | Module initialization complete | `{ moduleId, data }` |
| `module-stopped` | Module shutdown complete | `{ moduleId, data }` |
| `module-failed` | Module encountered error | `{ moduleId, error }` |
| `config-loaded` | Configuration loaded | `{ data }` |
| `supervisor-started` | Runtime started | `{ data }` |
| `supervisor-stopped` | Runtime stopped | `{ data }` |
| `health-check` | Periodic health check | `{ data }` |

## Module Lifecycle

### Starting a Module

```typescript
await supervisor.startModule('my-module');
```

Flow:
1. Module state → `INITIALIZING`
2. Call `module.start()`
3. If successful: state → `RUNNING`
4. If failed: state → `ERROR`
5. Emit `module-started` or `module-failed`

### Stopping a Module

```typescript
await supervisor.stopModule('my-module');
```

Flow:
1. Module state → `STOPPING`
2. Call `module.stop()`
3. If successful: state → `STOPPED`
4. If failed: state → `ERROR`
5. Emit `module-stopped`

### Automatic Restart

Health checks run every 10 seconds:
- If module is in `ERROR` state, restart it
- Increment restart counter
- Enforce restart policy

## Configuration

The supervisor reads from `RuntimeConfig`:

```typescript
interface RuntimeConfig {
  can?: { interface: string; enabled?: boolean };
  j1939?: { enabled?: boolean };
  ethernet?: { /* ... */ };
  bridge?: { /* ... */ };
  dashboard?: { enabled: boolean; port: number };
  simulator?: { /* ... */ };
  logging?: { level: 'debug' | 'info' | 'warn' | 'error' };
}
```

## Examples

### Basic Usage

```typescript
import { Supervisor } from 'embedded32-supervisor';

const supervisor = new Supervisor({
  can: { interface: 'vcan0' },
  logging: { level: 'info' }
});

// Register modules
supervisor.registerModule(canModule);
supervisor.registerModule(j1939Module);
supervisor.registerModule(ethernetModule);

// Start runtime
await supervisor.start();

// Monitor health
setInterval(() => {
  const health = supervisor.getHealthStatus();
  console.log(health.healthy ? '✅ Healthy' : '❌ Unhealthy');
}, 30000);

// Graceful shutdown
process.on('SIGINT', async () => {
  await supervisor.stop();
  process.exit(0);
});
```

### Listen to Events

```typescript
const eventBus = supervisor.getEventBus();

eventBus.on('module-started', (data) => {
  console.log(`✅ ${data.moduleId} started`);
});

eventBus.on('module-failed', (data) => {
  console.error(`❌ ${data.moduleId} failed: ${data.error}`);
  // Alert monitoring system
});

eventBus.on('health-check', (data) => {
  if (!data.healthy) {
    // Trigger alert
  }
});
```

### Custom Module

```typescript
import { Module, ModuleState } from 'embedded32-supervisor';

class MyModule implements Module {
  id = 'my-module';
  name = 'My Custom Module';
  version = '1.0.0';

  async start(): Promise<void> {
    console.log('Starting...');
    await this.initialize();
  }

  async stop(): Promise<void> {
    console.log('Stopping...');
    await this.cleanup();
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: ModuleState.RUNNING,
      uptime: Date.now() - this.startTime,
      restartCount: 0,
      config: {
        name: this.name,
        enabled: true,
        priority: 50,
        restartPolicy: 'on-failure',
        maxRestarts: 5
      }
    };
  }

  private async initialize(): Promise<void> {
    // Your initialization code
  }

  private async cleanup(): Promise<void> {
    // Your cleanup code
  }
}

// Use it
const module = new MyModule();
supervisor.registerModule(module);
```

### Runtime Management

```typescript
// Start a module at runtime
await supervisor.startModule('can');

// Check status
const info = supervisor.getModuleInfo();
console.log(info);

// Restart a failed module
await supervisor.restartModule('j1939');

// Get health status
const health = supervisor.getHealthStatus();
console.log(
  `System healthy: ${health.healthy}`,
  `Uptime: ${health.systemUptime}ms`
);

// Stop gracefully
await supervisor.stop();
```

## Logging

The supervisor uses a built-in logger:

```typescript
const logger = supervisor.getLogger();

logger.debug('Debug message');
logger.info('Information');
logger.warn('Warning');
logger.error('Error', new Error('details'));
```

Configure logging level:

```typescript
const supervisor = new Supervisor({
  logging: { level: 'debug' }  // verbose output
});
```

## Performance

### Startup Time

| Module | Time |
|--------|------|
| Supervisor init | ~10ms |
| Module load | ~50ms |
| Module start | ~100-200ms |
| Health check init | ~10ms |
| **Total** | **~600ms** |

### Memory Usage

| Component | Usage |
|-----------|-------|
| Supervisor | ~2MB |
| Event history | ~1MB (1000 events) |
| Module tracking | ~100KB |
| **Total** | **~3MB** |

### Health Check Overhead

- Runs every 10 seconds
- Checks all modules: <1ms
- CPU impact: <1% idle

## Troubleshooting

### Module Fails to Start

**Symptom:** Module state is ERROR

**Debug:**
```typescript
const info = supervisor.getModuleInfo();
const failedModule = info.find(m => m.lastError);
console.log(failedModule.lastError);
```

### High Memory Usage

**Possible causes:**
- Large event history (1000+ events)
- Module-specific leaks
- Rule engine with thousands of rules

**Solution:**
```typescript
const eventBus = supervisor.getEventBus();
eventBus.clearHistory();
```

### Modules Keep Restarting

**Symptom:** High restart count

**Debug:**
```typescript
const info = supervisor.getModuleInfo();
const unstableModule = info.find(m => m.restartCount > 5);
console.log(unstableModule);
```

## Best Practices

1. **Register all modules before starting**
   ```typescript
   supervisor.registerModule(module1);
   supervisor.registerModule(module2);
   await supervisor.start();
   ```

2. **Listen to health events**
   ```typescript
   eventBus.on('health-check', (data) => {
     if (!data.healthy) notifyOps();
   });
   ```

3. **Implement proper cleanup**
   ```typescript
   process.on('SIGINT', async () => {
     await supervisor.stop();
   });
   ```

4. **Log module errors**
   ```typescript
   eventBus.on('module-failed', (data) => {
     logger.error(`Module failed: ${data.moduleId}`);
   });
   ```

5. **Monitor restart counts**
   ```typescript
   const info = supervisor.getModuleInfo();
   for (const module of info) {
     if (module.restartCount > 3) {
       logger.warn(`Module ${module.id} restarting frequently`);
     }
   }
   ```

## Architecture

```
┌─────────────────────────────────┐
│      Supervisor                 │
├─────────────────────────────────┤
│ - Module registration           │
│ - Lifecycle management          │
│ - Health monitoring             │
│ - Event distribution            │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐   ┌────────────┐
│ModuleLoader    │RuntimeEventBus│
│- Registry      │- Events       │
│- Start/Stop    │- History      │
│- Restart       │- Listeners    │
└──────────┘   └────────────┘
```

## License

MIT © Mukesh Mani Tripathi

## See Also

- `embedded32-core` - Runtime and message bus
- `embedded32-cli` - Command-line launcher
- `embedded32-bridge` - Message routing
- `PLATFORM_INTEGRATION_GUIDE.md` - Advanced usage patterns
