/**
 * Type definitions for Embedded32 Core
 */

export interface RuntimeConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  configPath?: string;
  enableMetrics?: boolean;
}

export interface Module {
  name: string;
  version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface Task {
  id: string;
  name: string;
  priority: number;
  execute(): Promise<void>;
}

export interface Message {
  topic: string;
  payload: any;
  timestamp: number;
  source?: string;
}

export type MessageHandler = (message: Message) => void | Promise<void>;

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: any;
}
