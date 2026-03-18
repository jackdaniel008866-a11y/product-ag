
import { useState } from 'react';
import type { Initiative, Stage } from '../../types';
import InitiativeCard from './InitiativeCard';

interface KanbanColumnProps {
  stage: Stage;
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
  onMoveInitiative: (id: string, newStage: Stage) => void;
  stuckDaysThreshold: number;
}

export default function KanbanColumn({ stage, initiatives, onInitiativeClick, onMoveInitiative, stuckDaysThreshold }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const initiativeId = e.dataTransfer.getData('initiativeId');
    if (initiativeId) {
      onMoveInitiative(initiativeId, stage);
    }
  };

  return (
    <div 
      className={`flex-shrink-0 w-[280px] md:w-[300px] flex flex-col h-full rounded-xl overflow-hidden border transition-colors ${
        isDragOver ? 'bg-teal-50/50 border-teal-300 shadow-md' : 'bg-slate-100/50 border-slate-200/60'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm transition-colors ${
        isDragOver ? 'border-teal-200 bg-teal-50/80' : 'border-slate-200/60 bg-slate-100/80'
      }`}>
        <h3 className="font-semibold text-sm text-slate-700">{stage}</h3>
        <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
          {initiatives.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.id} initiative={initiative} onClick={() => onInitiativeClick(initiative.id)} stuckDaysThreshold={stuckDaysThreshold} />
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
