import React, { useState } from 'react';
import { SocialPlatformId, MediaAsset } from '../../types';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  CheckCircle,
} from 'lucide-react';

interface PostPreviewProps {
  content: string;
  media: MediaAsset[];
  hashtags: string[];
  links: string[];
  selectedPlatforms: SocialPlatformId[];
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  content,
  media,
  hashtags,
  links,
  selectedPlatforms,
}) => {
  const activePlatforms = selectedPlatforms.length > 0 ? selectedPlatforms : (['twitter'] as SocialPlatformId[]);
  const [activePreviewTab, setActivePreviewTab] = useState<SocialPlatformId>(activePlatforms[0]);

  const currentTab = activePlatforms.includes(activePreviewTab) ? activePreviewTab : activePlatforms[0];

  const fullContent = [content, hashtags.join(' '), links.join(' ')].filter(Boolean).join('\n\n');

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
      {/* Platform Preview Selector Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Preview</span>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
          {activePlatforms.map((plat) => (
            <button
              type="button"
              key={plat}
              onClick={() => setActivePreviewTab(plat)}
              className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-all ${
                currentTab === plat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center p-2">
        {currentTab === 'twitter' && (
          <TwitterPreview content={fullContent} media={media} />
        )}
        {currentTab === 'instagram' && (
          <InstagramPreview content={content} hashtags={hashtags} media={media} />
        )}
        {currentTab === 'linkedin' && (
          <LinkedInPreview content={fullContent} media={media} />
        )}
        {currentTab === 'facebook' && (
          <FacebookPreview content={fullContent} media={media} />
        )}
        {currentTab === 'youtube' && (
          <YouTubePreview content={fullContent} media={media} />
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 mt-4 text-[11px] text-slate-400 text-center font-mono">
        Showing real-time client preview for {currentTab.toUpperCase()}
      </div>
    </div>
  );
};

// 1. Twitter / X Preview Card
const TwitterPreview: React.FC<{ content: string; media: MediaAsset[] }> = ({ content, media }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md w-full shadow-xs text-slate-900">
    <div className="flex items-start gap-3">
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80"
        alt="PostPulse"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 truncate">
            <span className="font-bold text-sm text-slate-900">PostPulse HQ</span>
            <CheckCircle className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
            <span className="text-xs text-slate-500 font-mono">@postpulse_hq</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">now</span>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        <p className="text-sm text-slate-800 whitespace-pre-wrap mt-1 leading-relaxed">
          {content || 'Start drafting your post to see the live Twitter/X preview...'}
        </p>

        {media.length > 0 && (
          <div className={`mt-3 rounded-xl overflow-hidden border border-slate-200 grid gap-1 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {media.map((m) => (
              <img key={m.id} src={m.url} alt={m.name} className="w-full h-44 object-cover" />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-slate-500 text-xs mt-3 pt-2 border-t border-slate-100 max-w-xs">
          <span className="flex items-center gap-1 hover:text-sky-500"><MessageCircle className="w-3.5 h-3.5" /> 18</span>
          <span className="flex items-center gap-1 hover:text-emerald-500"><Repeat2 className="w-3.5 h-3.5" /> 42</span>
          <span className="flex items-center gap-1 hover:text-rose-500"><Heart className="w-3.5 h-3.5" /> 189</span>
          <span className="flex items-center gap-1 hover:text-sky-500"><Share className="w-3.5 h-3.5" /></span>
        </div>
      </div>
    </div>
  </div>
);

// 2. Instagram Feed Card Preview
const InstagramPreview: React.FC<{ content: string; hashtags: string[]; media: MediaAsset[] }> = ({
  content,
  hashtags,
  media,
}) => (
  <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full overflow-hidden shadow-xs text-slate-900">
    {/* Instagram Header */}
    <div className="flex items-center justify-between p-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
          <img
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=100&h=100&q=80"
            alt="Instagram Account"
            className="w-full h-full rounded-full object-cover border border-white"
          />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-900 block leading-tight">postpulse.app</span>
          <span className="text-[10px] text-slate-400 block leading-tight">Sponsored</span>
        </div>
      </div>
      <MoreHorizontal className="w-4 h-4 text-slate-400" />
    </div>

    {/* Media Viewport */}
    <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
      {media.length > 0 ? (
        <img src={media[0].url} alt="Attached" className="w-full h-full object-cover" />
      ) : (
        <div className="text-center p-4">
          <p className="text-xs text-rose-500 font-semibold">Media asset required for Instagram!</p>
          <p className="text-[10px] text-slate-400 mt-1">Attach an image to validate post.</p>
        </div>
      )}
    </div>

    {/* Instagram Actions */}
    <div className="p-3">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3 text-slate-800">
          <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer" />
          <MessageCircle className="w-5 h-5 cursor-pointer" />
          <Send className="w-5 h-5 cursor-pointer" />
        </div>
        <Bookmark className="w-5 h-5 text-slate-800 cursor-pointer" />
      </div>

      <p className="text-xs font-bold text-slate-900">1,248 likes</p>
      <div className="text-xs text-slate-800 mt-1 leading-relaxed">
        <span className="font-bold mr-1.5">postpulse.app</span>
        <span>{content || 'Your Instagram caption will appear here...'}</span>
      </div>

      {hashtags.length > 0 && (
        <p className="text-xs text-indigo-600 font-medium mt-1.5 space-x-1">
          {hashtags.map((h, i) => (
            <span key={i}>{h}</span>
          ))}
        </p>
      )}

      <span className="text-[10px] text-slate-400 uppercase mt-2 block font-medium">Just now</span>
    </div>
  </div>
);

