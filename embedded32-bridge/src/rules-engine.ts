/**
 * Routing Rules Engine
 * Filter by PGN, SPN, values with rate limiting
 */

export enum RuleAction {
  ALLOW = 'allow',
  DROP = 'drop',
  TRANSFORM = 'transform',
}

export interface SNPFilter {
  number: number;
  minValue?: number;
  maxValue?: number;
  equals?: number;
}

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  pgnFilter?: number;
  spnFilters?: SNPFilter[];
  action: RuleAction;
  rateLimit?: number;
  ttl?: number;
  transform?: (data: any) => any;
  description?: string;
}

/**
 * Rule Engine
 */
export class RuleEngine {
  private rules: RoutingRule[] = [];
  private hitCounts = new Map<string, number>();

  /**
   * Add rule
   */
  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
    console.log(`Added rule: ${rule.name} (priority: ${rule.priority})`);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * Evaluate message against rules
   */
  evaluate(pgn: number, data: any, spnValues?: Map<number, number>): {
    action: RuleAction;
    rule: RoutingRule | null;
    transformedData?: any;
  } {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (rule.pgnFilter && rule.pgnFilter !== pgn) {
        continue;
      }

      if (rule.spnFilters && spnValues) {
        const allSpnMatch = rule.spnFilters.every((spnFilter) => {
          const value = spnValues.get(spnFilter.number);
          if (value === undefined) return false;

          if (spnFilter.equals !== undefined && value !== spnFilter.equals) return false;
          if (spnFilter.minValue !== undefined && value < spnFilter.minValue)
            return false;
          if (spnFilter.maxValue !== undefined && value > spnFilter.maxValue)
            return false;

          return true;
        });

        if (!allSpnMatch) continue;
      }

      this.hitCounts.set(rule.id, (this.hitCounts.get(rule.id) || 0) + 1);

      if (rule.action === RuleAction.DROP) {
        return { action: RuleAction.DROP, rule };
      }

      if (rule.action === RuleAction.TRANSFORM && rule.transform) {
        const transformedData = rule.transform(data);
        return { action: RuleAction.TRANSFORM, rule, transformedData };
      }

      return { action: RuleAction.ALLOW, rule };
    }

    return { action: RuleAction.ALLOW, rule: null };
  }

  /**
   * Check rate limit
   */
  checkRateLimit(ruleId: string, lastMessageTime?: number): boolean {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule || !rule.rateLimit) return true;

    if (!lastMessageTime) return true;

    const elapsed = Date.now() - lastMessageTime;
    const interval = 1000 / rule.rateLimit;

    return elapsed >= interval;
  }

  /**
   * Get all rules
   */
  getRules(): RoutingRule[] {
    return [...this.rules];
  }

  /**
   * Get rule
   */
  getRule(ruleId: string): RoutingRule | undefined {
    return this.rules.find((r) => r.id === ruleId);
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<RoutingRule>): void {
    const rule = this.getRule(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.rules.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.getRule(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get stats
   */
  getStats(): Map<string, { rule: RoutingRule; hitCount: number }> {
    const stats = new Map<string, { rule: RoutingRule; hitCount: number }>();

    this.rules.forEach((rule) => {
      stats.set(rule.id, {
        rule,
        hitCount: this.hitCounts.get(rule.id) || 0,
      });
    });

    return stats;
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.hitCounts.clear();
  }

  /**
   * Create engine rule template
   */
  static createHighPriorityEngineRule(): RoutingRule {
    return {
      id: 'high-priority-engine',
      name: 'High Priority Engine Messages',
      enabled: true,
      priority: 100,
      pgnFilter: 0xf004,
      action: RuleAction.ALLOW,
      rateLimit: 100,
      description: 'Allow engine messages with high rate limit',
    };
  }

  /**
   * Create DM1 rule template
   */
  static createDM1FaultRule(): RoutingRule {
    return {
      id: 'dm1-faults',
      name: 'DM1 Fault Codes',
      enabled: true,
      priority: 90,
      pgnFilter: 0xfeca,
      action: RuleAction.ALLOW,
      description: 'Always allow DM1 diagnostic messages',
    };
  }

  /**
   * Create rate limit rule template
   */
  static createRateLimitRule(pgn: number, rateLimit: number = 10): RoutingRule {
    return {
      id: `rate-limit-${pgn}`,
      name: `Rate Limit PGN 0x${pgn.toString(16).toUpperCase()}`,
      enabled: true,
      priority: 50,
      pgnFilter: pgn,
      action: RuleAction.ALLOW,
      rateLimit,
      description: `Limit ${pgn} to ${rateLimit} msgs/sec`,
    };
  }
}

export default { RuleEngine, RuleAction };
