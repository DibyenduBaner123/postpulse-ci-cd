import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchCalendarEvents,
  rescheduleCalendarEvent,
  cancelCalendarEvent,
  setViewMode,
  setSelectedDate,
  setCalendarPlatformFilter,
  setCalendarStatusFilter,
  setTimezone,
  setSelectedEvent,
} from '../../store/slices/calendarSlice';
import { publishPostNow } from '../../store/slices/postSlice';
import { addToast } from '../../store/slices/notificationSlice';
import { CalendarEventItem, SocialPlatformId, PostStatus } from '../../types';
import { PlatformBadge, StatusBadge } from '../common/Badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Plus,
  PlayCircle,
  XCircle,
  Edit,
  Layers,
  X,
} from 'lucide-react';

interface ContentCalendarProps {
  onScheduleNew: () => void;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ onScheduleNew }) => {
  const dispatch = useAppDispatch();
  const {
    events,
    viewMode,
    selectedDate,
    platformFilter,
    statusFilter,
    timezone,
    isLoading,
    selectedEvent,
  } = useAppSelector((state) => state.calendar);
  const { user } = useAppSelector((state) => state.auth);

  const [rescheduleModalEvent, setRescheduleModalEvent] = useState<CalendarEventItem | null>(null);
  const [newTargetDate, setNewTargetDate] = useState('');

  // Drag and drop state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCalendarEvents());
  }, [dispatch, platformFilter, statusFilter]);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EDITOR';

  // Current calendar view base date
  const currentDateObj = new Date(selectedDate);
  const currentYear = currentDateObj.getFullYear();
  const currentMonth = currentDateObj.getMonth();

  const handlePrev = () => {
    const d = new Date(currentDateObj);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    dispatch(setSelectedDate(d.toISOString().split('T')[0]));
  };

  const handleNext = () => {
    const d = new Date(currentDateObj);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    dispatch(setSelectedDate(d.toISOString().split('T')[0]));
  };

  const handleToday = () => {
    dispatch(setSelectedDate(new Date().toISOString().split('T')[0]));
  };

  // Month grid day generator
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = new Date(currentYear, currentMonth - 1, d).toISOString().split('T')[0];
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to reach multiple of 7
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = new Date(currentYear, currentMonth + 1, d).toISOString().split('T')[0];
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (!eventId) return;

    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    // Retain original time but change date
    const origTime = new Date(event.start).toTimeString().slice(0, 8);
    const newScheduledIso = `${targetDateStr}T${origTime}Z`;

    try {
      await dispatch(
        rescheduleCalendarEvent({ id: event.id, scheduledTime: newScheduledIso })
      ).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Rescheduled Post',
          message: `Post ${event.id} rescheduled to ${targetDateStr} via Kafka event stream.`,
        })
      );
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to reschedule' }));
    } finally {
      setDraggedEventId(null);
    }
  };

  // Instant Publish action
  const handleInstantPublish = async (id: string) => {
    try {
      await dispatch(publishPostNow(id)).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Post Published',
          message: 'Post was immediately published to all designated channels.',
        })
      );
      dispatch(fetchCalendarEvents());
      dispatch(setSelectedEvent(null));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to publish post' }));
    }
  };

  // Cancel action
  const handleCancelEvent = async (id: string) => {
    try {
      await dispatch(cancelCalendarEvent(id)).unwrap();
      dispatch(addToast({ type: 'info', message: 'Scheduled event cancelled' }));
      dispatch(setSelectedEvent(null));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to cancel event' }));
    }
  };

  // Manual Reschedule submit
  const handleManualReschedule = async () => {
    if (!rescheduleModalEvent || !newTargetDate) return;
    try {
      await dispatch(
        rescheduleCalendarEvent({
          id: rescheduleModalEvent.id,
          scheduledTime: new Date(newTargetDate).toISOString(),
        })
      ).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Post Rescheduled',
          message: `Scheduled time updated to ${new Date(newTargetDate).toLocaleString()}.`,
        })
      );
      setRescheduleModalEvent(null);
      dispatch(setSelectedEvent(null));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to reschedule' }));
    }
  };

  const daysGrid = getDaysInMonth();
  const monthName = currentDateObj.toLocaleString([], { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Month Title & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 capitalize w-48 font-mono">{monthName}</h2>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            Today
          </button>
        </div>

        {/* Center: View Mode Switcher (Month, Week, Day, List) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['month', 'week', 'day', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => dispatch(setViewMode(mode))}
              className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-all ${
                viewMode === mode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Right: Filters & Schedule Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => dispatch(setCalendarPlatformFilter(e.target.value as any))}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Platforms</option>
            <option value="twitter">X (Twitter)</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => dispatch(setCalendarStatusFilter(e.target.value as any))}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Timezone Selector */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timezone}
              onChange={(e) => dispatch(setTimezone(e.target.value))}
              className="bg-transparent text-xs text-slate-700 font-mono focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">EST (New York)</option>
              <option value="Europe/London">GMT (London)</option>
              <option value="Asia/Kolkata">IST (Kolkata)</option>
              <option value="Asia/Tokyo">JST (Tokyo)</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={onScheduleNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Calendar Grid View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5 font-mono">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
            {daysGrid.map((day, idx) => {
              const dayEvents = events.filter((e) => {
                const eventDate = e.start.split('T')[0];
                return eventDate === day.dateStr;
              });

              const isToday = day.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnDate(e, day.dateStr)}
                  className={`p-2 flex flex-col justify-between transition-colors min-h-[110px] ${
                    day.isCurrentMonth ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 text-slate-400'
                  } ${isToday ? 'ring-1 ring-inset ring-indigo-500 bg-indigo-50/10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {dayEvents.length} post{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        draggable={canManage}
                        onDragStart={(e) => handleDragStart(e, ev.id)}
                        onClick={() => dispatch(setSelectedEvent(ev))}
                        className={`p-1.5 rounded border text-[11px] cursor-pointer transition-all select-none hover:shadow-xs ${
                          ev.status === 'PUBLISHED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : ev.status === 'SCHEDULED'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                        title="Click to view details or drag to reschedule date"
                      >
                        <div className="flex items-center gap-1 font-mono text-[9px] mb-0.5">
                          <span className="font-semibold uppercase">{ev.platforms.join(', ')}</span>
                          <span>·</span>
                          <span>
                            {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="line-clamp-1 font-medium">{ev.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List / Agenda View */}
      {(viewMode === 'list' || viewMode === 'week' || viewMode === 'day') && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span>Scheduled & Broadcast Events Queue</span>
            <span className="font-mono text-slate-500 font-medium">{events.length} total events</span>
          </div>

          {events.length === 0 ? (
            <p className="p-8 text-xs text-slate-400 text-center">No calendar events found for the active filter.</p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={ev.status} size="sm" />
                    {ev.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(ev.start).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{ev.content}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Author: {ev.authorName}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManage && ev.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => handleInstantPublish(ev.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Publish Now</span>
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleModalEvent(ev);
                          setNewTargetDate(new Date(ev.start).toISOString().slice(0, 16));
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => dispatch(setSelectedEvent(ev))}
                    className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Details Drawer/Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedEvent.status} />
                <span className="text-xs font-mono text-slate-400">ID: {selectedEvent.id}</span>
              </div>
              <button
                onClick={() => dispatch(setSelectedEvent(null))}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Channels</label>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedEvent.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} size="md" />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Publication Content</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                {selectedEvent.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">TIMESTAMP</span>
                <span className="font-semibold">{new Date(selectedEvent.start).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CREATOR</span>
                <span className="font-semibold">{selectedEvent.authorName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {canManage && selectedEvent.status === 'SCHEDULED' ? (
                <>
                  <button
                    onClick={() => handleCancelEvent(selectedEvent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Schedule</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRescheduleModalEvent(selectedEvent);
                        setNewTargetDate(new Date(selectedEvent.start).toISOString().slice(0, 16));
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleInstantPublish(selectedEvent.id)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      Publish Now
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => dispatch(setSelectedEvent(null))}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reschedule Post</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select a new date and time for automated cross-platform publication.
            </p>
            <input
              type="datetime-local"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleModalEvent(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualReschedule}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
