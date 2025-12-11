/**
 * Example: Basic J1939 Message Creation and Parsing
 */

import { J1939MessageBuilder, J1939MessageParser } from '../src/j1939-api';

// Create an engine speed message
const engineSpeedMsg = J1939MessageBuilder.createEngineSpeed(1500, 0x01);
console.log('Engine Speed Message:', engineSpeedMsg);

// Create a transmission gear message
const gearMsg = J1939MessageBuilder.createTransmissionGear(3, 0x01);
console.log('Transmission Gear Message:', gearMsg);

// Create engine temperature message
const tempMsg = J1939MessageBuilder.createEngineTemperature(85, 0x01);
console.log('Engine Temperature Message:', tempMsg);

// Create DM1 fault message
const faultMsg = J1939MessageBuilder.createDM1Fault(
  190, // SPN
  0, // FMI
  1, // Occurrence
  0x01
);
console.log('DM1 Fault Message:', faultMsg);

// In real usage, you would parse received messages
// const decoded = decodeJ1939(canFrame);
// const rpm = J1939MessageParser.parseEngineSpeed(decoded);
// const temp = J1939MessageParser.parseEngineTemperature(decoded);
