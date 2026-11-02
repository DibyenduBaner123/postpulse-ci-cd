import React from 'react';
import { Calendar, Clock, PlayCircle, XCircle } from 'lucide-react';
import { Post } from '../../types';
import { PlatformBadge } from '../common/Badge';
import { useAppDispatch, useAppSelector } from '../../store';
import { publishPostNow } from '../../store/slices/postSlice';
import { addToast } from '../../store/slices/notificationSlice';

interface UpcomingQueueProps {
  posts: Post[];
  onOpenCalendar: () => void;
}

export const UpcomingQueue: React.FC<UpcomingQueueProps> = ({ posts, onOpenCalendar }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const scheduledPosts = posts.filter((p) => p.status === 'SCHEDULED').slice(0, 4);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EDITOR';

  const handleInstantPublish = async (post: Post) => {
    try {
      await dispatch(publishPostNow(post.id)).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Post Published Successfully',
          message: `Post ${post.id} was syndicated across ${post.platforms.join(', ')} via simulated Kafka pipeline.`,
        })
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Publishing Error',
          message: err || 'Failed to publish post',
        })
      );
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Upcoming Scheduled Queue</h3>
          </div>
          <button
            onClick={onOpenCalendar}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Open Calendar</span>
          </button>
        </div>

        {scheduledPosts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">No scheduled posts queued.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.platforms.map((plat) => (
                      <PlatformBadge key={plat} platform={plat} size="sm" />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {post.scheduledTime ? new Date(post.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{post.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400">By {post.authorName}</span>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInstantPublish(post)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                        title="Simulate immediate publication"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Publish Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
        <span>Timezone: UTC</span>
        <span>Kafka Consumer: Listening</span>
      </div>
    </div>
  );
};
