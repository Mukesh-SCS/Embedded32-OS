import * as os from "os";
import { BaseModule } from "./Module.js";

interface HeartbeatInfo {
  lastSeen: number;
}

export class SystemHealthModule extends BaseModule {
  private healthInterval: any = null;
  private heartbeatCheckInterval: any = null;
  private heartbeats = new Map<string, HeartbeatInfo>();

  constructor(
    name = "system-health",
    private heartbeatTimeoutMs = 5000,
    private healthSampleMs = 1000
  ) {
    super(name, "1.0.0");
  }

  onInit() {
    this.log("System Health Monitor initialized");
  }

  onStart() {
    this.log("System Health Monitor started");

    // Listen to heartbeats from other modules
    this.bus.subscribe("system.heartbeat", (msg: any) => {
      const moduleName = msg.payload?.module || "unknown";
      this.heartbeats.set(moduleName, { lastSeen: Date.now() });
    });

    // Periodic health sampling
    this.healthInterval = this.scheduler.every(this.healthSampleMs, () =>
      this.sampleHealth()
    );

    // Periodic heartbeat supervision
    this.heartbeatCheckInterval = this.scheduler.every(1000, () =>
      this.checkHeartbeats()
    );
  }

  private sampleHealth() {
    const load = os.loadavg()[0]; // 1-minute load average
    const memUsage = process.memoryUsage();
    const usedMb = memUsage.rss / (1024 * 1024);

    const payload = {
      loadAverage: load,
      memoryRssMb: Number(usedMb.toFixed(1)),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: Date.now(),
    };

    this.bus.publish("system.health", payload);

    // Simple thresholds – adjust as needed
    if (load > 2.0) {
      this.log(`High CPU load detected: ${load.toFixed(2)}`);
    }
    if (usedMb > 500) {
      this.log(`High memory usage detected: ${usedMb.toFixed(1)} MB`);
    }
  }

  private checkHeartbeats() {
    const now = Date.now();
    const entries = Array.from(this.heartbeats.entries());
    for (const [moduleName, info] of entries) {
      if (now - info.lastSeen > this.heartbeatTimeoutMs) {
        this.log(`WARNING: Missed heartbeat from '${moduleName}'`);
        this.heartbeats.delete(moduleName);
      }
    }
  }

  onStop() {
    this.log("System Health Monitor stopped");

    if (this.healthInterval) {
      this.scheduler.clear(this.healthInterval);
      this.healthInterval = null;
    }

    if (this.heartbeatCheckInterval) {
      this.scheduler.clear(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }
  }
}
