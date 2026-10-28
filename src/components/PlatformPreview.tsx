import React from 'react';
import { SocialPlatform, PLATFORM_CONFIGS } from '../types/index.ts';
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  ThumbsUp,
  MoreHorizontal,
} from 'lucide-react';

interface PlatformPreviewProps {
  platform: SocialPlatform;
  text: string;
  mediaUrls: string[];
  userName?: string;
}

export const PlatformPreview: React.FC<PlatformPreviewProps> = ({
  platform,
  text,
  mediaUrls,
  userName = 'DevOps Engineer',
}) => {
  const config = PLATFORM_CONFIGS[platform];
  const displayText = text.trim() || 'Your preview text will appear here as you type...';

  // Highlight hashtags in text
  const renderFormattedText = (raw: string) => {
    const parts = raw.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-blue-500 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (platform === 'twitter') {
    return (
      <div className="bg-black text-white rounded-2xl p-4 border border-zinc-800 shadow-sm text-xs font-sans max-w-md w-full mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-white truncate">{userName}</span>
                <span className="text-zinc-500">@{userName.toLowerCase().replace(/\s+/g, '')}</span>
                <span className="text-zinc-500">· 1m</span>
              </div>
              <Twitter className="w-4 h-4 text-zinc-400" />
            </div>

            <p className="mt-2 text-zinc-200 leading-relaxed whitespace-pre-wrap wrap-break-words text-[13px]">
              {renderFormattedText(displayText)}
            </p>

            {mediaUrls.length > 0 && (
              <div className="mt-3 rounded-xl overflow-hidden border border-zinc-800 max-h-56">
                <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-between text-zinc-500 mt-3 pt-2 border-t border-zinc-900 text-xs">
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">
                <MessageCircle className="w-3.5 h-3.5" /> 12
              </span>
              <span className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer">
                <Repeat2 className="w-3.5 h-3.5" /> 4
              </span>
              <span className="flex items-center gap-1 hover:text-rose-400 cursor-pointer">
                <Heart className="w-3.5 h-3.5" /> 48
              </span>
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">
                <Bookmark className="w-3.5 h-3.5" /> 5
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'linkedin') {
    return (
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs max-w-md w-full mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">
              {userName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                <span>{userName}</span>
                <span className="text-zinc-400 text-[10px]">· 1st</span>
              </div>
              <p className="text-[10px] text-zinc-500">DevOps & Cloud Engineer | CI/CD Architecture</p>
              <p className="text-[10px] text-zinc-400">Just now · 🌐</p>
            </div>
          </div>
          <Linkedin className="w-4 h-4 text-blue-600" />
        </div>

        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap wrap-break-words mb-3">
          {renderFormattedText(displayText)}
        </p>

        {mediaUrls.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-56 mb-3">
            <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around text-zinc-600 dark:text-zinc-400 text-xs">
          <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
            <ThumbsUp className="w-3.5 h-3.5" /> Like
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
            <MessageCircle className="w-3.5 h-3.5" /> Comment
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
            <Repeat2 className="w-3.5 h-3.5" /> Repost
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
            <Share2 className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    );
  }

  if (platform === 'instagram') {
    return (
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs max-w-md w-full mx-auto overflow-hidden">
        {/* Instagram header */}
        <div className="p-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-pink-600">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-[10px]">
                {userName.charAt(0)}
              </div>
            </div>
            <span className="font-semibold text-xs text-zinc-900 dark:text-white">
              {userName.toLowerCase().replace(/\s+/g, '_')}
            </span>
          </div>
          <Instagram className="w-4 h-4 text-pink-500" />
        </div>

        {/* Media or Placeholder */}
        <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
          {mediaUrls.length > 0 ? (
            <img src={mediaUrls[0]} alt="Instagram photo" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 text-zinc-400">
              <Instagram className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Photo/Video Required</p>
              <p className="text-[10px] mt-1 text-zinc-500">Instagram requires at least 1 image attachment</p>
            </div>
          )}
        </div>

        {/* IG actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500 hover:fill-rose-500 cursor-pointer" />
              <MessageCircle className="w-4 h-4 text-zinc-700 dark:text-zinc-300 cursor-pointer" />
              <Share2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 cursor-pointer" />
            </div>
            <Bookmark className="w-4 h-4 text-zinc-700 dark:text-zinc-300 cursor-pointer" />
          </div>

          <p className="text-[11px] font-semibold mb-1">284 likes</p>
          <div className="text-xs leading-relaxed">
            <span className="font-semibold mr-1.5">{userName.toLowerCase().replace(/\s+/g, '_')}</span>
            <span>{renderFormattedText(displayText)}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 uppercase">2 minutes ago</p>
        </div>
      </div>
    );
  }

  // Facebook
  return (
    <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">
            {userName.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">{userName}</h4>
            <span className="text-[10px] text-zinc-400">Just now · 👥 Public</span>
          </div>
        </div>
        <Facebook className="w-4 h-4 text-blue-600" />
      </div>

      <p className="text-xs leading-relaxed whitespace-pre-wrap wrap-break-words mb-3 text-zinc-800 dark:text-zinc-200">
        {renderFormattedText(displayText)}
      </p>

      {mediaUrls.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-56 mb-3">
          <img src={mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around text-zinc-600 dark:text-zinc-400 text-xs">
        <button className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <ThumbsUp className="w-3.5 h-3.5" /> Like
        </button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <MessageCircle className="w-3.5 h-3.5" /> Comment
        </button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );
};
