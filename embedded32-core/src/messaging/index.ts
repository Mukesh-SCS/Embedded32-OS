/**
 * Message Bus
 * 
 * Publish/subscribe message bus for inter-module communication.
 */

import { Message, MessageHandler } from '../types';

export class MessageBus {
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: MessageHandler): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(topic);
      }
    }
  }

  /**
   * Publish a message to a topic
   */
  async publish(topic: string, payload: any, source?: string): Promise<void> {
    const message: Message = {
      topic,
      payload,
      timestamp: Date.now(),
      source,
    };

    const handlers = this.handlers.get(topic);
    if (handlers) {
      const promises = Array.from(handlers).map(handler => 
        Promise.resolve(handler(message))
      );
      await Promise.all(promises);
    }
  }

  /**
   * Get number of subscribers for a topic
   */
  getSubscriberCount(topic: string): number {
    return this.handlers.get(topic)?.size || 0;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.handlers.clear();
  }
}
