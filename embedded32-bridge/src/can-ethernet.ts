/**
 * CAN ↔ Ethernet Bridge
 * Convert CAN frames to/from Ethernet packets
 * Bi-directional routing with filtering and load shedding
 */

import { decodeJ1939, type DecodedJ1939Message } from '@embedded32/j1939';

export interface BridgeRule {
  enabled: boolean;
  direction: 'can-to-eth' | 'eth-to-can' | 'bidirectional';
  pgn?: number;
  spn?: number;
  minValue?: number;
  maxValue?: number;
  rateLimit?: number;
  transform?: (data: number[]) => number[];
}

export interface BridgeStats {
  messagesIn: number;
  messagesOut: number;
  filteredOut: number;
  errors: number;
  uptime: number;
}

/**
 * CAN to Ethernet Bridge
 */
export class CanEthernetBridge {
  private rules: BridgeRule[] = [];
  private stats: BridgeStats = {
    messagesIn: 0,
    messagesOut: 0,
    filteredOut: 0,
    errors: 0,
    uptime: 0,
  };
  private startTime = Date.now();
  private lastMessageTime = new Map<string, number>();

  constructor(private canInterface: any) {}

  /**
   * Add filtering/routing rule
   */
  addRule(rule: BridgeRule): void {
    this.rules.push(rule);
    console.log(
      `Added bridge rule: ${rule.direction} (${rule.pgn ? `PGN ${rule.pgn}` : 'all'})`
    );
  }

  /**
   * Check if message matches rule
   */
  private matchesRule(
    rule: BridgeRule,
    pgn: number,
    spn?: number,
    value?: number
  ): boolean {
    if (!rule.enabled) return false;
    if (rule.pgn && rule.pgn !== pgn) return false;
    if (rule.spn && rule.spn !== spn) return false;
    if (rule.minValue !== undefined && value !== undefined && value < rule.minValue)
      return false;
    if (rule.maxValue !== undefined && value !== undefined && value > rule.maxValue)
      return false;
    return true;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(rule: BridgeRule, pgn: number): boolean {
    if (!rule.rateLimit) return true;

    const key = `pgn-${pgn}`;
    const now = Date.now();
    const last = this.lastMessageTime.get(key) || 0;
    const interval = 1000 / rule.rateLimit;

    if (now - last < interval) {
      return false;
    }

    this.lastMessageTime.set(key, now);
    return true;
  }

  /**
   * Start bridge
   */
  async start(ethServer?: any): Promise<void> {
    console.log('Starting CAN ↔ Ethernet Bridge');

    this.canInterface.on('message', async (frame: any) => {
      try {
        this.stats.messagesIn++;

        const j1939Msg = decodeJ1939(frame);
        if (!j1939Msg) return;

        let shouldForward = false;
        let transformedData = j1939Msg.raw;

        for (const rule of this.rules) {
          if (
            rule.direction !== 'eth-to-can' &&
            this.matchesRule(rule, j1939Msg.pgn)
          ) {
            if (this.checkRateLimit(rule, j1939Msg.pgn)) {
              shouldForward = true;

              if (rule.transform) {
                transformedData = rule.transform(transformedData);
              }
              break;
            } else {
              this.stats.filteredOut++;
            }
          }
        }

        if (shouldForward && ethServer) {
          const msg = {
            pgn: j1939Msg.pgn,
            sa: j1939Msg.sa,
            priority: j1939Msg.priority,
            data: transformedData,
            timestamp: Date.now() / 1000,
          };

          if (ethServer.broadcast) {
            await ethServer.broadcast(msg);
          }
          this.stats.messagesOut++;
        }
      } catch (error) {
        console.error('Error in CAN ↔ Ethernet bridge:', error);
        this.stats.errors++;
      }
    });

    console.log('CAN ↔ Ethernet Bridge started');
  }

  /**
   * Get bridge statistics
   */
  getStats(): BridgeStats {
    return {
      ...this.stats,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Get active rules
   */
  getRules(): BridgeRule[] {
    return [...this.rules];
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(index: number, enabled: boolean): void {
    if (this.rules[index]) {
      this.rules[index].enabled = enabled;
    }
  }
}

export default { CanEthernetBridge };
