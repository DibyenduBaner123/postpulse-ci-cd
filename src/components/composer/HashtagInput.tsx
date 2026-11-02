import React, { useState } from 'react';
import { Hash, X, Plus } from 'lucide-react';

interface HashtagInputProps {
  hashtags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const SUGGESTED_TAGS = ['#SaaS', '#SoftwareArchitecture', '#Marketing', '#DevOps', '#Productivity', '#TechLaunch', '#CloudNative'];

export const HashtagInput: React.FC<HashtagInputProps> = ({ hashtags, onChange, maxTags = 15 }) => {
  const [inputVal, setInputVal] = useState('');

  const addTag = (tag: string) => {
    let clean = tag.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (hashtags.includes(clean)) return;
    if (hashtags.length >= maxTags) return;
    onChange([...hashtags, clean]);
    setInputVal('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(hashtags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-indigo-600" />
          <span>Hashtags</span>
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          ({hashtags.length}/{maxTags})
        </span>
      </div>

      {/* Chips Container & Input */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-indigo-500 focus-within:bg-white transition-all">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-indigo-900 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {hashtags.length < maxTags && (
          <input
            type="text"
            placeholder={hashtags.length === 0 ? "Type tag and press Enter (e.g. #Tech)..." : "Add more..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputVal && addTag(inputVal)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none flex-1 min-w-[120px] py-0.5"
          />
        )}
      </div>

      {/* Suggestions Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-400 font-medium">Suggestions:</span>
        {SUGGESTED_TAGS.filter((t) => !hashtags.includes(t))
          .slice(0, 5)
          .map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => addTag(tag)}
              className="text-[10px] text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 px-1.5 py-0.5 rounded border border-slate-200 hover:border-indigo-200 transition-colors"
            >
              + {tag}
            </button>
          ))}
      </div>
    </div>
  );
};
