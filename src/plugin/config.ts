import type { DefenceConfig } from "../config.js";

// ── OpenClaw Plugin API types (import type only) ─────────────
// Declared locally to avoid runtime dependency on openclaw.
// Matches openclaw/plugin-sdk interface as of 2026.2.15.

export interface OpenClawLogger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface OpenClawService {
  id: string;
  start(ctx?: any): void | Promise<void>;
  stop?(ctx?: any): void | Promise<void>;
}

export interface OpenClawCommandDefinition {
  name: string;
  description: string;
  acceptsArgs?: boolean;
  handler(ctx: { args?: string; commandBody: string; [key: string]: unknown }): any;
}

export interface OpenClawPluginApi {
  on(
    hook: string,
    handler: (...args: any[]) => any,
    options?: { priority?: number },
  ): void;
  registerService(service: OpenClawService): void;
  registerCommand(command: OpenClawCommandDefinition): void;
  logger: OpenClawLogger;
  config: Record<string, unknown>;
  pluginConfig?: Record<string, unknown>;
}

export interface OpenClawPluginDefinition {
  id: string;
  name: string;
  version?: string;
  description: string;
  configSchema?: {
    safeParse?: (value: unknown) => { success: boolean; data?: unknown; error?: unknown };
    parse?: (value: unknown) => unknown;
    jsonSchema?: Record<string, unknown>;
  };
  register(api: OpenClawPluginApi): void;
}

// ── Defender Plugin Config ───────────────────────────────────

export interface DefenderPluginConfig {
  /** "log" = log-only mode, "block" = actively block threats. Default: "block" */
  scanMode: "log" | "block";
  toolResultScan: {
    enabled: boolean;
    /** Block messages containing critical-severity findings. Default: true */
    blockOnCritical: boolean;
  };
  beforeToolCall: {
    enabled: boolean;
    /** Run intent alignment check on dangerous tools. Default: true */
    intentAlignment: boolean;
    /** Tool names considered dangerous. */
    dangerousTools: string[];
    /** Block write/edit/overwrite operations targeting these files. Default: SOUL.md, HEARTBEAT.md, etc. */
    protectedFiles: string[];
    /** Tool names considered file-write operations. */
    writeTools: string[];
  };
  outputGuard: {
    enabled: boolean;
    /** Cancel outgoing messages containing leaked credentials. Default: true */
    cancelOnLeak: boolean;
  };
  fileIntegrity: {
    enabled: boolean;
    /** Files to monitor for tampering. */
    watchFiles: string[];
    /** Auto-rollback tampered files from git. Default: false */
    autoRollback: boolean;
    /** Polling interval in ms for hash checks. Default: 60000 */
    checkIntervalMs: number;
  };
  killSwitch: {
    enabled: boolean;
    /** Auto-trigger kill switch on critical findings. Default: false */
    autoTriggerOnCritical: boolean;
  };
  /** Override core scanner config. */
  scanner?: Partial<DefenceConfig>;
}

export function createDefaultPluginConfig(): DefenderPluginConfig {
  return {
    scanMode: "block",
    toolResultScan: {
      enabled: true,
      blockOnCritical: true,
    },
    beforeToolCall: {
      enabled: true,
      intentAlignment: true,
      protectedFiles: [],
      writeTools: [
        "write",
        "edit",
        "apply_patch",
        "write_file",
        "edit_file",
        "create_file",
        "overwrite_file",
        "save_file",
        "patch_file",
        "append_file",
        "update_file",
      ],
      dangerousTools: [
        "exec",
        "bash",
        "shell",
        "run_command",
        "delete",
        "rm",
        "rmdir",
        "drop",
        "send_message",
        "send_email",
        "http_request",
        "fetch",
      ],
    },
    outputGuard: {
      enabled: true,
      cancelOnLeak: true,
    },
    fileIntegrity: {
      enabled: true,
      watchFiles: [
        "SOUL.md",
        "HEARTBEAT.md",
        "CLAUDE.md",
        "AGENTS.md",
        "IDENTITY.md",
        "TOOLS.md",
      ],
      autoRollback: false,
      checkIntervalMs: 60_000,
    },
    killSwitch: {
      enabled: true,
      autoTriggerOnCritical: false,
    },
  };
}

export function mergePluginConfig(
  base: DefenderPluginConfig,
  overrides: Partial<DefenderPluginConfig>,
): DefenderPluginConfig {
  return {
    scanMode: overrides.scanMode ?? base.scanMode,
    toolResultScan: { ...base.toolResultScan, ...overrides.toolResultScan },
    beforeToolCall: {
      ...base.beforeToolCall,
      ...overrides.beforeToolCall,
      dangerousTools:
        overrides.beforeToolCall?.dangerousTools ??
        base.beforeToolCall.dangerousTools,
      protectedFiles:
        overrides.beforeToolCall?.protectedFiles ??
        base.beforeToolCall.protectedFiles,
      writeTools:
        overrides.beforeToolCall?.writeTools ??
        base.beforeToolCall.writeTools,
    },
    outputGuard: { ...base.outputGuard, ...overrides.outputGuard },
    fileIntegrity: {
      ...base.fileIntegrity,
      ...overrides.fileIntegrity,
      watchFiles:
        overrides.fileIntegrity?.watchFiles ??
        base.fileIntegrity.watchFiles,
    },
    killSwitch: { ...base.killSwitch, ...overrides.killSwitch },
    scanner: overrides.scanner ?? base.scanner,
  };
}
