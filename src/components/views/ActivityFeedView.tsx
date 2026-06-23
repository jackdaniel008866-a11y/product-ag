import { useState, useMemo } from 'react';
import type { Initiative, Product } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { Activity, ArrowRight, Calendar, MessageSquare, Search, Clock } from 'lucide-react';

interface ActivityFeedViewProps {
  initiatives: Initiative[];
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'stage_change' | 'target_date_change' | 'comment' | 'created';
  initiativeId: string;
  initiativeTitle: string;
  product: Product;
  detail: string;
  subDetail?: string;
  authorName?: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = parseISO(dateStr);
  const mins = differenceInMinutes(now, date);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return format(date, 'MMM d');
}

export default function ActivityFeedView({ initiatives }: ActivityFeedViewProps) {
  const { users } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const events: ActivityEvent[] = useMemo(() => {
    const all: ActivityEvent[] = [];

    initiatives.forEach(init => {
      // Stage transitions
      if (init.stageHistory && init.stageHistory.length > 1) {
        for (let i = 1; i < init.stageHistory.length; i++) {
          const prev = init.stageHistory[i - 1];
          const curr = init.stageHistory[i];
          const author = curr.changedBy ? Object.values(users).find(u => u.id === curr.changedBy) : undefined;
          all.push({
            id: `${init.id}-stage-${i}`,
            timestamp: curr.enteredAt,
            type: 'stage_change',
            initiativeId: init.id,
            initiativeTitle: init.title,
            product: init.product,
            detail: `${prev.stage} → ${curr.stage}`,
            subDetail: `Moved from ${prev.stage} to ${curr.stage}`,
            authorName: author?.name,
          });
        }
      }

      // Target date changes
      if (init.targetDateHistory && init.targetDateHistory.length > 0) {
        init.targetDateHistory.forEach((entry, idx) => {
          const prevDate = idx > 0 ? init.targetDateHistory![idx - 1].date : null;
          const author = entry.changedBy ? Object.values(users).find(u => u.id === entry.changedBy) : undefined;
          all.push({
            id: `${init.id}-target-${idx}`,
            timestamp: entry.setAt,
            type: 'target_date_change',
            initiativeId: init.id,
            initiativeTitle: init.title,
            product: init.product,
            detail: prevDate
              ? `${format(parseISO(prevDate), 'MMM d')} → ${format(parseISO(entry.date), 'MMM d, yyyy')}`
              : `Set to ${format(parseISO(entry.date), 'MMM d, yyyy')}`,
            subDetail: prevDate ? 'Target date changed' : 'Target date set',
            authorName: author?.name,
          });
        });
      }

      // Comments (non-system only)
      if (init.comments && init.comments.length > 0) {
        init.comments.filter(c => !c.isSystem).forEach(comment => {
          const author = Object.values(users).find(u => u.id === comment.authorId);
          all.push({
            id: `${init.id}-comment-${comment.id}`,
            timestamp: comment.createdAt,
            type: 'comment',
            initiativeId: init.id,
            initiativeTitle: init.title,
            product: init.product,
            detail: comment.text.length > 120 ? comment.text.substring(0, 120) + '…' : comment.text,
            authorName: author?.name || 'Someone',
          });
        });
      }

      // Creation event
      const createdBy = (init.stageHistory && init.stageHistory.length > 0 && init.stageHistory[0]?.changedBy) ? Object.values(users).find(u => u.id === init.stageHistory![0].changedBy) : undefined;
      all.push({
        id: `${init.id}-created`,
        timestamp: init.createdAt,
        type: 'created',
        initiativeId: init.id,
        initiativeTitle: init.title,
        product: init.product,
        detail: `New ${init.type} created in ${init.stage}`,
        subDetail: init.product,
        authorName: createdBy?.name,
      });
    });

    // Sort by timestamp descending
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return all;
  }, [initiatives, users]);

  const filteredEvents = events.filter(event => {
    if (productFilter !== 'All' && event.product !== productFilter) return false;
    if (typeFilter !== 'All' && event.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !event.initiativeTitle.toLowerCase().includes(q) &&
        !event.detail.toLowerCase().includes(q) &&
        !(event.authorName || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'stage_change': return <ArrowRight size={16} />;
      case 'target_date_change': return <Calendar size={16} />;
      case 'comment': return <MessageSquare size={16} />;
      case 'created': return <Activity size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'stage_change': return 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      case 'target_date_change': return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'comment': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'created': return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getProductBadge = (product: Product) => {
    const colors: Record<Product, string> = {
      'Surbo': 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/50',
      'Surbo Chat': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
      'Surbo Ace': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
      'AI Voicebot': 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    };
    return colors[product] || '';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stage_change': return 'Phase Change';
      case 'target_date_change': return 'Date Changed';
      case 'comment': return 'Comment';
      case 'created': return 'Created';
      default: return type;
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, ActivityEvent[]> = {};
    filteredEvents.forEach(event => {
      const dateKey = format(parseISO(event.timestamp), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const dateKeys = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  const getDateLabel = (dateKey: string): string => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (dateKey === today) return 'Today';
    if (dateKey === yesterday) return 'Yesterday';
    return format(parseISO(dateKey), 'EEEE, MMM d, yyyy');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 md:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity size={20} className="text-teal-500" />
            Activity Feed
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Everything that happened across your initiatives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors dark:text-slate-200 w-40 md:w-48"
            />
          </div>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Products</option>
            <option value="Surbo">Surbo</option>
            <option value="Surbo Chat">Surbo Chat</option>
            <option value="Surbo Ace">Surbo Ace</option>
            <option value="AI Voicebot">AI Voicebot</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="stage_change">Phase Changes</option>
            <option value="target_date_change">Date Changes</option>
            <option value="comment">Comments</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1120] p-4 md:p-6 transition-colors custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          {dateKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <Activity size={48} className="opacity-20 mb-4" />
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">No activity found</p>
              <p className="text-sm mt-1">Try changing your filters or add some initiatives.</p>
            </div>
          ) : (
            dateKeys.map(dateKey => (
              <div key={dateKey} className="mb-8">
                {/* Date Header */}
                <div className="sticky top-0 z-10 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 shadow-sm">
                      <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getDateLabel(dateKey)}</span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {groupedEvents[dateKey].length}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-3">
                  {groupedEvents[dateKey].map(event => (
                    <div
                      key={event.id}
                      className="flex gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEventColor(event.type)}`}>
                            {getTypeLabel(event.type)}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${getProductBadge(event.product)}`}>
                            {event.product}
                          </span>
                        </div>

                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {event.initiativeTitle}
                        </h4>

                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {event.authorName && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{event.authorName}: </span>
                          )}
                          {event.detail}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">
                        {timeAgo(event.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
