import { Runtime } from "@embedded32/core";
import { Logger } from "@embedded32/core/dist/logger/Logger.js";

/**
 * Base class for all CLI commands
 */
export abstract class BaseCommand {
  protected runtime: Runtime | null = null;
  protected logger: Logger | null = null;
  protected args: string[] = [];

  constructor(protected commandName: string) {}

  /**
   * Set parsed arguments for the command
   */
  setArgs(args: string[]) {
    this.args = args;
  }

  /**
   * Initialize runtime if needed
   */
  async initRuntime(configPath?: string) {
    if (this.runtime) return;

    this.runtime = new Runtime({
      logLevel: "info",
      configPath: configPath || "./config.json",
    });

    this.logger = this.runtime.getLogger();
  }

  /**
   * Get help text
   */
  abstract getHelp(): string;

  /**
   * Execute the command
   */
  abstract execute(): Promise<void>;

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.runtime) {
      await this.runtime.stop();
    }
  }

  /**
   * Log output to console
   */
  protected log(message: string, level: "info" | "warn" | "error" = "info") {
    if (level === "error") {
      console.error(`[${this.commandName}] ❌ ${message}`);
    } else if (level === "warn") {
      console.warn(`[${this.commandName}] ⚠️  ${message}`);
    } else {
      console.log(`[${this.commandName}] ℹ️  ${message}`);
    }
  }

  /**
   * Parse command-line arguments
   */
  protected parseArgs(
    args: string[]
  ): { [key: string]: string | boolean | string[] } {
    const parsed: { [key: string]: string | boolean | string[] } = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const nextArg = args[i + 1];

        // Check if next arg is a value or another flag
        if (nextArg && !nextArg.startsWith("--")) {
          parsed[key] = nextArg;
          i++;
        } else {
          parsed[key] = true;
        }
      } else if (arg.startsWith("-")) {
        const key = arg.slice(1);
        parsed[key] = true;
      }
    }

    return parsed;
  }

  /**
   * Expect a value for an argument
   */
  protected expectArg(
    args: { [key: string]: string | boolean | string[] },
    key: string,
    description: string
  ): string {
    const value = args[key];
    if (!value || typeof value === "boolean") {
      throw new Error(`Missing required argument: --${key} (${description})`);
    }
    return value as string;
  }
}
