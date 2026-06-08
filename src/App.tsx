import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ResultPanel } from "./components/ResultPanel";
import { optimizePrompt, analyzePrompt } from "./lib/gemini";
import { AppState, View, HistoryEntry } from "./types";
import { ArrowLeftRight, Sparkles, Zap, ShieldCheck, History, Library, Layout, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TEMPLATES } from "../data/templates";

const EXAMPLES = [
  {
    label: "Vago",
    text: "Sei un assistente utile. Analizza questo documento e dimmi cosa ne pensi. Considera tutti gli aspetti importanti e fornisci un'analisi completa. Il documento parla di finanza. Grazie!"
  },
  {
    label: "Senza schema",
    text: "Classificatore di sentiment per recensioni e-commerce. L'utente inserisce una recensione e tu devi dire se è positiva o negativa."
  },
  {
    label: "Overload",
    text: "Sei un esperto di marketing. Analizza il mercato, scrivi un piano editoriale, crea 10 post per Instagram, ottimizza per SEO, traduci in inglese, crea una presentazione per il cliente, stima il budget, individua i competitor, proponi KPI e scrivi anche una newsletter mensile. Il target è Gen Z italiano."
  }
];

const INITIAL_STATE: AppState = {
  apiKey: "",
  rawPrompt: "",
  isLoading: false,
  result: null,
  error: null,
  currentView: "landing",
  history: [],
};

