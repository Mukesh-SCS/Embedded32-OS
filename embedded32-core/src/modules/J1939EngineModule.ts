import { BaseModule } from "./Module.js";

interface EngineState {
  rpm: number;
  torquePercent: number;
  running: boolean;
}

export class J1939EngineModule extends BaseModule {
  private tickInterval: any = null;
  private state: EngineState = {
    rpm: 0,
    torquePercent: 0,
    running: false,
  };

  constructor(name = "j1939-engine") {
    super(name, "1.0.0");
  }

  onInit() {
    this.log("J1939 Engine ECU module initialized");
  }

  onStart() {
    this.log("J1939 Engine ECU module started");

    // Listen for simple "start/stop" commands
    this.bus.subscribe("engine.command", (msg: any) => {
      const cmd = msg.payload?.cmd;
      if (cmd === "start") this.startEngine();
      if (cmd === "stop") this.stopEngine();
    });

    // Simulate engine behaviour at 100ms steps
    this.tickInterval = this.scheduler.every(100, () => this.tick());
  }

  private startEngine() {
    this.log("Engine start command received");
    this.state.running = true;
  }

  private stopEngine() {
    this.log("Engine stop command received");
    this.state.running = false;
  }

  private tick() {
    // Simple ramp logic
    if (this.state.running) {
      this.state.rpm = Math.min(this.state.rpm + 50, 2200);
      this.state.torquePercent = Math.min(this.state.torquePercent + 2, 80);
    } else {
      this.state.rpm = Math.max(this.state.rpm - 80, 0);
      this.state.torquePercent = Math.max(this.state.torquePercent - 3, 0);
    }

    // Simulated J1939 PGN F004 (Engine Speed)
    const pgnEngineSpeed = 0xf004;

    // "Raw" bytes encoding (very simplified)
    const engineSpeedRaw = Math.round(this.state.rpm * 8); // 0.125 rpm/bit
    const low = engineSpeedRaw & 0xff;
    const high = (engineSpeedRaw >> 8) & 0xff;
    const data = [low, high]; // only 2 bytes used for this example

    this.bus.publish("j1939.tx", {
      pgn: pgnEngineSpeed,
      description: "Engine Speed",
      rpm: this.state.rpm,
      torquePercent: this.state.torquePercent,
      data,
      timestamp: Date.now(),
    });
  }

  onStop() {
    this.log("J1939 Engine ECU module stopped");
    if (this.tickInterval) {
      this.scheduler.clear(this.tickInterval);
      this.tickInterval = null;
    }
  }
}
