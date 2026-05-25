import { useState } from "react";
import { Key, Eye, EyeOff, Layout, Zap, Library, History, FileCode } from "lucide-react";
import { View } from "../types";

interface HeaderProps {
  apiKey: string;
  setApiKey: (val: string) => void;
  currentView: View;
  setView: (view: View) => void;
}

export function Header({ apiKey, setApiKey, currentView, setView }: HeaderProps) {
  const [showKey, setShowKey] = useState(false);

  const navItems: { id: View; label: string; icon: any }[] = [
    { id: "landing", label: "Home", icon: Layout },
    { id: "optimizer", label: "Optimizer", icon: Zap },
    { id: "templates", label: "Templates", icon: FileCode },
    { id: "library", label: "Library", icon: Library },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between pointer-events-none bg-interface-bg/90 backdrop-blur-md border-b border-gold/10">
      <div className="flex items-center gap-12 pointer-events-auto">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => setView("landing")}
        >
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
            Ω
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2c241a]">Standard</span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-gold/60 font-mono">Archive v4.0.2</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${
                currentView === item.id
                  ? "bg-gold text-white font-bold"
                  : "text-gold/60 hover:text-gold hover:bg-gold/5"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/50 border border-gold/10 rounded-full px-5 py-2.5">
          <Key className="w-3.5 h-3.5 text-gold/40" />
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="GEMINI_API_KEY"
            className="bg-transparent border-none focus:outline-none text-[11px] font-mono text-[#2c241a] w-48 placeholder:text-gold/20"
          />
          <button 
            onClick={() => setShowKey(!showKey)}
            className="text-gold/30 hover:text-gold transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="h-4 w-px bg-gold/10 hidden md:block" />
        
        <a 
          href="https://ai.google.dev/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[0.2em] text-gold/60 hover:text-gold transition-colors font-mono hidden lg:block"
        >
          Documentation ↗
        </a>
      </div>
    </header>
  );
}
