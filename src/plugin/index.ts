import { createScanner } from "../scanner.js";
import type { Scanner } from "../scanner.js";
import {
  createDefaultPluginConfig,
  mergePluginConfig,
} from "./config.js";
import type {
  DefenderPluginConfig,
  OpenClawPluginApi,
  OpenClawPluginDefinition,
} from "./config.js";
import { registerToolResultScan } from "./hooks/tool-result-scan.js";
import { registerBeforeToolCall } from "./hooks/before-tool-call.js";
import { registerOutputGuard } from "./hooks/output-guard.js";
import { createFileIntegrityService } from "./services/file-integrity.js";
import type { FileIntegrityEvent } from "./services/file-integrity.js";
import { createKillSwitchService } from "./services/kill-switch.js";
import type { KillSwitchState } from "./services/kill-switch.js";

// ── Re-exports ───────────────────────────────────────────────

export type {
  DefenderPluginConfig,
  OpenClawPluginApi,
  OpenClawPluginDefinition,
  FileIntegrityEvent,
  KillSwitchState,
};

export {
  createDefaultPluginConfig,
  mergePluginConfig,
} from "./config.js";

export {
  scanCredentials,
  redactCredentials,
} from "./utils/credential-patterns.js";
export type { CredentialMatch } from "./utils/credential-patterns.js";

// ── Default export for OpenClaw auto-loading ─────────────────

export default createDefenderPlugin();

// ── Plugin factory ───────────────────────────────────────────

/**
 * Create an OpenClaw plugin definition for openclaw-defender.
 *
 * Usage:
 * ```ts
 * import { createDefenderPlugin } from "openclaw-defender/plugin";
 *
 * export default createDefenderPlugin({
 *   scanMode: "block",
 *   fileIntegrity: { autoRollback: true },
 * });
 * ```
 */
export function createDefenderPlugin(
  userConfig?: Partial<DefenderPluginConfig>,
): OpenClawPluginDefinition {
  const config = userConfig
    ? mergePluginConfig(createDefaultPluginConfig(), userConfig)
    : createDefaultPluginConfig();

  return {
    id: "openclaw-defender",
    name: "OpenClaw Defender",
    version: "0.3.0",
    description:
      "3-layer prompt injection defence with file integrity monitoring and kill switch",
    configSchema: {
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
    },

    register(api: OpenClawPluginApi) {
      api.logger.info("[defender] Initializing openclaw-defender plugin...");

      // Create scanner with optional config overrides
      const scanner: Scanner = createScanner(config.scanner);

      // ── Register hooks ──────────────────────────────────
      registerToolResultScan(api, scanner, config);
      registerBeforeToolCall(api, scanner, config);
      registerOutputGuard(api, config);

      // ── Kill switch (must be before FIM so FIM can reference it) ──
      let killSwitch: ReturnType<typeof createKillSwitchService> | undefined;
      if (config.killSwitch.enabled) {
        killSwitch = createKillSwitchService(api, config);
        api.registerService(killSwitch);
      }

      // ── File integrity monitor ──────────────────────────
      if (config.fileIntegrity.enabled) {
        const fim = createFileIntegrityService(api, config, {
          onTamper(event: FileIntegrityEvent) {
            if (
              config.killSwitch.autoTriggerOnCritical &&
              killSwitch &&
              !event.rolledBack
            ) {
              killSwitch.trigger(
                `File tampering detected: ${event.file} (hash mismatch)`,
              );
            }
          },
        });
        api.registerService(fim);
      }

      api.logger.info("[defender] Plugin registered successfully");
      api.logger.info(`[defender] Mode: ${config.scanMode}`);
      api.logger.info(
        `[defender] Hooks: tool-result-scan=${config.toolResultScan.enabled}, ` +
          `before-tool-call=${config.beforeToolCall.enabled}, ` +
          `output-guard=${config.outputGuard.enabled}`,
      );
      api.logger.info(
        `[defender] Services: file-integrity=${config.fileIntegrity.enabled}, ` +
          `kill-switch=${config.killSwitch.enabled}`,
      );
    },
  };
}
