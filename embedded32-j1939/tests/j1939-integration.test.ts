/**
 * Integration Test: Full J1939 Stack
 *
 * Basic integration testing with minimal API usage
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  parseJ1939Id,
  buildJ1939Id,
  J1939TransportProtocol,
  DiagnosticsManager,
} from "../src/index.js";

describe("J1939 Full Stack Integration", () => {
  let tp: J1939TransportProtocol;
  let dm: DiagnosticsManager;

  beforeEach(() => {
    tp = new J1939TransportProtocol();
    dm = new DiagnosticsManager();
  });

  it("should build and parse J1939 IDs", () => {
    const j1939Id = buildJ1939Id({
      priority: 6,
      pgn: 0xf004,
      sa: 0x00,
    });

    const parsed = parseJ1939Id(j1939Id);
    expect(parsed.priority).toBe(6);
    expect(parsed.pgn).toBe(0xf004);
    expect(parsed.sa).toBe(0x00);
  });

  it("should handle BAM sessions", () => {
    const session = tp.startBAM(0xfef5, 50, 8);
    expect(session.pgn).toBe(0xfef5);
    expect(session.complete).toBe(false);
  });

  it("should process DM1 messages", () => {
    const dm1Data = [0x04, 0x1a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const result = dm.processDM1(0x00, dm1Data);
    
    expect(result).toBeDefined();
    expect(result?.lamps.mil).toBe(true);
  });

  it("should handle multiple diagnostic sessions", () => {
    dm.processDM1(0x00, [0x04, 0x1a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    dm.processDM1(0x01, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    const summary = dm.getSummary();
    expect(summary.deviceCount).toBe(2);
  });
});

