export interface Violation {
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
}

export interface OptimizationResult {
  violations: Violation[];
  optimized_prompt: string;
  suggestions: string[];
}

export type View = "landing" | "optimizer" | "library" | "history" | "templates";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  rawPrompt: string;
  result: OptimizationResult;
  tags?: string[];
}

export interface AppState {
  apiKey: string;
  rawPrompt: string;
  isLoading: boolean;
  result: OptimizationResult | null;
  error: string | null;
  currentView: View;
  history: HistoryEntry[];
}
