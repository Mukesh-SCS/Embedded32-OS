# embedded32-core

> Lightweight OS runtime for Embedded32 platform

## Overview

The core runtime provides the foundation for all Embedded32 modules with a comprehensive set of features for embedded and IoT applications.

### Core Features

- **Runtime Orchestrator** - Module lifecycle management and orchestration
- **Task Scheduler** - Cooperative task scheduling with priority support
- **Message Bus** - Inter-module communication with pub/sub pattern
- **Module Registry** - Dynamic module loading and management
- **Logger** - Centralized logging with multiple log levels and history
- **Config Loader** - JSON-based configuration file management
- **Base Module** - Abstract base class for creating custom modules

### Built-in Modules

- **HeartbeatModule** - Periodic heartbeat signals for system monitoring
- **SystemHealthModule** - CPU/memory monitoring and heartbeat supervision
- **LEDModule** - Software-based LED control via message bus
- **RaspberryPiLEDModule** - Hardware GPIO LED control for Raspberry Pi
- **CANGatewayModule** - CAN bus gateway (simulation mode, ready for embedded32-can)
- **J1939EngineModule** - J1939 engine ECU simulation

## Installation

```bash
npm install @embedded32/core
```

### Optional Dependencies

For Raspberry Pi GPIO support:
```bash
npm install onoff
npm install -D @types/onoff
```

## Architecture

```
embedded32-core/
├── src/
│   ├── runtime/        # Runtime orchestrator
│   ├── modules/        # Module base class and built-in modules
│   │   ├── Module.ts              # BaseModule class
│   │   ├── HeartbeatModule.ts     # System heartbeat
│   │   ├── SystemHealthModule.ts  # Health monitoring
│   │   ├── LEDModule.ts           # Software LED
│   │   ├── RaspberryPiLEDModule.ts # Hardware GPIO LED
│   │   ├── CANGatewayModule.ts    # CAN gateway
│   │   └── J1939EngineModule.ts   # J1939 engine ECU
│   ├── scheduler/      # Task scheduler
│   ├── messaging/      # Message bus (pub/sub)
│   ├── registry/       # Module registry
│   ├── logger/         # Logging system
│   ├── config/         # Config loader
│   └── types.ts        # TypeScript interfaces
├── tests/              # Comprehensive test suite (84 tests)
└── examples/           # Example applications
    ├── basic-runtime.ts
    ├── modules-demo.ts
    └── advanced-modules-demo.ts
```

## Examples

The `examples/` directory contains several demonstration applications:

### basic-runtime.ts
Simple example showing custom module creation and basic runtime usage.

```bash
npx tsx examples/basic-runtime.ts
```

### modules-demo.ts
Demonstrates HeartbeatModule, LEDModule, and CANGatewayModule working together.

```bash
npx tsx examples/modules-demo.ts
```

### advanced-modules-demo.ts
Comprehensive example showcasing all built-in modules with system health monitoring, J1939 engine simulation, and multi-platform LED control.

```bash
npx tsx examples/advanced-modules-demo.ts
```

## Quick Start

### 1. Creating a Runtime

```typescript
import { Runtime } from '@embedded32/core';

const runtime = new Runtime({
  logLevel: 'info',
  configPath: './config.json'
});

await runtime.start();
```

### 2. Creating a Custom Module

```typescript
import { BaseModule } from '@embedded32/core';

class MotorModule extends BaseModule {
  onInit() {
    this.log('Motor module initialized');
  }

  onStart() {
    this.log('Motor module started');
    
    // Listen to messages
    this.bus.subscribe('motor.speed.set', (msg: any) => {
      this.log(`Setting speed: ${msg.payload.value}`);
    });
  }

  onStop() {
    this.log('Motor module stopped');
  }
}
```

### 3. Registering Modules

```typescript
runtime.registerModule(new MotorModule('motor'));
await runtime.start();

// Publish messages
runtime.getMessageBus().publish('motor.speed.set', { value: 100 });
```

## Core Concepts

### Runtime

The runtime orchestrator manages the entire module lifecycle:

```typescript
const runtime = new Runtime({ logLevel: 'info' });

// Access core services
const bus = runtime.getMessageBus();
const scheduler = runtime.getScheduler();
const logger = runtime.getLogger();
const config = runtime.getConfig();
```

### Modules

Extend `BaseModule` to create custom modules with automatic access to core services:

```typescript
import { BaseModule } from '@embedded32/core';

class MyModule extends BaseModule {
  constructor(name = 'my-module') {
    super(name, '1.0.0');
  }

  onInit() {
    // Setup phase
    this.log('Initializing...');
  }

  onStart() {
    // Execution phase
    this.bus.subscribe('my.event', (msg: any) => {
      this.log('Received:', msg.payload);
    });
    
    this.scheduler.every(1000, () => {
      this.log('Periodic task');
    });
  }

  onStop() {
    // Cleanup phase
    this.log('Stopping...');
  }
}
```

### Message Bus

Publish/subscribe pattern for inter-module communication:

