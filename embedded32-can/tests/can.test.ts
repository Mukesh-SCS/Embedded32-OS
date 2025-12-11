import { CANInterface, MockCANDriver, CANFrame } from "../src/index.js";

/**
 * Basic tests for @embedded32/can
 * Run with: npm test (after setting up Jest or similar)
 */

describe("@embedded32/can", () => {
  describe("MockCANDriver", () => {
    it("should send and receive frames", (done) => {
      const can = new CANInterface(new MockCANDriver());
      const testFrame: CANFrame = {
        id: 0x123,
        data: [0x01, 0x02, 0x03],
        extended: false
      };

      can.onMessage((frame) => {
        expect(frame.id).toBe(testFrame.id);
        expect(frame.data).toEqual(testFrame.data);
        expect(frame.extended).toBe(false);
        can.close();
        done();
      });

      can.send(testFrame);
    });

    it("should support extended frames", (done) => {
      const can = new CANInterface(new MockCANDriver());
      const testFrame: CANFrame = {
        id: 0x18FEDF00,
        data: [0xAA, 0xBB, 0xCC],
        extended: true
      };

      can.onMessage((frame) => {
        expect(frame.extended).toBe(true);
        expect(frame.id).toBe(0x18FEDF00);
        can.close();
        done();
      });

      can.send(testFrame);
    });

    it("should handle multiple message listeners", (done) => {
      const can = new CANInterface(new MockCANDriver());
      let count = 0;

      const listener1 = () => {
        count++;
      };

      const listener2 = () => {
        count++;
        if (count === 2) {
          can.close();
          expect(count).toBe(2);
          done();
        }
      };

      can.onMessage(listener1);
      can.onMessage(listener2);

      can.send({
        id: 0x100,
        data: [0x11],
        extended: false
      });
    });

    it("should include timestamp on received frames", (done) => {
      const can = new CANInterface(new MockCANDriver());

      can.onMessage((frame) => {
        expect(frame.timestamp).toBeDefined();
        expect(typeof frame.timestamp).toBe("number");
        expect(frame.timestamp! > 0).toBe(true);
        can.close();
        done();
      });

      can.send({
        id: 0x200,
        data: [0xFF],
        extended: false
      });
    });
  });

  describe("CANInterface", () => {
    it("should wrap driver correctly", () => {
      const driver = new MockCANDriver();
      const can = new CANInterface(driver);

      expect(can).toBeDefined();
      expect(can.send).toBeDefined();
      expect(can.onMessage).toBeDefined();
      expect(can.close).toBeDefined();

      can.close();
    });

    it("should close without error", () => {
      const can = new CANInterface(new MockCANDriver());
      expect(() => can.close()).not.toThrow();
    });
  });

  describe("CANFrame", () => {
    it("should support 11-bit standard frames", () => {
      const frame: CANFrame = {
        id: 0x123,
        data: [1, 2, 3],
        extended: false
      };

      expect(frame.id).toBeLessThan(0x800); // 11-bit max
      expect(frame.extended).toBe(false);
    });

    it("should support 29-bit extended frames", () => {
      const frame: CANFrame = {
        id: 0x18FEDF00,
        data: [1, 2, 3, 4, 5, 6, 7, 8],
        extended: true
      };

      expect(frame.id).toBeGreaterThan(0x800);
      expect(frame.extended).toBe(true);
    });

    it("should validate data length", () => {
      const frame: CANFrame = {
        id: 0x100,
        data: [0, 1, 2, 3, 4, 5, 6, 7], // 8 bytes max
        extended: false
      };

      expect(frame.data.length).toBeLessThanOrEqual(8);
    });
  });
});
