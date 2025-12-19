/**
 * Embedded32 SDK for JavaScript/TypeScript
 * 
 * A J1939 client library for interacting with Embedded32.
 * 
 * PUBLIC API - Only exports below are part of the stable SDK contract.
 * For internal/advanced APIs, import from '@embedded32/sdk-js/internal'.
 * 
 * @module @embedded32/sdk-js
 * @version 1.0.0
 */

// =============================================================================
// PUBLIC API (Stable)
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

