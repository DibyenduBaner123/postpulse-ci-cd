import React, { useState, useEffect, useRef } from 'react';
import { SocialPlatformId, MediaAsset, Post } from '../../types';
import { PlatformSelector, PLATFORMS_META } from './PlatformSelector';
import { CharacterCounter } from './CharacterCounter';
import { MediaUploader } from './MediaUploader';
import { HashtagInput } from './HashtagInput';
import { PostPreview } from './PostPreview';
import { useAppDispatch, useAppSelector } from '../../store';
import { createNewPost } from '../../store/slices/postSlice';
import { autoSaveDraftThunk, saveNewDraft } from '../../store/slices/draftSlice';
import { addToast } from '../../store/slices/notificationSlice';
import {
  Send,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Link as LinkIcon,
  X,
} from 'lucide-react';

interface PostComposerProps {
  initialDraft?: Partial<Post>;
  onPostSuccess?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ initialDraft, onPostSuccess }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { autoSaveStatus, lastSavedAt } = useAppSelector((state) => state.drafts);

  // Form states
  const [content, setContent] = useState(initialDraft?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatformId[]>(
    initialDraft?.platforms && initialDraft.platforms.length > 0
      ? initialDraft.platforms
      : ['twitter', 'linkedin']
  );
  const [media, setMedia] = useState<MediaAsset[]>(initialDraft?.media || []);
  const [hashtags, setHashtags] = useState<string[]>(initialDraft?.hashtags || ['#Tech', '#SaaS']);
  const [links, setLinks] = useState<string[]>(initialDraft?.links || []);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDraftIdRef = useRef<string | undefined>(initialDraft?.id);

  useEffect(() => {
    if (!content.trim()) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      dispatch(
        autoSaveDraftThunk({
          id: currentDraftIdRef.current,
          data: {
            content,
            platforms: selectedPlatforms,
            media,
            hashtags,
            links,
          },
        })
      ).then((action: any) => {
        if (action.payload?.id) {
          currentDraftIdRef.current = action.payload.id;
        }
      });
    }, 2500); // Autosave after 2.5s of inactivity

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, selectedPlatforms, media, hashtags, links, dispatch]);

  const togglePlatform = (id: SocialPlatformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleAddLink = () => {
    let clean = newLinkInput.trim();
    if (!clean) return;
    if (!clean.startsWith('http')) clean = `https://${clean}`;
    if (!links.includes(clean)) {
      setLinks([...links, clean]);
      setNewLinkInput('');
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setLinks(links.filter((l) => l !== linkToRemove));
  };

  // Validation Engine
  const validateForm = () => {
    const errors: string[] = [];

    if (!content.trim()) {
      errors.push('Post content is required.');
    }

    if (selectedPlatforms.length === 0) {
      errors.push('Please select at least one social destination platform.');
    }

    selectedPlatforms.forEach((pId) => {
      const meta = PLATFORMS_META.find((m) => m.id === pId);
      if (meta && content.length > meta.charLimit) {
        errors.push(`${meta.name}: Content length exceeds limit (${content.length}/${meta.charLimit}).`);
      }
      if (pId === 'instagram' && media.length === 0) {
        errors.push('Instagram: Requires at least one attached image or video.');
      }
    });

    return errors;
  };

  const validationErrors = validateForm();
  const isValid = validationErrors.length === 0;

  // Handle Manual Save Draft
  const handleSaveDraft = async () => {
    try {
      await dispatch(
        saveNewDraft({
          content,
          platforms: selectedPlatforms,
          media,
          hashtags,
          links,
        })
      ).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Draft Saved',
          message: 'Post draft successfully persisted to database.',
        })
      );
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to save draft' }));
    }
  };

  // Handle Publish Now
  const handlePublishNow = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        createNewPost({
          content,
          platforms: selectedPlatforms,
          media,
          hashtags,
          links,
          status: 'PUBLISHED',
        })
      ).unwrap();

      dispatch(
        addToast({
          type: 'success',
          title: 'Post Published',
          message: `Dispatched to ${selectedPlatforms.join(', ')} and broadcast via Kafka topic 'post-published'.`,
        })
      );

      // Reset form
      setContent('');
      setMedia([]);
      setLinks([]);
      onPostSuccess?.();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Publishing Failed', message: err || 'Publish failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Schedule Post
  const handleConfirmSchedule = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        createNewPost({
          content,
          platforms: selectedPlatforms,
          media,
          hashtags,
          links,
          status: 'SCHEDULED',
          scheduledTime: new Date(scheduledDate).toISOString(),
        })
      ).unwrap();

      dispatch(
        addToast({
          type: 'success',
          title: 'Post Scheduled',
          message: `Post scheduled for ${new Date(scheduledDate).toLocaleString()} via Kafka topic 'post-scheduled'.`,
        })
      );

      setShowScheduleModal(false);
      setContent('');
      setMedia([]);
      setLinks([]);
      onPostSuccess?.();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Schedule Failed', message: err || 'Schedule failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Left Column: Form & Inputs */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 space-y-6">
        {/* Autosave Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Compose New Social Broadcast</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>Auto-saving draft...</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Saved {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                </span>
              </span>
            )}
            {autoSaveStatus === 'idle' && <span>Autosave active</span>}
          </div>
        </div>

        {/* 1. Target Platforms */}
        <PlatformSelector selectedPlatforms={selectedPlatforms} onTogglePlatform={togglePlatform} />

        {/* 2. Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Post Copy</label>
            <CharacterCounter contentLength={content.length} selectedPlatforms={selectedPlatforms} />
          </div>

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to share across your channels? (e.g. Announcing PostPulse 3.0 with Kafka event reliability...)"
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed transition-all"
          />
        </div>

        {/* 3. Media Uploader */}
        <MediaUploader media={media} onChange={setMedia} maxCount={4} />

        {/* 4. Hashtag Chips Input */}
        <HashtagInput hashtags={hashtags} onChange={setHashtags} maxTags={15} />

        {/* 5. External Links Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Web Links</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://postpulse.io/announcements"
              value={newLinkInput}
              onChange={(e) => setNewLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              Add Link
            </button>
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map((link) => (
                <span
                  key={link}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono"
                >
                  <span className="truncate max-w-[200px]">{link}</span>
                  <button type="button" onClick={() => handleRemoveLink(link)} className="text-slate-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 6. Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Platform Validation Issues:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5 pl-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save to Drafts</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={!isValid || isSubmitting}
              onClick={() => setShowScheduleModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Post</span>
            </button>

            <button
              type="button"
              disabled={!isValid || isSubmitting}
              onClick={handlePublishNow}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Platform Previews */}
      <div className="lg:col-span-5 flex flex-col">
        <PostPreview
          content={content}
          media={media}
          hashtags={hashtags}
          links={links}
          selectedPlatforms={selectedPlatforms}
        />
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Schedule Publication</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Choose the target timestamp for automated dispatch. Post will be enqueued in Kafka and delivered synchronously to{' '}
              <strong className="text-slate-900">{selectedPlatforms.join(', ')}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Scheduled Date & Time (UTC)</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
              >
                {isSubmitting ? 'Enqueuing...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