```typescript
// Subscribe to events
bus.subscribe('sensor.data', (msg: any) => {
  console.log('Temperature:', msg.payload.value);
});

// Publish events
bus.publish('sensor.data', { value: 25.5, unit: 'C' });

// Unsubscribe
const handler = (msg: any) => console.log(msg);
bus.subscribe('event', handler);
bus.unsubscribe('event', handler);
```

### Scheduler

Run periodic or one-time tasks:

```typescript
// Periodic task
const taskId = scheduler.every(1000, () => {
  console.log('Every second');
});

// Clear task
scheduler.clear(taskId);

// One-time delayed task
scheduler.once(5000, () => {
  console.log('After 5 seconds');
});
```

### Logger

Structured logging with multiple levels:

```typescript
logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message');

// Access log history
const history = logger.getHistory();

// Change log level
logger.setLevel('debug');
```

## Built-in Modules Examples

### HeartbeatModule

```typescript
import { Runtime, HeartbeatModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new HeartbeatModule('heartbeat', 1000)); // 1s interval
await runtime.start();
```

### SystemHealthModule

```typescript
import { Runtime, HeartbeatModule, SystemHealthModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new HeartbeatModule());
runtime.registerModule(new SystemHealthModule());

const bus = runtime.getMessageBus();
bus.subscribe('system.health', (msg: any) => {
  console.log('CPU Load:', msg.payload.loadAverage);
  console.log('Memory:', msg.payload.memoryRssMb, 'MB');
});

await runtime.start();
```

### LEDModule (Software)

```typescript
import { Runtime, LEDModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new LEDModule('led'));

await runtime.start();

const bus = runtime.getMessageBus();
bus.publish('led.on', {});
bus.publish('led.blink', { interval: 300 });
bus.publish('led.off', {});
```

### RaspberryPiLEDModule (Hardware GPIO)

**Note:** Requires `onoff` package and Raspberry Pi hardware

```typescript
import { Runtime, RaspberryPiLEDModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new RaspberryPiLEDModule('rpi-led', 17)); // GPIO 17

await runtime.start();

const bus = runtime.getMessageBus();
bus.publish('gpio.led.on', {});
bus.publish('gpio.led.blink', { interval: 300 });
bus.publish('gpio.led.off', {});
```

### J1939EngineModule

```typescript
import { Runtime, J1939EngineModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new J1939EngineModule());

const bus = runtime.getMessageBus();
bus.subscribe('j1939.tx', (msg: any) => {
  console.log('J1939 Engine:', msg.payload);
});

await runtime.start();

// Control engine
bus.publish('engine.command', { cmd: 'start' });
bus.publish('engine.command', { cmd: 'stop' });
```

### CANGatewayModule

```typescript
import { Runtime, CANGatewayModule } from '@embedded32/core';

const runtime = new Runtime({ logLevel: 'info' });
runtime.registerModule(new CANGatewayModule());

await runtime.start();

const bus = runtime.getMessageBus();

// Receive CAN messages
bus.subscribe('can.rx', (msg: any) => {
  console.log('CAN RX:', msg.payload);
});

// Send CAN messages
bus.publish('can.tx', { id: 0x200, data: [1, 2, 3] });
```

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
  
  protected log(message: string, level?: 'debug' | 'info' | 'warn' | 'error'): void
  protected logger: Logger
  protected bus: MessageBus
  protected scheduler: Scheduler
  protected config: any
}
```

### MessageBus

```typescript
class MessageBus {
  publish(topic: string, payload: any): void
  subscribe(topic: string, handler: MessageHandler): void
  unsubscribe(topic: string, handler: MessageHandler): void
  clear(): void
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

### Logger

```typescript
class Logger {
  constructor(level: 'debug' | 'info' | 'warn' | 'error')
  
  debug(message: string, context?: any): void
  info(message: string, context?: any): void
  warn(message: string, context?: any): void
  error(message: string, context?: any): void
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void
  getHistory(): LogEntry[]
}
```

## Testing

The core package includes a comprehensive test suite with 84 tests across 6 test suites:

- **Logger Tests** (11 tests): Log levels, history, context support
- **MessageBus Tests** (7 tests): Pub/sub functionality
- **Scheduler Tests** (11 tests): Task scheduling and execution
- **ModuleRegistry Tests** (8 tests): Module lifecycle management
- **ConfigLoader Tests** (23 tests): Configuration file handling
- **Runtime Tests** (24 tests): Runtime orchestration

Run tests:
```bash
npm test
```

Build the project:
```bash
npm run build
```

## Development Status

✅ **Core Runtime** - Complete and tested
✅ **Module System** - Complete with base class and lifecycle hooks
✅ **Message Bus** - Complete pub/sub implementation
✅ **Scheduler** - Complete with periodic and one-time tasks
✅ **Logger** - Complete with multiple levels and history
✅ **Config Loader** - Complete JSON-based configuration
✅ **Built-in Modules** - 6 production-ready modules
✅ **Test Suite** - 84 tests, 100% passing
✅ **Examples** - 3 comprehensive examples
✅ **Documentation** - Complete API reference

## Platform Support

- **Node.js** - Full support (v16+)
- **Raspberry Pi** - Full support with GPIO access
- **Embedded Linux** - Supported
- **Windows/macOS** - Supported (simulation mode for hardware modules)

## License

MIT © Mukesh Mani Tripathi