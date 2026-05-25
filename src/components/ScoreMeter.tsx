import { motion } from "motion/react";

interface ScoreMeterProps {
  score: number;
  label: string;
  color: string;
}

export function ScoreMeter({ score, label, color }: ScoreMeterProps) {
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="1"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-serif italic" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#5d5142] font-bold italic">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-2 py-0.5 rounded-full border border-gold/10 bg-white text-[#2c241a] uppercase tracking-widest font-mono`}>
            {score > 85 ? "CANONICAL" : score > 60 ? "STRUCTURED" : "SUB-STANDARD"}
          </span>
        </div>
      </div>
    </div>
  );
}
