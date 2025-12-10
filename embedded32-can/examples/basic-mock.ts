import { CANInterface, MockCANDriver } from "../src/index.js";

/**
 * Basic example: Using MockCANDriver for testing
 */
async function basicExample() {
  console.log("=== Mock CAN Driver Example ===\n");

  const can = new CANInterface(new MockCANDriver());

  // Register message handler
  can.onMessage((frame) => {
    console.log("📨 Received:", {
      id: `0x${frame.id.toString(16).toUpperCase()}`,
      data: frame.data,
      extended: frame.extended,
      timestamp: frame.timestamp
    });
  });

  // Send a test frame
  console.log("📤 Sending test frame...");
  can.send({
    id: 0x123,
    data: [0x01, 0x02, 0x03, 0x04],
    extended: false
  });

  // Send another frame
  await new Promise(resolve => setTimeout(resolve, 100));
  
  can.send({
    id: 0x456,
    data: [0x10, 0x20, 0x30],
    extended: false
  });

  // Cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  can.close();
  console.log("\n✅ Example complete");
}

basicExample().catch(console.error);