// 3. LinkedIn Professional Update Preview
const LinkedInPreview: React.FC<{ content: string; media: MediaAsset[] }> = ({ content, media }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md w-full shadow-xs text-slate-900">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <img
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=100&h=100&q=80"
          alt="LinkedIn Account"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <span className="text-xs font-bold text-slate-900 block leading-tight">PostPulse Technologies</span>
          <span className="text-[11px] text-slate-500 block leading-tight">34,100 followers · Promoted</span>
        </div>
      </div>
      <MoreHorizontal className="w-4 h-4 text-slate-400" />
    </div>

    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mb-3">
      {content || 'LinkedIn professional update preview text...'}
    </p>

    {media.length > 0 && (
      <div className="rounded-lg overflow-hidden border border-slate-200 mb-3">
        <img src={media[0].url} alt="Attached" className="w-full h-48 object-cover" />
      </div>
    )}

    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 font-semibold">
      <button className="flex items-center gap-1.5 hover:text-sky-700 py-1"><ThumbsUp className="w-4 h-4" /> Like</button>
      <button className="flex items-center gap-1.5 hover:text-sky-700 py-1"><MessageSquare className="w-4 h-4" /> Comment</button>
      <button className="flex items-center gap-1.5 hover:text-sky-700 py-1"><Repeat2 className="w-4 h-4" /> Repost</button>
      <button className="flex items-center gap-1.5 hover:text-sky-700 py-1"><Send className="w-4 h-4" /> Send</button>
    </div>
  </div>
);

// 4. Facebook Preview
const FacebookPreview: React.FC<{ content: string; media: MediaAsset[] }> = ({ content, media }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md w-full shadow-xs text-slate-900">
    <div className="flex items-center gap-2.5 mb-2.5">
      <img
        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=100&h=100&q=80"
        alt="Facebook Account"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <span className="text-xs font-bold text-slate-900 block leading-tight">PostPulse Systems</span>
        <span className="text-[10px] text-slate-400 block leading-tight">Just now · 🌐</span>
      </div>
    </div>
    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mb-3">
      {content || 'Facebook page post preview...'}
    </p>
    {media.length > 0 && (
      <img src={media[0].url} alt="Attached" className="w-full h-48 object-cover rounded-lg mb-2" />
    )}
  </div>
);

// 5. YouTube Community Post Preview
const YouTubePreview: React.FC<{ content: string; media: MediaAsset[] }> = ({ content, media }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md w-full shadow-xs text-slate-900">
    <div className="flex items-center gap-2.5 mb-2.5">
      <img
        src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&h=100&q=80"
        alt="YouTube Channel"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <span className="text-xs font-bold text-slate-900 block leading-tight">PostPulse Engineering</span>
        <span className="text-[10px] text-slate-400 block leading-tight">15.3K subscribers · Community Post</span>
      </div>
    </div>
    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mb-3">
      {content || 'YouTube community post text...'}
    </p>
    {media.length > 0 && (
      <img src={media[0].url} alt="Attached" className="w-full h-48 object-cover rounded-lg mb-2" />
    )}
  </div>
);
