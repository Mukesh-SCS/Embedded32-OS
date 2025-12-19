/**
 * Embedded32 SDK for JavaScript/TypeScript
 * 
 * PUBLIC API - This is the only supported entry point.
 * 
 * @module @embedded32/sdk-js
 * @version 1.0.0
 */

// =============================================================================
// PUBLIC API (Stable as of v1.0.0)
// =============================================================================

// Main client - the primary interface
export { J1939Client } from './client.js';

// Public types
export type {
  J1939ClientConfig,
  J1939Message,
  PGNData,
  PGNHandler,
} from './types.js';

// Constants
export { PGN, SA } from './types.js';

// =============================================================================
// DO NOT EXPORT BELOW THIS LINE
// =============================================================================
// The following are internal implementation details:
// - CANBus (low-level CAN access)
// - VirtualTransport (transport layer)
// - codec functions (parseJ1939Id, buildJ1939Id, etc.)
// - J1939MessageBuilder, J1939MessageParser
//
// These remain available via './internal' for advanced users who accept
// that they may break between versions.
// =============================================================================
