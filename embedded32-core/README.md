# embedded32-core

Lightweight OS runtime for the Embedded32 platform.

## Overview

The core runtime provides the foundation for all Embedded32 modules:

- **Runtime Orchestrator** - Module lifecycle management
- **Task Scheduler** - Cooperative task scheduling with priority support
- **Message Bus** - Inter-module pub/sub communication
- **Module Registry** - Dynamic module loading
- **Logger** - Centralized logging with multiple levels
- **Config Loader** - JSON-based configuration

## Installation

```bash
npm install @embedded32/core
```

## Usage

### Creating a Runtime

```typescript
import { Runtime } from '@embedded32/core';

const runtime = new Runtime({
  logLevel: 'info',
  configPath: './config.json'
});

await runtime.start();
```

### Creating a Custom Module

```typescript
import { BaseModule } from '@embedded32/core';

class MotorModule extends BaseModule {
  onInit() {
    this.log('Motor module initialized');
  }

  onStart() {
    this.bus.subscribe('motor.speed.set', (msg) => {
      this.log(`Setting speed: ${msg.payload.value}`);
    });
  }

  onStop() {
    this.log('Motor module stopped');
  }
}

runtime.registerModule(new MotorModule('motor'));
await runtime.start();
```

### Message Bus

```typescript
const bus = runtime.getMessageBus();

// Subscribe
bus.subscribe('sensor.data', (msg) => {
  console.log('Temperature:', msg.payload.value);
});

// Publish
bus.publish('sensor.data', { value: 25.5, unit: 'C' });
```

### Scheduler

```typescript
const scheduler = runtime.getScheduler();

// Periodic task
const taskId = scheduler.every(1000, () => {
  console.log('Every second');
});

// One-time task
scheduler.once(5000, () => {
  console.log('After 5 seconds');
});

// Clear task
scheduler.clear(taskId);
```

### Logger

```typescript
const logger = runtime.getLogger();

logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message');
```

## Built-in Modules

| Module | Description |
|--------|-------------|
| `HeartbeatModule` | Periodic heartbeat signals |
| `SystemHealthModule` | CPU/memory monitoring |
| `LEDModule` | Software-based LED control |
| `RaspberryPiLEDModule` | Hardware GPIO LED control |
| `CANGatewayModule` | CAN bus gateway |
| `J1939EngineModule` | J1939 engine ECU simulation |

## API Reference

### Runtime

```typescript
class Runtime {
  constructor(config: Partial<RuntimeConfig>)
  registerModule(module: Module): void
  start(): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean
  getMessageBus(): MessageBus
  getScheduler(): Scheduler
  getLogger(): Logger
  getConfig(): any
}
```

### BaseModule

```typescript
abstract class BaseModule implements Module {
  constructor(name: string, version?: string)
  abstract onInit(): Promise<void> | void
  abstract onStart(): Promise<void> | void
  abstract onStop(): Promise<void> | void
  protected log(message: string): void
  protected logger: Logger
  protected bus: MessageBus
  protected scheduler: Scheduler
}
```

### MessageBus

```typescript
class MessageBus {
  publish(topic: string, payload: any): void
  subscribe(topic: string, handler: MessageHandler): void
  unsubscribe(topic: string, handler: MessageHandler): void
}
```

### Scheduler

```typescript
class Scheduler {
  every(intervalMs: number, task: () => void): string
  once(delayMs: number, task: () => void): string
  clear(taskId: string): void
  stopAll(): void
}
```

## License

MIT © Mukesh Mani Tripathi
