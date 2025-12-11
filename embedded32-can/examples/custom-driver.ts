import { CANInterface, MockCANDriver, ICANDriver, CANFrame } from "../src/index.js";

/**
 * Custom Driver Example: Implementing your own CAN driver
 */
class LoggingCANDriver implements ICANDriver {
  private mockDriver = new MockCANDriver();

  send(frame: CANFrame) {
    console.log(`[LOG] Sending CAN frame: ID=0x${frame.id.toString(16)}, Data=${frame.data}`);
    return this.mockDriver.send(frame);
  }

  onMessage(handler: (frame: CANFrame) => void) {
    this.mockDriver.onMessage((frame) => {
      console.log(`[LOG] Received CAN frame: ID=0x${frame.id.toString(16)}, Data=${frame.data}`);
      handler(frame);
    });
  }

  close() {
    this.mockDriver.close();
  }
}

/**
 * Example: Using a custom logging driver
 */
async function customDriverExample() {
  console.log("=== Custom Logging Driver Example ===\n");

  const can = new CANInterface(new LoggingCANDriver());

  can.onMessage((frame) => {
    console.log(`✅ Handler received: 0x${frame.id.toString(16)}`);
  });

  console.log("\nSending test frames...\n");
  
  can.send({
    id: 0x200,
    data: [0x01, 0x02],
    extended: false
  });

  await new Promise(resolve => setTimeout(resolve, 100));

  can.send({
    id: 0x201,
    data: [0x03, 0x04],
    extended: false
  });

  await new Promise(resolve => setTimeout(resolve, 100));
  can.close();
  
  console.log("\n✅ Example complete");
}

customDriverExample().catch(console.error);
