import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { OptimizationResult } from "../types";

interface ResultPanelProps {
  result: OptimizationResult;
  rawPrompt: string;
}

type Tab = "optimized" | "violations" | "diff";

function computeDiff(original: string, modified: string) {
  const lines1 = original.split("\n");
  const lines2 = modified.split("\n");
  const m = lines1.length;
  const n = lines2.length;
  
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  interface DiffLine {
    type: "added" | "removed" | "unchanged";
    text: string;
  }
  const diff: DiffLine[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diff.push({ type: "unchanged", text: lines1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: "added", text: lines2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      diff.push({ type: "removed", text: lines1[i - 1] });
      i--;
    }
  }
  
  return diff.reverse();
}

export function ResultPanel({ result, rawPrompt }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("optimized");
  const [copiedType, setCopiedType] = useState<"text" | "json" | null>(null);

  const copyText = () => {
    navigator.clipboard.writeText(result.optimized_prompt);
    setCopiedType("text");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyJSON = () => {
    const jsonToCopy = {
      system_prompt: result.optimized_prompt,
      violations: result.violations
    };
    navigator.clipboard.writeText(JSON.stringify(jsonToCopy, null, 2));
    setCopiedType("json");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const exportMD = () => {
    const isoDate = new Date().toISOString();
    const yamlFrontmatter = `---
date: ${isoDate}
---

## Violations
${
  result.violations && result.violations.length > 0
    ? result.violations.map(v => `- [${v.severity.toUpperCase()}] ${v.rule}: ${v.description}`).join("\n")
    : "No violations detected."
}

## Optimized Prompt
\`\`\`xml
${result.optimized_prompt}
\`\`\`
`;

    const blob = new Blob([yamlFrontmatter], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `optimized_prompt_${new Date().getTime()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <div className="flex border-b border-gold/10">
        {[
          { id: "optimized", label: "Optimized Structure" },
          { id: "violations", label: `Violations (${result.violations?.length || 0})` },
          { id: "diff", label: "Diff View" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={`text-[10px] px-8 uppercase tracking-[0.2em] pb-4 transition-all relative ${
              activeTab === t.id
                ? "text-[#2c241a] font-bold"
                : "text-gold/40 hover:text-gold"
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto min-h-[400px] font-sans pr-4">
        <AnimatePresence mode="wait">
          {activeTab === "optimized" && (
            <motion.div
              key="optimized"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              {!result.optimized_prompt ? (
                <div className="interface-panel p-8 bg-zinc-50 border border-gold/10 text-gold text-xs font-mono rounded-xl text-center py-12">
                  Analyze Only â€” nessun prompt ottimizzato generato
                </div>
              ) : (
                <>
                  <div className="flex justify-end gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={copyText}
                      className={`text-[10px] px-4 py-2 uppercase tracking-widest transition-all rounded-lg border flex items-center gap-2 ${
                        copiedType === "text"
                          ? "bg-green-50 text-green-700 border-green-100" 
                          : "bg-white border-gold/20 text-gold/60 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {copiedType === "text" ? "âœ“ Copied Text" : "âŽ˜ Copy Text"}
                    </button>
                    <button
                      type="button"
                      onClick={copyJSON}
                      className={`text-[10px] px-4 py-2 uppercase tracking-widest transition-all rounded-lg border flex items-center gap-2 ${
                        copiedType === "json"
                          ? "bg-green-50 text-green-700 border-green-100" 
                          : "bg-white border-gold/20 text-gold/60 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {copiedType === "json" ? "âœ“ Copied JSON" : "{ } Copy JSON"}
                    </button>
                    <button
                      type="button"
                      onClick={exportMD}
                      className="text-[10px] px-4 py-2 uppercase tracking-widest transition-all rounded-lg border bg-white border-gold/20 text-gold/60 hover:border-gold hover:text-gold flex items-center gap-2"
                    >
                      â†“ Export .md
                    </button>
                  </div>
                  <div className="interface-panel p-8 bg-white border-gold/10 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 pointer-events-none text-9xl font-serif italic text-gold">Î©</div>
                    <pre className="text-base leading-[2] text-[#2c241a] whitespace-pre-wrap font-mono selection:bg-gold/20">
                      {result.optimized_prompt.split(/(<[^>]+>)/g).map((part, i) => (
                        part.startsWith('<') ? <span key={i} className="text-gold font-bold">{part}</span> : part
                      ))}
                    </pre>
                  </div>
                </>
              )}

              {result.suggestions?.length > 0 && (
                <div className="mt-8 p-8 bg-white border border-gold/10 border-l-[4px] border-l-gold rounded-2xl">
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-6 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-gold" /> Professional Advancements
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="text-[13px] text-[#5d5142] leading-relaxed flex items-start gap-3">
                         <ChevronRight className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                         {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "violations" && (
            <motion.div
              key="violations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              {result.violations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-gold/20 uppercase tracking-widest text-[11px]">
                  <Check className="w-8 h-8 mb-4 opacity-10" />
                  No high-weighted violations detected.
                </div>
              ) : (
                result.violations.map((v, i) => {
                  const colors = { critical: "#8b3a3a", warning: "#8b5a2b", info: "#5d5142" };
                  const c = colors[v.severity];
                  return (
                    <div 
                      key={i}
                      className="p-4 mb-3 rounded-xl border-l-[4px] bg-white shadow-sm border border-gold/10"
                      style={{ borderLeftColor: c }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                          style={{ color: c, backgroundColor: `${c}10` }}
                        >
                          {v.severity}
                        </span>
                        <span className="text-[12px] text-[#2c241a] font-bold uppercase tracking-tight">{v.rule}</span>
                      </div>
                      <p className="text-[12px] text-[#5d5142] leading-relaxed font-mono">{v.description}</p>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "diff" && (
            <motion.div
              key="diff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col font-mono text-xs leading-relaxed overflow-x-auto bg-zinc-950/20 p-6 rounded-xl border border-gold/10"
            >
              {computeDiff(rawPrompt, result.optimized_prompt).map((line, idx) => {
                let className = "text-zinc-500 whitespace-pre";
                let prefix = " ";
                if (line.type === "added") {
                  className = "bg-green-950/20 text-green-400 whitespace-pre";
                  prefix = "+";
                } else if (line.type === "removed") {
                  className = "bg-red-950/20 text-red-400 whitespace-pre";
                  prefix = "âˆ’";
                }
                return (
                  <div key={idx} className={`${className} px-2 py-0.5 rounded`}>
                    {prefix} {line.text}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gold/10 text-[9px] uppercase text-gold/40 tracking-[0.2em] mt-auto font-mono">
        <span>System Status: Optimal</span>
        <span>Canonical XML V2.4</span>
        <span>Engine: Gemini-2.5-Flash</span>
      </div>
    </div>
  );
}
