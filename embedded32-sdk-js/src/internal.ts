/**
 * Embedded32 SDK - Internal/Advanced APIs
 * 
 * ⚠️  WARNING: These APIs are NOT part of the public SDK contract.
 * They may change or be removed without notice between versions.
 * 
 * If you import from this module, you are on your own.
 * 
 * @module @embedded32/sdk-js/internal
 * @internal
 */

// Transport layer (internal)
export { VirtualTransport } from './transport/index.js';
export type { ITransport, TransportConfig, CANFrame } from './types.js';

// J1939 codec (internal)
export {
  parseJ1939Id,
  buildJ1939Id,
  getPGNName,
  decodeSPNs,
  encodePGNData,
  decodeFrame,
  encodeFrame
} from './j1939/index.js';

// Legacy CAN API (internal, deprecated)
export { CANBus, type CANFrame as LegacyCANFrame } from './can-api.js';
export { J1939MessageBuilder, J1939MessageParser } from './j1939-api.js';

// Internal type exports
export type { IJ1939Client } from './types.js';
