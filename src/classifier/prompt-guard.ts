import type { ClassifierAdapter, ClassifierResult } from "./types.js";

// TODO: Replace HTTP inference server with direct ONNX Runtime / Transformers.js
// integration once @xenova/transformers supports PromptGuard 86M natively.
// This will remove the need for a sidecar process and reduce latency.

export interface PromptGuardConfig {
  /** HTTP endpoint of the local inference server. Default: "http://localhost:8000/classify" */
  endpoint?: string;
  /** Base URL used to derive /classify and /health. Overridden by `endpoint`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 5000 */
  timeoutMs?: number;
}

function resolveUrls(config: PromptGuardConfig): {
  classifyUrl: string;
  healthUrl: string;
} {
  if (config.endpoint) {
    // Derive health URL from the classify endpoint by replacing the path
    const base = config.endpoint.replace(/\/classify\/?$/, "");
    return { classifyUrl: config.endpoint, healthUrl: `${base}/health` };
  }
  const base = (config.baseUrl ?? "http://localhost:8000").replace(/\/+$/, "");
  return { classifyUrl: `${base}/classify`, healthUrl: `${base}/health` };
}

export function createPromptGuardAdapter(
  config: PromptGuardConfig = {},
): ClassifierAdapter {
  const { classifyUrl, healthUrl } = resolveUrls(config);
  const timeoutMs = config.timeoutMs ?? 5_000;

  async function fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(
          `PromptGuard request to ${url} timed out after ${timeoutMs}ms. ` +
            `Is the model server running? Start it with: cd serve/prompt-guard && python server.py`,
        );
      }
      if (
        err instanceof TypeError &&
        (err.message.includes("fetch failed") ||
          err.message.includes("ECONNREFUSED"))
      ) {
        throw new Error(
          `PromptGuard server unreachable at ${url}. ` +
            `Start the model server with: cd serve/prompt-guard && python server.py ` +
            `or: cd serve && docker compose up prompt-guard`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    model: "prompt-guard-2-86m",

    async classify(text: string): Promise<ClassifierResult> {
      const response = await fetchWithTimeout(classifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(
          `PromptGuard classifier returned HTTP ${response.status}: ${await response.text()}`,
        );
      }

      const result = (await response.json()) as {
        label: "benign" | "injection" | "jailbreak";
        confidence: number;
      };

      return { label: result.label, confidence: result.confidence };
    },

    async classifyBatch(texts: string[]): Promise<ClassifierResult[]> {
      const response = await fetchWithTimeout(classifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error(
          `PromptGuard batch classify returned HTTP ${response.status}: ${await response.text()}`,
        );
      }

      const body = (await response.json()) as {
        results: Array<{
          label: "benign" | "injection" | "jailbreak";
          confidence: number;
        }>;
      };

      return body.results.map((r) => ({
        label: r.label,
        confidence: r.confidence,
      }));
    },

    async healthCheck(): Promise<{ status: string; model: string }> {
      const response = await fetchWithTimeout(healthUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(
          `PromptGuard health check returned HTTP ${response.status}`,
        );
      }

      return (await response.json()) as { status: string; model: string };
    },
  };
}
