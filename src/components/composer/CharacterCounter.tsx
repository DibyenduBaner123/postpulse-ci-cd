import React from 'react';
import { SocialPlatformId } from '../../types';
import { PLATFORMS_META } from './PlatformSelector';

interface CharacterCounterProps {
  contentLength: number;
  selectedPlatforms: SocialPlatformId[];
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  contentLength,
  selectedPlatforms,
}) => {
  if (selectedPlatforms.length === 0) {
    return (
      <div className="text-xs text-slate-400 font-mono">
        <span className="font-semibold text-slate-600 tabular-nums">{contentLength}</span> characters
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {selectedPlatforms.map((platId) => {
        const meta = PLATFORMS_META.find((p) => p.id === platId);
        if (!meta) return null;

        const remaining = meta.charLimit - contentLength;
        const isOver = remaining < 0;
        const isWarning = remaining >= 0 && remaining <= 30;

        // Circular ring calculation
        const percent = Math.min(100, (contentLength / meta.charLimit) * 100);
        const circumference = 2 * Math.PI * 8;
        const strokeDashoffset = circumference - (percent / 100) * circumference;

        return (
          <div
            key={platId}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono transition-colors ${
              isOver
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {/* Tiny circular indicator */}
            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke={isOver ? '#e11d48' : isWarning ? '#d97706' : '#6366f1'}
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            <span className="font-semibold">{meta.name.split(' ')[0]}:</span>
            <span className={`tabular-nums font-bold ${isOver ? 'text-rose-600' : ''}`}>
              {isOver ? `-${Math.abs(remaining)}` : remaining}
            </span>
          </div>
        );
      })}
    </div>
  );
};
