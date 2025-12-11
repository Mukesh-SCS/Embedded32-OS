// Type definitions for the supervisor system

export interface ModuleConfig {
  name: string;
  enabled: boolean;
  priority: number; // 0 = lowest, 100 = highest (startup order)
  restartPolicy: 'never' | 'always' | 'on-failure';
  maxRestarts: number;
  config?: Record<string, unknown>;
}

export interface RuntimeConfig {
  can?: {
    interface: string;
    baudrate?: number;
    enabled?: boolean;
  };
  j1939?: {
    enabled?: boolean;
    databasePath?: string;
  };
  ethernet?: {
    udp?: {
      enabled: boolean;
      port: number;
    };
    tcp?: {
      enabled: boolean;
      port: number;
    };
    mqtt?: {
      enabled: boolean;
      broker: string;
      clientId?: string;
      username?: string;
      password?: string;
    };
  };
  bridge?: {
    canEthernet?: {
      enabled: boolean;
      whitelist?: number[];
      blacklist?: number[];
      rateLimit?: {
        default: number;
        [pgn: number]: number;
      };
    };
    canMqtt?: {
      enabled: boolean;
      topicPrefix?: string;
      payloadFormat?: 'nanoproto' | 'json';
    };
  };
  dashboard?: {
    enabled: boolean;
    port: number;
    host?: string;
  };
  simulator?: {
    engine?: boolean;
    transmission?: boolean;
    brakes?: boolean;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
    console?: boolean;
  };
}

export enum ModuleState {
  CREATED = 'created',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  RESTARTING = 'restarting'
}

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  state: ModuleState;
  uptime: number; // ms
  restartCount: number;
  lastError?: string;
  lastErrorTime?: number;
  config: ModuleConfig;
}

export interface RuntimeEvent {
  type: 'module-started' | 'module-stopped' | 'module-failed' | 'config-loaded' | 'supervisor-started' | 'supervisor-stopped' | 'health-check';
  timestamp: number;
  moduleId?: string;
  data?: Record<string, unknown>;
}

export interface HealthStatus {
  healthy: boolean;
  modules: {
    [moduleId: string]: {
      state: ModuleState;
      uptime: number;
      restarts: number;
    };
  };
  timestamp: number;
  systemUptime: number;
}

export interface Module {
  id: string;
  name: string;
  version: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ModuleInfo;
}
