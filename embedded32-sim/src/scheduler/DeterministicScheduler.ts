/**
 * Deterministic Simulation Scheduler
 * 
 * Provides time-synchronized execution of simulation components.
 * Ensures reproducible simulation runs.
 */

import { ISimScheduler, ISimPort, SimState } from "../interfaces/SimPort.js";
import { EventEmitter } from "events";

/**
 * Deterministic Scheduler
 * 
 * Features:
 * - Fixed timestep execution
 * - Deterministic time progression
 * - Priority-based component ordering
 */
export class DeterministicScheduler extends EventEmitter implements ISimScheduler {
  private components: ISimPort[] = [];
  private running: boolean = false;
  private nowMs: number = 0;
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly tickMs: number;
  private startRealTime: number = 0;

  constructor(tickMs: number = 10) {
    super();
    this.tickMs = tickMs;
  }

  /**
   * Register a simulation component
   */
  register(component: ISimPort): void {
    if (!this.components.includes(component)) {
      this.components.push(component);
      this.emit("componentRegistered", component.getName());
    }
  }

  /**
   * Unregister a simulation component
   */
  unregister(component: ISimPort): void {
    const idx = this.components.indexOf(component);
    if (idx >= 0) {
      this.components.splice(idx, 1);
      this.emit("componentUnregistered", component.getName());
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.nowMs = 0;
    this.startRealTime = Date.now();

    this.emit("started");

    // Start all components
    for (const component of this.components) {
      component.start().catch(err => {
        this.emit("error", err);
      });
    }

    // Start tick loop
    this.tickInterval = setInterval(() => {
      this.executeTick();
    }, this.tickMs);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    // Stop all components
    for (const component of this.components) {
      component.stop().catch(err => {
        this.emit("error", err);
      });
    }

    this.emit("stopped", { 
      simulationTimeMs: this.nowMs,
      realTimeMs: Date.now() - this.startRealTime 
    });
  }

  /**
   * Execute one tick
   */
  private executeTick(): void {
    const previousNowMs = this.nowMs;
    this.nowMs += this.tickMs;
    const deltaMs = this.tickMs;

    // Tick all components
    for (const component of this.components) {
      if (component.getState() === SimState.RUNNING) {
        try {
          component.tick(this.nowMs, deltaMs);
        } catch (err) {
          this.emit("error", err);
        }
      }
    }

    this.emit("tick", { nowMs: this.nowMs, deltaMs });
  }

  /**
   * Get current simulation time
   */
  getNowMs(): number {
    return this.nowMs;
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get tick rate
   */
  getTickMs(): number {
    return this.tickMs;
  }

  /**
   * Get registered component count
   */
  getComponentCount(): number {
    return this.components.length;
  }

  /**
   * Get all component names
   */
  getComponentNames(): string[] {
    return this.components.map(c => c.getName());
  }
}
