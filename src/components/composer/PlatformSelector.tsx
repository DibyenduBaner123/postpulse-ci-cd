import React from 'react';
import { SocialPlatformId } from '../../types';
import { Check } from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatforms: SocialPlatformId[];
  onTogglePlatform: (platformId: SocialPlatformId) => void;
}

export const PLATFORMS_META: Array<{
  id: SocialPlatformId;
  name: string;
  charLimit: number;
  badgeColor: string;
  dotColor: string;
}> = [
  { id: 'twitter', name: 'X (Twitter)', charLimit: 280, badgeColor: 'border-slate-800 text-slate-900 bg-slate-50', dotColor: 'bg-slate-900' },
  { id: 'instagram', name: 'Instagram', charLimit: 2200, badgeColor: 'border-pink-500 text-pink-700 bg-pink-50/50', dotColor: 'bg-pink-500' },
  { id: 'facebook', name: 'Facebook', charLimit: 63206, badgeColor: 'border-blue-600 text-blue-700 bg-blue-50/50', dotColor: 'bg-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', charLimit: 3000, badgeColor: 'border-sky-700 text-sky-800 bg-sky-50/50', dotColor: 'bg-sky-700' },
  { id: 'youtube', name: 'YouTube', charLimit: 5000, badgeColor: 'border-red-600 text-red-700 bg-red-50/50', dotColor: 'bg-red-600' },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onTogglePlatform,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Target Social Platforms</label>
        <span className="text-[11px] text-slate-400">
          {selectedPlatforms.length} of {PLATFORMS_META.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PLATFORMS_META.map((plat) => {
          const isSelected = selectedPlatforms.includes(plat.id);

          return (
            <button
              type="button"
              key={plat.id}
              onClick={() => onTogglePlatform(plat.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? `border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs`
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full ${plat.dotColor} shrink-0`} />
                <div className="truncate">
                  <span className="text-xs truncate block">{plat.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {plat.charLimit.toLocaleString()} chars
                  </span>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
