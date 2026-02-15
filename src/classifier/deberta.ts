import type { ClassifierAdapter, ClassifierResult } from "./types.js";

export interface DeBERTaConfig {
  /** HTTP endpoint of the local inference server. Default: "http://localhost:8001/classify" */
  endpoint?: string;
  /** Base URL used to derive /classify and /health. Overridden by `endpoint`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 5000 */
  timeoutMs?: number;
}

function resolveUrls(config: DeBERTaConfig): {
  classifyUrl: string;
  healthUrl: string;
} {
  if (config.endpoint) {
    const base = config.endpoint.replace(/\/classify\/?$/, "");
    return { classifyUrl: config.endpoint, healthUrl: `${base}/health` };
  }
  const base = (config.baseUrl ?? "http://localhost:8001").replace(/\/+$/, "");
  return { classifyUrl: `${base}/classify`, healthUrl: `${base}/health` };
}

/**
 * Adapter for the ProtectAI DeBERTa v3 prompt-injection classifier.
 *
 * The model performs binary classification (injection vs. benign).
 * We map its output to the standard ClassifierLabel union:
 *   - "injection" stays as "injection"
 *   - everything else maps to "benign"
 */
export function createDeBERTaAdapter(
  config: DeBERTaConfig = {},
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
          `DeBERTa request to ${url} timed out after ${timeoutMs}ms. ` +
            `Is the model server running? Start it with: cd serve/deberta && python server.py`,
        );
      }
      if (
        err instanceof TypeError &&
        (err.message.includes("fetch failed") ||
          err.message.includes("ECONNREFUSED"))
      ) {
        throw new Error(
          `DeBERTa server unreachable at ${url}. ` +
            `Start the model server with: cd serve/deberta && python server.py ` +
            `or: cd serve && docker compose up deberta`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function mapLabel(label: string): "benign" | "injection" | "jailbreak" {
    return label === "injection" ? "injection" : "benign";
  }

  return {
    model: "deberta-v3-prompt-injection",

    async classify(text: string): Promise<ClassifierResult> {
      const response = await fetchWithTimeout(classifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(
          `DeBERTa classifier returned HTTP ${response.status}: ${await response.text()}`,
        );
      }

      const result = (await response.json()) as {
        label: string;
        confidence: number;
      };

      return { label: mapLabel(result.label), confidence: result.confidence };
    },

    async classifyBatch(texts: string[]): Promise<ClassifierResult[]> {
      const response = await fetchWithTimeout(classifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error(
          `DeBERTa batch classify returned HTTP ${response.status}: ${await response.text()}`,
        );
      }

      const body = (await response.json()) as {
        results: Array<{ label: string; confidence: number }>;
      };

      return body.results.map((r) => ({
        label: mapLabel(r.label),
        confidence: r.confidence,
      }));
    },

    async healthCheck(): Promise<{ status: string; model: string }> {
      const response = await fetchWithTimeout(healthUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(
          `DeBERTa health check returned HTTP ${response.status}`,
        );
      }

      return (await response.json()) as { status: string; model: string };
    },
  };
}
