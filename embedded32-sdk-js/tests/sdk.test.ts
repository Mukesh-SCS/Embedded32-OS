/**
 * SDK Tests - Public API Contract
 * 
 * These tests verify the stable public API behaves correctly,
 * including proper error handling for invalid usage.
 */

import { J1939Client, PGN, SA } from '../src/index';

describe('J1939Client', () => {
  describe('Basic functionality', () => {
    it('should create client with valid config', () => {
      const client = new J1939Client({
        interface: 'vcan0',
        sourceAddress: SA.DIAG_TOOL_1
      });
      expect(client).toBeDefined();
      expect(client.isConnected()).toBe(false);
    });

    it('should throw on invalid source address', () => {
      expect(() => {
        new J1939Client({
          interface: 'vcan0',
          sourceAddress: 0xFF // Invalid: 0xFF is broadcast
        });
      }).toThrow('Invalid source address');
    });
  });

  describe('Negative tests (error handling)', () => {
    let client: J1939Client;

    beforeEach(() => {
      client = new J1939Client({
        interface: 'vcan0',
        sourceAddress: SA.DIAG_TOOL_1,
        transport: 'virtual'
      });
    });

    afterEach(async () => {
      if (client.isConnected()) {
        await client.disconnect();
      }
    });

    it('should throw when sending before connect()', async () => {
      // CRITICAL: SDK must not allow operations before connection
      await expect(client.sendPGN(PGN.ENGINE_CONTROL_CMD, { throttle: 50 }))
        .rejects
        .toThrow('Not connected');
    });

    it('should throw when requesting PGN before connect()', async () => {
      await expect(client.requestPGN(PGN.EEC1))
        .rejects
        .toThrow('Not connected');
    });

    it('should throw when connecting twice', async () => {
      await client.connect();
      await expect(client.connect())
        .rejects
        .toThrow('Already connected');
    });

    it('should handle disconnect gracefully when not connected', async () => {
      // Should not throw
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Connection lifecycle', () => {
    it('should connect and disconnect cleanly', async () => {
      const client = new J1939Client({
        interface: 'vcan0',
        sourceAddress: SA.DIAG_TOOL_2,
        transport: 'virtual'
      });

      expect(client.isConnected()).toBe(false);
      
      await client.connect();
      expect(client.isConnected()).toBe(true);
      
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });
});

describe('Public API exports', () => {
  it('should export only public API from main entry', () => {
    // These should be available
    expect(J1939Client).toBeDefined();
    expect(PGN).toBeDefined();
    expect(SA).toBeDefined();
    expect(PGN.EEC1).toBe(0xF004);
    expect(SA.DIAG_TOOL_1).toBe(0xF9);
  });
});
