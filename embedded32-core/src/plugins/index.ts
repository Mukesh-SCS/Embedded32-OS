/**
 * Embedded32 - Plugin System
 * 
 * Plugin contract and loader.
 */

export type {
  ECUPlugin,
  PluginContext,
  PluginConfig,
  PluginFactory,
  PGNData
} from './plugin-interface';

export {
  PluginPGN,
  PluginSA
} from './plugin-interface';

export { PluginLoader } from './plugin-loader';
