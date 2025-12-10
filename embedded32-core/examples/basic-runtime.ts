/**
 * Basic Runtime Example
 * 
 * Demonstrates how to create and start the Embedded32 runtime.
 */

import { Runtime, Module } from '../src';

// Create a simple example module
class ExampleModule implements Module {
  name = 'example-module';
  version = '0.1.0';

  async initialize(): Promise<void> {
    console.log('Example module initialized');
  }

  async shutdown(): Promise<void> {
    console.log('Example module shutdown');
  }
}

// Main function
async function main() {
  // Create runtime instance
  const runtime = new Runtime({
    logLevel: 'info',
  });

  // Register the example module
  runtime.registerModule(new ExampleModule());

  // Start the runtime
  await runtime.start();

  // Run for 5 seconds then stop
  setTimeout(async () => {
    await runtime.stop();
  }, 5000);
}

main().catch(console.error);
