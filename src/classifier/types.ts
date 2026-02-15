export interface ClassifierResult {
  label: "benign" | "injection" | "jailbreak";
  confidence: number;
}

export interface ClassifierAdapter {
  classify(text: string): Promise<ClassifierResult>;
  /** Optional batch classification for throughput-sensitive workloads. */
  classifyBatch?(texts: string[]): Promise<ClassifierResult[]>;
  /** Optional health check to verify the model server is reachable. */
  healthCheck?(): Promise<{ status: string; model: string }>;
  readonly model: string;
}
