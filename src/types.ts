export interface Violation {
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
}

export interface Change {
  type: "added" | "removed" | "modified" | "restructured";
  element: string;
  reason: string;
}

export interface OptimizationResult {
  score_before: number;
  score_after: number;
  violations: Violation[];
  optimized_prompt: string;
  changes: Change[];
  suggestions: string[];
  score_breakdown?: Record<string, number>;
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
