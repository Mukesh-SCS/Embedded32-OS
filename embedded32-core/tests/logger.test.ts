/**
 * Logger Tests
 */

import { Logger } from '../src/logger/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('info');
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      // Error logging is tracked in history
      const history = logger.getHistory();
      expect(history.some(entry => entry.level === 'error')).toBe(true);
    });

    it('should log debug messages when level is debug', () => {
      const debugLogger = new Logger('debug');
      debugLogger.debug('Test debug message');
      const history = debugLogger.getHistory();
      expect(history.some(entry => entry.level === 'debug')).toBe(true);
    });

    it('should not log debug messages when level is info', () => {
      logger.debug('Test debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('history tracking', () => {
    it('should store log entries in history', () => {
      logger.info('Test message 1');
      logger.warn('Test warning 2');
      
      const history = logger.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should include timestamp in log entries', () => {
      const beforeTime = Date.now();
      logger.info('Test message');
      const afterTime = Date.now();
      
      const history = logger.getHistory();
      expect(history[history.length - 1].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[history.length - 1].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include log level in entries', () => {
      logger.error('Error message');
      
      const history = logger.getHistory();
      expect(history[history.length - 1].level).toBe('error');
    });

    it('should include message content in entries', () => {
      logger.info('Important message');
      
      const history = logger.getHistory();
      expect(history[history.length - 1].message).toBe('Important message');
    });

    it('should clear history on clearHistory()', () => {
      logger.info('Test message');
      logger.clearHistory();
      
      const history = logger.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('log level changes', () => {
    it('should change log level with setLevel()', () => {
      const debugLogger = new Logger('info');
      debugLogger.setLevel('debug');
      
      debugLogger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('context support', () => {
    it('should accept context data in log entries', () => {
      logger.info('Test message', { userId: 123, action: 'login' });
      
      const history = logger.getHistory();
      expect(history[history.length - 1].context).toEqual({ userId: 123, action: 'login' });
    });
  });
});
