/**
 * Embedded32 SDK - Main Index
 * Unified API for Embedded32 platform
 */

export { CANBus, type CANFrame } from './can-api';
export { J1939MessageBuilder, J1939MessageParser } from './j1939-api';

/**
 * Create unified SDK instance
 */
export function createEmbedded32SDK(canDriver: any) {
  return {
    can: new (require('./can-api').CANBus)(canDriver),
    j1939: {
      builder: require('./j1939-api').J1939MessageBuilder,
      parser: require('./j1939-api').J1939MessageParser,
    },
  };
}

export default { createEmbedded32SDK };
