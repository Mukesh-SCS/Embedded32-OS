/**
 * Example: CAN Bus Communication
 */

import { CANBus } from '../src/can-api';

// Initialize CAN bus with your driver
// const canDriver = new SocketCANDriver('vcan0');
// const can = new CANBus(canDriver);

// Example: Send a J1939 message
// const msg = {
//   pgn: 0xF004,  // EEC1 - Engine Speed
//   sa: 0x01,     // Source Address
//   priority: 3,
//   data: [0x10, 0x20, 0, 0, 0, 0, 0, 0]
// };
//
// await can.sendJ1939(msg);

// Example: Listen for messages
// can.onMessage((frame) => {
//   console.log('Received CAN frame:', frame.id.toString(16), frame.data);
// });

console.log('CAN Bus API Example - See comments for usage');