function loadSavedState(): AppState {
  try {
    const saved = localStorage.getItem("standard_state");
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  } catch (error) {
    console.error("Failed to load saved state:", error);
    return INITIAL_STATE;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem("standard_state", JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadSavedState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setView = (view: View) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const [focus, setFocus] = useState<string | null>(null);
  const [showFocusPanel, setShowFocusPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleAddTag = (entryId: string, tag: string) => {
    setState((prev) => {
      const updatedHistory = prev.history.map((entry) => {
        if (entry.id === entryId) {
          const currentTags = entry.tags || [];
          if (!currentTags.includes(tag)) {
            return { ...entry, tags: [...currentTags, tag] };
          }
        }
        return entry;
      });
      return { ...prev, history: updatedHistory };
    });
  };

  const handleRemoveTag = (entryId: string, tagToRemove: string) => {
    setState((prev) => {
      const updatedHistory = prev.history.map((entry) => {
        if (entry.id === entryId) {
          return {
            ...entry,
            tags: (entry.tags || []).filter((t) => t !== tagToRemove),
          };
        }
        return entry;
      });
      return { ...prev, history: updatedHistory };
    });
  };

  const handleOptimize = async (customPrompt?: string, onlyAnalyze = false) => {
    const promptToOptimize = customPrompt || state.rawPrompt;
    if (!state.apiKey) {
      setState((prev) => ({ ...prev, error: "API Key is required" }));
      return;
    }
    if (!promptToOptimize.trim()) {
      setState((prev) => ({ ...prev, error: "Prompt is required" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, result: null }));

    try {
      const result = onlyAnalyze 
        ? await analyzePrompt(state.apiKey, promptToOptimize)
        : await optimizePrompt(state.apiKey, promptToOptimize);
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        rawPrompt: promptToOptimize,
        result,
      };
      setState((prev) => ({ 
        ...prev, 
        result, 
        isLoading: false,
        history: [historyEntry, ...prev.history].slice(0, 50)
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An unknown error occurred",
        isLoading: false,
      }));
    }
  };

  const handleApplyFocus = () => {
    if (!focus) return;
    const instruction = `\n\n[FOCUS: Ottimizza prioritariamente la sezione ${focus} — le altre sezioni possono rimanere invariate se già conformi allo Standard 2026]`;
    handleOptimize(state.rawPrompt + instruction);
  };

  const loadExample = (text: string) => {
    setState(prev => ({ ...prev, rawPrompt: text, result: null, error: null, currentView: "optimizer" }));
  };

  return (
    <div className="min-h-screen bg-interface-bg text-[#2c241a] font-sans selection:bg-gold/20">
      <Header 
        apiKey={state.apiKey} 
        setApiKey={(val) => setState(prev => ({ ...prev, apiKey: val }))} 
        currentView={state.currentView}
        setView={setView}
      />

      <div className="pt-24 min-h-screen">
        <AnimatePresence mode="wait">
          {state.currentView === "landing" && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-6 overflow-hidden relative"
            >
              {/* Background Accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/[0.05] rounded-full blur-[120px] pointer-events-none" />
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center z-10"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-white/50 text-[#8b7355] text-[10px] uppercase tracking-[0.2em] mb-8 font-bold">
                  <Sparkles className="w-3 h-3" /> Standard 2026 Protocol
                </div>
                <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tight mb-8 italic text-[#2c241a]">
                  Standard <span className="text-gold/20 not-italic">2026</span>
                </h1>
                <p className="max-w-2xl mx-auto text-xl md:text-2xl text-[#5d5142] font-light leading-relaxed mb-12">
                  Elevate your prompts to <span className="text-[#2c241a] font-semibold underline decoration-gold/40">production-grade</span> engineering. Automated structural optimization using the canonical 2026 framework.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
                  <button 
                    onClick={() => setView("optimizer")}
                    className="interface-button w-full md:w-auto px-12 py-5 text-sm shadow-[0_20px_50px_rgba(139,115,85,0.2)] bg-gold text-white font-bold"
                  >
                    Enter Command Center
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mx-auto">
                  <div className="p-6 rounded-2xl border border-gold/10 bg-white text-left shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gold/5 flex items-center justify-center mb-4">
                      <Zap className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-[#2c241a]">XML Structuralism</h3>
                    <p className="text-xs text-[#5d5142] leading-relaxed font-mono">Canonical hierarchy for precise control over LLM instruction weight and recall.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-gold/10 bg-white text-left shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gold/5 flex items-center justify-center mb-4">
                      <ArrowLeftRight className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-[#2c241a]">Positional Weight</h3>
                    <p className="text-xs text-[#5d5142] leading-relaxed font-mono">Automated logic placement to exploit horizontal and vertical attention biases.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-gold/10 bg-white text-left shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-gold/5 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-[#2c241a]">Verification Protocols</h3>
                    <p className="text-xs text-[#5d5142] leading-relaxed font-mono">Evaluation against 12 critical engineering violations in real-time.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {state.currentView === "optimizer" && (
            <motion.div 
              key="optimizer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col max-w-[1400px] mx-auto w-full h-[calc(100vh-6rem)] p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-[#2c241a] uppercase tracking-widest font-bold">Protocol: Engineering Command Center</span>
                </div>
              </div>

              {state.error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-900/5 border border-red-900/10 rounded-xl text-red-900 text-xs font-mono flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-800 animate-pulse" />
                  {state.error}
                </motion.div>
              )}

              <main className="grid grid-cols-12 gap-8 flex-grow overflow-hidden mb-4">
                {/* Input Section */}
                <section className="col-span-5 flex flex-col gap-6 overflow-hidden">
                  <div className="flex justify-between items-center border-b border-gold/10 pb-3">
                    <h2 className="text-[10px] uppercase tracking-widest text-[#2c241a] font-bold">Input Matrix</h2>
                    <span className="text-[10px] text-gold/40 font-mono italic">{state.rawPrompt.length} chars</span>
                  </div>
                  <div className="flex-grow relative group">
                    <textarea 
                      value={state.rawPrompt}
                      onChange={(e) => setState(prev => ({ ...prev, rawPrompt: e.target.value }))}
                      placeholder="Paste your raw instructions for canonical restructuring..."
                      className="w-full h-full bg-white border border-gold/10 rounded-2xl p-8 text-sm md:text-base leading-[2] resize-none focus:outline-none focus:border-gold transition-all font-mono text-[#2c241a] placeholder:text-gold/10 shadow-sm"
                    />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-gold/40 uppercase tracking-widest font-mono">
                      Awaiting protocols...
                    </div>
                  </div>
                  <div className="p-2 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleOptimize()}
                        disabled={state.isLoading || !state.rawPrompt.trim()}
                        className="flex-1 interface-button py-6 shadow-[0_20px_50px_rgba(139,115,85,0.1)] hover:shadow-[0_20px_50px_rgba(139,115,85,0.2)] disabled:opacity-20 bg-gold text-white font-bold uppercase tracking-widest"
                      >
                        {state.isLoading ? (
                          <div className="flex items-center justify-center gap-4">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span className="animate-pulse">Analyzing V4 Layers</span>
                          </div>
                        ) : "Execute Optimization Protocol"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOptimize(undefined, true)}
                        disabled={state.isLoading || !state.rawPrompt.trim()}
                        className="flex-1 py-6 border border-gold/40 text-gold font-bold uppercase tracking-widest text-xs rounded-lg hover:border-gold hover:bg-gold/5 transition-all disabled:opacity-20"
                      >
                        Analyze Only
                      </button>
                    </div>

                    {state.result && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFocusPanel(prev => !prev)}
                          className="w-full py-4 border border-gold/20 hover:border-gold text-gold text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          Re-optimize with Focus →
                        </button>
                        
                        <AnimatePresence>
                          {showFocusPanel && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden bg-gold/5 border border-gold/10 rounded-xl p-4 flex flex-col gap-4"
                            >
                              <div className="text-[10px] uppercase tracking-widest text-[#2c241a] font-bold">Select Optimization Focus</div>
                              <div className="flex flex-wrap gap-2">
                                {["Examples", "Constraints", "Role", "Output Format", "Positional Bias"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setFocus(prev => prev === opt ? null : opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                                      focus === opt
                                        ? "bg-gold text-white border-gold font-semibold"
                                        : "bg-white text-gold/80 border-gold/10 hover:border-gold/30"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              {focus && (
                                <button
                                  type="button"
                                  onClick={handleApplyFocus}
                                  disabled={state.isLoading}
                                  className="interface-button w-full py-3 bg-gold text-white font-bold uppercase tracking-widest text-xs"
                                >
                                  Apply Focus
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </section>

                {/* Results Section */}
                <section className="col-span-7 flex flex-col overflow-hidden">
                  {!state.result && !state.isLoading ? (
                    <div className="flex-grow interface-panel border-dashed border-gold/20 flex flex-col items-center justify-center text-gold/20 bg-white gap-8">
                      <div className="text-9xl font-serif italic opacity-5 select-none">2026</div>
                      <p className="text-[10px] text-center max-w-sm leading-relaxed uppercase tracking-[0.5em] font-mono font-bold">
                        Restructured payload will materialize here
                      </p>
                    </div>
                  ) : state.isLoading ? (
                     <div className="flex-grow flex flex-col items-center justify-center text-gold gap-6">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-2 border-gold/10 border-t-gold rounded-full"
                      />
                      <div className="text-[10px] uppercase tracking-[0.4em] font-mono animate-pulse">Syncing Canonical Structure</div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-1000">
                      <ResultPanel result={state.result} rawPrompt={state.rawPrompt} />
                    </div>
                  )}
                </section>
              </main>
            </motion.div>
          )}

          {state.currentView === "library" && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col max-w-[1000px] mx-auto w-full p-6"
            >
              <h2 className="text-3xl font-serif italic text-[#2c241a] mb-8">Pattern Library</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {EXAMPLES.map((ex) => (
                  <div 
                    key={ex.label}
                    className="p-8 bg-white border border-gold/10 rounded-2xl shadow-sm hover:border-gold transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg font-bold text-[#2c241a]">{ex.label}</h3>
                      <button 
                        onClick={() => loadExample(ex.text)}
                        className="p-2 rounded-lg bg-gold/5 text-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-[#5d5142] font-mono leading-relaxed mb-6 line-clamp-3">
                      {ex.text}
                    </p>
                    <button 
                      onClick={() => loadExample(ex.text)}
                      className="text-[10px] uppercase tracking-widest text-gold font-bold flex items-center gap-2"
                    >
                      Use Pattern ↗
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {state.currentView === "templates" && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col max-w-[1000px] mx-auto w-full p-6"
            >
              <h2 className="text-3xl font-serif italic text-[#2c241a] mb-8">Scaffold Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    className="p-8 bg-white border border-gold/10 rounded-2xl shadow-sm hover:border-gold transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 rounded-full border border-gold/20 bg-gold/5 text-[9px] uppercase tracking-wider text-gold font-bold">
                          {tmpl.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#2c241a] mb-2">{tmpl.label}</h3>
                      <p className="text-sm text-[#5d5142] leading-relaxed mb-6">
                        {tmpl.description}
                      </p>
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          setState(prev => ({ 
                            ...prev, 
                            rawPrompt: tmpl.scaffold, 
                            result: null, 
                            error: null, 
                            currentView: "optimizer" 
                          }));
                        }}
                        className="text-[10px] uppercase tracking-widest text-gold hover:text-gold-hover font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                      >
                        Use Template →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {state.currentView === "history" && (() => {
            const allUniqueTags = Array.from(
              new Set(state.history.flatMap((entry) => entry.tags || []))
            );
            const filteredHistory = state.history.filter((entry) => {
              const matchesSearch = entry.rawPrompt.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesTags = selectedTags.every((t) => (entry.tags || []).includes(t));
              return matchesSearch && matchesTags;
            });
            return (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col max-w-[1000px] mx-auto w-full p-6"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-serif italic text-[#2c241a]">Optimization History</h2>
                  <button 
                    onClick={() => setState(prev => ({ ...prev, history: [] }))}
                    className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-700 font-bold"
                  >
                    Clear Archive
                  </button>
                </div>
                
                {state.history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-gold/20 border-2 border-dashed border-gold/10 rounded-2xl">
                    <History className="w-12 h-12 mb-4" />
                    <span className="text-xs uppercase tracking-widest font-bold">No entries found in archive</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Search and Tag Filters */}
                    <div className="flex flex-col gap-4 mb-6">
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca nella history..."
                        className="interface-input w-full bg-white/50 border border-gold/10"
                      />
                      
                      {allUniqueTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-gold/60 font-bold mr-2">Filtra per tag:</span>
                          {allUniqueTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setSelectedTags((prev) => 
                                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
                                  isSelected
                                    ? "bg-gold text-white border-gold font-bold"
                                    : "bg-white text-gold/80 border-gold/10 hover:border-gold/30"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {filteredHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gold/20 border border-dashed border-gold/10 rounded-xl bg-white">
                        <span className="text-xs uppercase tracking-widest font-bold">No entries match filters</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {filteredHistory.map((entry) => (
                          <div 
                            key={entry.id}
                            className="p-6 bg-white border border-gold/10 rounded-xl shadow-sm hover:border-gold transition-all cursor-pointer group"
                            onClick={() => {
                              setState(prev => ({ ...prev, rawPrompt: entry.rawPrompt, result: entry.result, currentView: "optimizer" }));
                            }}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] text-gold/40 font-mono">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gold/20 group-hover:text-gold transition-colors" />
                            </div>
                            <p className="text-xs text-[#5d5142] font-mono line-clamp-1 opacity-60">
                              {entry.rawPrompt}
                            </p>
                            
                            <div 
                              className="mt-4 flex flex-wrap items-center gap-2 border-t border-gold/5 pt-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(entry.tags || []).map((tag) => (
                                <span 
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold/5 border border-gold/15 text-[11px] font-mono text-gold"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTag(entry.id, tag);
                                    }}
                                    className="hover:text-red-600 transition-colors ml-0.5 text-xs font-bold font-sans"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              
                              <input
                                type="text"
                                placeholder="+ Add tag (Enter)"
                                className="bg-transparent border-b border-dashed border-gold/20 focus:border-gold focus:outline-none text-[11px] font-mono text-[#2c241a] px-1 py-0.5 w-28 placeholder:text-gold/20"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const input = e.currentTarget;
                                    const val = input.value.trim();
                                    if (val) {
                                      handleAddTag(entry.id, val);
                                      input.value = "";
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
