/**
 * Embedded32 Core Types
 */

export interface RuntimeConfig {
  logLevel: "debug" | "info" | "warn" | "error";
  configPath?: string;
  enableMetrics?: boolean;
}

export interface ModuleContext {
  logger: any;
  bus: any;
  scheduler: any;
  config: any;
}

export interface Module {
  name: string;
  version: string;

  bind(context: ModuleContext): void;

  onInit(): Promise<void> | void;
  onStart(): Promise<void> | void;
  onStop(): Promise<void> | void;
}

export interface Message {
  topic: string;
  payload: any;
  timestamp: number;
  source?: string;
}

export type MessageHandler = (message: Message) => void | Promise<void>;

export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
  context?: any;
}

export interface Task {
  id: string;
  name: string;
  priority: number;
  execute(): Promise<void>;
}
