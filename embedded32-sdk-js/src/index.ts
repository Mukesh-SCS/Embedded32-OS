/**
 * Embedded32 SDK for JavaScript/TypeScript
 * 
 * Phase 3 SDK - A J1939 client library for interacting with Embedded32.
 * 
 * @module @embedded32/sdk-js
 * @version 1.0.0
 */

// Main client
export { J1939Client } from './client.js';

// Types
export type {
  J1939ClientConfig,
  J1939Message,
  PGNData,
  PGNHandler,
  IJ1939Client,
  ITransport,
  CANFrame,
  TransportConfig
} from './types.js';

// Constants
export { PGN, SA } from './types.js';

// Transport layer (for advanced users)
export { VirtualTransport } from './transport/index.js';

// J1939 codec (for advanced users)
export {
  parseJ1939Id,
  buildJ1939Id,
  getPGNName,
  decodeSPNs,
  encodePGNData,
  decodeFrame,
  encodeFrame
} from './j1939/index.js';

// Legacy exports for backward compatibility
export { CANBus, type CANFrame as LegacyCANFrame } from './can-api.js';
export { J1939MessageBuilder, J1939MessageParser } from './j1939-api.js';

