import type { Initiative } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { differenceInDays } from 'date-fns';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface InitiativeCardProps {
  initiative: Initiative;
  onClick?: () => void;
}

export default function InitiativeCard({ initiative, onClick }: InitiativeCardProps) {
  const { users } = useUsers();
  const daysInStage = differenceInDays(new Date(), new Date(initiative.stageUpdatedAt));
  const isStuck = daysInStage >= 7 && initiative.status !== 'Blocked' && initiative.status !== 'Done';
  const owner = users[initiative.ownerId];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('initiativeId', initiative.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      onClick={onClick}
      draggable={true}
      onDragStart={handleDragStart}
      className={clsx(
        "bg-white rounded-xl p-3 border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        initiative.status === 'Blocked' ? 'border-red-300' : 'border-slate-200'
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          {initiative.priority === 'High' && (
            <Zap size={14} className="text-red-500 fill-red-500" />
          )}
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {initiative.type}
          </span>
        </div>
        {initiative.product === 'Surbo' ? (
          <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 rounded-full border border-teal-100">Surbo</span>
        ) : (
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 rounded-full border border-blue-100">Surbo Chat</span>
        )}
      </div>

      <h4 className="font-semibold text-sm leading-snug mb-1 text-slate-800 line-clamp-2">
        {initiative.title}
      </h4>
      
      {initiative.status === 'Blocked' && initiative.blockerReason && (
        <div className="mt-2 mb-2 p-1.5 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-start">
          <AlertCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2 break-words leading-tight">{initiative.blockerReason}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Owner Avatar */}
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 border border-white shrink-0">
            {owner?.initials || '??'}
          </div>
          <div className="flex space-x-1">
            {initiative.tags?.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] text-slate-500 truncate max-w-[60px]">{tag}</span>
            ))}
            {(initiative.tags?.length || 0) > 1 && <span className="text-[10px] text-slate-400">+{initiative.tags!.length - 1}</span>}
          </div>
        </div>

        {/* Signals */}
        <div className="flex items-center space-x-1.5">
          {initiative.status === 'Blocked' && (
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" title="Blocked"></span>
          )}
          {isStuck && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" title="Stuck"></span>
          )}
          {!isStuck && initiative.status === 'Active' && daysInStage < 3 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Moving Fast"></span>
          )}
          
          <div className="flex items-center text-xs text-slate-400 font-medium ml-1">
            <Clock size={12} className="mr-0.5" />
            <span>{daysInStage}d</span>
          </div>
        </div>
      </div>
    </div>
  );
}
