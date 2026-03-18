
import type { Initiative, Stage } from '../../types';
import InitiativeCard from './InitiativeCard';

interface KanbanColumnProps {
  stage: Stage;
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function KanbanColumn({ stage, initiatives, onInitiativeClick }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-[300px] flex flex-col h-full bg-slate-100/50 rounded-xl overflow-hidden border border-slate-200/60">
      <div className="px-4 py-3 border-b border-slate-200/60 bg-slate-100/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <h3 className="font-semibold text-sm text-slate-700">{stage}</h3>
        <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
          {initiatives.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.id} initiative={initiative} onClick={() => onInitiativeClick(initiative.id)} />
        ))}
        {initiatives.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-400">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
