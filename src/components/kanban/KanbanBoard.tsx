
import type { Initiative, Stage } from '../../types';
import { STAGES } from '../../data/mockData';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
  onMoveInitiative: (id: string, newStage: Stage) => void;
}

export default function KanbanBoard({ initiatives, onInitiativeClick, onMoveInitiative }: KanbanBoardProps) {
  return (
    <div className="h-full w-full flex space-x-4 overflow-x-auto pb-4 custom-scrollbar-x pr-8">
      {STAGES.filter(stage => stage !== 'Roadmap').map((stage) => {
        const columnInitiatives = initiatives.filter(i => i.stage === stage);
        return (
          <KanbanColumn 
            key={stage} 
            stage={stage} 
            initiatives={columnInitiatives} 
            onInitiativeClick={onInitiativeClick}
            onMoveInitiative={onMoveInitiative}
          />
        );
      })}
    </div>
  );
}
