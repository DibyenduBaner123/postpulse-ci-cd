import React, { useState } from 'react';
import { SocialPlatform, PLATFORM_CONFIGS, Post } from '../types/index.ts';
import { countCharacters, calculateRemainingChars } from '../utils/characterCount.ts';
import { validatePost, validateMediaFile } from '../utils/postValidator.ts';
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Image as ImageIcon,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

interface PostComposerProps {
  onPostCreated?: (newPost: Post) => void;
  authToken?: string | null;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, authToken }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['twitter', 'linkedin']);
  const [baseText, setBaseText] = useState('');
  const [customTextPerPlatform, setCustomTextPerPlatform] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [isCustomizingPerPlatform, setIsCustomizingPerPlatform] = useState(false);
  const [activeTabPlatform, setActiveTabPlatform] = useState<SocialPlatform>('twitter');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev; // Keep at least one platform
        return prev.filter((item) => item !== p);
      } else {
        return [...prev, p];
      }
    });
  };

  const getPlatformIcon = (platform: SocialPlatform, className = 'w-4 h-4') => {
    switch (platform) {
      case 'twitter':
        return <Twitter className={className} />;
      case 'linkedin':
        return <Linkedin className={className} />;
      case 'facebook':
        return <Facebook className={className} />;
      case 'instagram':
        return <Instagram className={className} />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      setValidationErrors([validation.error || 'Invalid media file.']);
      return;
    }

    // Convert file to local preview object URL
    const previewUrl = URL.createObjectURL(file);
    setMediaUrls((prev) => [...prev, previewUrl]);
    setValidationErrors([]);
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addSampleImage = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    if (!mediaUrls.includes(randomImg)) {
      setMediaUrls((prev) => [...prev, randomImg]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setValidationErrors([]);

    // Construct platform customizations
    const customizations: Partial<Record<SocialPlatform, { text?: string }>> = {};
    if (isCustomizingPerPlatform) {
      selectedPlatforms.forEach((p) => {
        if (customTextPerPlatform[p]) {
          customizations[p] = { text: customTextPerPlatform[p] };
        }
      });
    }

    const payload = {
      text: baseText,
      platforms: selectedPlatforms,
      mediaUrls,
      platformCustomizations: customizations,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    // Client-side validation check
    const validation = validatePost(payload);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map((err) => `${err.platform ? `[${err.platform.toUpperCase()}] ` : ''}${err.message}`));
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setValidationErrors([data.error || 'Failed to create post.']);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(scheduledAt ? 'Post scheduled successfully!' : 'Post published to all platforms successfully!');
      setBaseText('');
      setCustomTextPerPlatform({});
      setMediaUrls([]);
      setScheduledAt('');
      if (onPostCreated) {
        onPostCreated(data);
      }
    } catch (err: any) {
      setValidationErrors(['Network error connecting to API server.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span>Compose Post</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Multi-Platform
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Write once, validate against Twitter, LinkedIn, Facebook, and Instagram constraints simultaneously.
          </p>
        </div>

        {/* Platform selection pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['twitter', 'linkedin', 'facebook', 'instagram'] as SocialPlatform[]).map((p) => {
            const isSelected = selectedPlatforms.includes(p);
            const cfg = PLATFORM_CONFIGS[p];
            return (
              <button
                key={p}
                type="button"
                data-testid={`platform-toggle-${p}`}
                onClick={() => togglePlatform(p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? `${cfg.badgeClass} ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900 shadow-sm`
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
                title={cfg.tagline}
              >
                {getPlatformIcon(p, 'w-3.5 h-3.5')}
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Validation Errors banner */}
        {validationErrors.length > 0 && (
          <div
            data-testid="validation-error-banner"
            className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-1"
          >
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Validation Issues Detected:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success toast */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Customization mode toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {isCustomizingPerPlatform ? 'Platform-Specific Content' : 'Post Content'}
          </label>
          <button
            type="button"
            onClick={() => setIsCustomizingPerPlatform(!isCustomizingPerPlatform)}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isCustomizingPerPlatform ? 'Use single shared post' : 'Customize per platform'}</span>
          </button>
        </div>

        {/* Sub-tabs if customizing per platform */}
        {isCustomizingPerPlatform && (
          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {selectedPlatforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActiveTabPlatform(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                  activeTabPlatform === p
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {getPlatformIcon(p, 'w-3 h-3')}
                <span>{PLATFORM_CONFIGS[p].name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            data-testid="composer-textarea"
            rows={5}
            value={
              isCustomizingPerPlatform
                ? customTextPerPlatform[activeTabPlatform] ?? baseText
                : baseText
            }
            onChange={(e) => {
              if (isCustomizingPerPlatform) {
                setCustomTextPerPlatform({
                  ...customTextPerPlatform,
                  [activeTabPlatform]: e.target.value,
                });
              } else {
                setBaseText(e.target.value);
              }
            }}
            placeholder="Share an update across Twitter, LinkedIn, Facebook, and Instagram..."
            className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* Platform character counter gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {selectedPlatforms.map((p) => {
            const cfg = PLATFORM_CONFIGS[p];
            const currentText =
              isCustomizingPerPlatform && customTextPerPlatform[p] !== undefined
                ? customTextPerPlatform[p] || ''
                : baseText;
            const charCount = countCharacters(currentText, p);
            const remaining = calculateRemainingChars(currentText, cfg.charLimit, p);
            const isOver = remaining < 0;
            const percentUsed = Math.min(100, Math.round((charCount / cfg.charLimit) * 100));

            return (
              <div
                key={p}
                data-testid={`counter-${p}`}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isOver
                    ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-semibold">
                    {getPlatformIcon(p, 'w-3 h-3')}
                    <span className="truncate">{cfg.name}</span>
                  </div>
                  <span className={`font-mono font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                    {remaining}
                  </span>
                </div>
                {/* Visual progress bar */}
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOver ? 'bg-rose-600' : percentUsed > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>{charCount} / {cfg.charLimit}</span>
                  {cfg.requiresMedia && mediaUrls.length === 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Req Image</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Media attachments */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-zinc-500" />
              <span>Media Attachments ({mediaUrls.length})</span>
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer">
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={addSampleImage}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                + Add Sample Photo
              </button>
            </div>
          </div>

          {mediaUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {mediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                >
                  <img src={url} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 opacity-90 transition-opacity cursor-pointer"
                    title="Remove media"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule & Submit Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
              title="Optionally schedule post for future release"
            />
            {scheduledAt && (
              <button
                type="button"
                onClick={() => setScheduledAt('')}
                className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="composer-submit-btn"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{scheduledAt ? 'Schedule Post' : 'Publish to All'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
