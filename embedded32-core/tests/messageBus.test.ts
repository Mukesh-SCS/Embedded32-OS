/**
 * MessageBus Tests
 */

import { MessageBus } from '../src/messaging/MessageBus';
import { Message } from '../src/types';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus();
  });

  describe('publish/subscribe', () => {
    it('should subscribe to a topic', () => {
      const handler = jest.fn();
      bus.subscribe('test.topic', handler);
      
      expect(bus.getSubscriberCount('test.topic')).toBe(1);
    });

    it('should publish a message to subscribers', async () => {
      const handler = jest.fn();
      bus.subscribe('test.topic', handler);
      
      await bus.publish('test.topic', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
    });

    it('should include message metadata when publishing', async () => {
      const handler = jest.fn();
      bus.subscribe('test.topic', handler);
      
      await bus.publish('test.topic', { data: 'test' }, 'source');
      
      const message = handler.mock.calls[0][0];
      expect(message.topic).toBe('test.topic');
      expect(message.payload).toEqual({ data: 'test' });
      expect(message.source).toBe('source');
      expect(message.timestamp).toBeDefined();
    });

    it('should handle multiple subscribers for same topic', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      bus.subscribe('test.topic', handler1);
      bus.subscribe('test.topic', handler2);
      
      await bus.publish('test.topic', { data: 'test' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not call handlers for different topics', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      bus.subscribe('topic1', handler1);
      bus.subscribe('topic2', handler2);
      
      await bus.publish('topic1', { data: 'test' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe a handler from a topic', async () => {
      const handler = jest.fn();
      bus.subscribe('test.topic', handler);
      bus.unsubscribe('test.topic', handler);
      
      await bus.publish('test.topic', { data: 'test' });
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should maintain other subscribers after unsubscribe', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      bus.subscribe('test.topic', handler1);
      bus.subscribe('test.topic', handler2);
      bus.unsubscribe('test.topic', handler1);
      
      await bus.publish('test.topic', { data: 'test' });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove topic if no subscribers remain', async () => {
      const handler = jest.fn();
      bus.subscribe('test.topic', handler);
      bus.unsubscribe('test.topic', handler);
      
      expect(bus.getSubscriberCount('test.topic')).toBe(0);
    });
  });

  describe('async handlers', () => {
    it('should support async message handlers', async () => {
      const asyncHandler = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      bus.subscribe('test.topic', asyncHandler);
      await bus.publish('test.topic', { data: 'test' });
      
      expect(asyncHandler).toHaveBeenCalled();
    });

    it('should wait for async handlers to complete', async () => {
      const order: number[] = [];
      
      const asyncHandler = jest.fn(async () => {
        order.push(1);
        await new Promise(resolve => setTimeout(resolve, 10));
        order.push(2);
      });
      
      bus.subscribe('test.topic', asyncHandler);
      await bus.publish('test.topic', { data: 'test' });
      
      expect(order).toEqual([1, 2]);
    });
  });

  describe('clear', () => {
    it('should clear all subscriptions', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      bus.subscribe('topic1', handler1);
      bus.subscribe('topic2', handler2);
      bus.clear();
      
      await bus.publish('topic1', { data: 'test' });
      await bus.publish('topic2', { data: 'test' });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('message structure', () => {
    it('should create properly formatted Message objects', async () => {
      const capturedMessage: Message[] = [];
      
      bus.subscribe('test.topic', (msg) => {
        capturedMessage.push(msg);
      });
      
      await bus.publish('test.topic', { count: 42 }, 'test-source');
      
      expect(capturedMessage[0]).toHaveProperty('topic');
      expect(capturedMessage[0]).toHaveProperty('payload');
      expect(capturedMessage[0]).toHaveProperty('timestamp');
      expect(capturedMessage[0]).toHaveProperty('source');
    });
  });
});
