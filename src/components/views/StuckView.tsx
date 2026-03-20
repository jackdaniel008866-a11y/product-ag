
import type { Initiative } from '../../types';
import { differenceInDays } from 'date-fns';
import InitiativeCard from '../kanban/InitiativeCard';

interface StuckViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
  stuckDaysThreshold: number;
  onThresholdChange: (days: number) => void;
}

export default function StuckView({ initiatives, onInitiativeClick, stuckDaysThreshold, onThresholdChange }: StuckViewProps) {
  // Only items stuck > threshold days or blocked
  const stuckItems = initiatives.filter(init => {
    const isStuckTimer = differenceInDays(new Date(), new Date(init.stageUpdatedAt)) >= stuckDaysThreshold;
    return init.status === 'Blocked' || (isStuckTimer && init.status !== 'Deployed' && init.stage !== 'Deployed' && init.status !== 'Parked');
  });

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-[0_0_6px_rgba(239,68,68,0.5)]"></span>
            Attention Required
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Initiatives that are officially blocked or haven't moved stages in over {stuckDaysThreshold} days.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[3, 7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => onThresholdChange(days)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  stuckDaysThreshold === days 
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-semibold text-sm whitespace-nowrap">
            {stuckItems.length} Stuck Items
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stuckItems.map(init => (
          <InitiativeCard key={init.id} initiative={init} onClick={() => onInitiativeClick(init.id)} stuckDaysThreshold={stuckDaysThreshold} />
        ))}
      </div>
      
      {stuckItems.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="m9 11 3 3L22 4"></path></svg>
          </div>
          <h3 className="text-slate-800 font-medium text-lg">Everything is moving!</h3>
          <p className="text-slate-500 text-sm mt-1">No initiatives are blocked or stuck right now.</p>
        </div>
      )}
    </div>
  );
}
