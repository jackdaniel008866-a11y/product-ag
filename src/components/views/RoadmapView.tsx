import type { Initiative } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { format } from 'date-fns';
import { Clock, AlertCircle, Zap, Calendar } from 'lucide-react';

interface RoadmapViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function RoadmapView({ initiatives, onInitiativeClick }: RoadmapViewProps) {
  const { users } = useUsers();
  
  // Filter only roadmap items
  const roadmapItems = initiatives.filter(i => i.stage === 'Roadmap');

  // Group by Product
  const products = Array.from(new Set(roadmapItems.map(i => i.product))).sort();

  if (roadmapItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 border border-slate-200 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Roadmap Items</h3>
        <p className="text-slate-500 max-w-md">Assign initiatives to the "Roadmap" phase to see them organized here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 pb-8 pr-2 lg:pr-4 animate-in fade-in duration-300">
      {products.map(product => {
        const items = roadmapItems.filter(i => i.product === product);
        
        return (
          <div key={product} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className={`px-6 py-4 border-b flex items-center space-x-3 ${
              product === 'Surbo' ? 'bg-teal-50/50 border-teal-100/50' : 'bg-blue-50/50 border-blue-100/50'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm border ${
                product === 'Surbo' ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {product.substring(0, 1)}
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{product} Roadmap</h2>
              <span className="bg-white text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                {items.length} item{items.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {items.map(initiative => {
                const owner = users[initiative.ownerId];
                
                return (
                  <div 
                    key={initiative.id}
                    onClick={() => onInitiativeClick(initiative.id)}
                    className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                          {initiative.priority === 'High' && (
                            <Zap size={14} className="text-red-500 fill-red-500 flex-shrink-0" />
                          )}
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded shadow-sm border border-slate-200/60">
                            {initiative.type}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm border ${
                            initiative.status === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                            initiative.status === 'Deployed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            initiative.status === 'Parked' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {initiative.status}
                          </span>
                          {initiative.targetDate && (
                            <span className="flex items-center text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded shadow-sm border border-indigo-200">
                              <Calendar size={10} className="mr-1 shrink-0" />
                              Target: {format(new Date(initiative.targetDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 mb-1.5 group-hover:text-teal-600 transition-colors line-clamp-2 md:line-clamp-1">
                          {initiative.title}
                        </h4>
                        {initiative.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 pr-4 leading-relaxed">
                            {initiative.description}
                          </p>
                        )}
                        {initiative.status === 'Blocked' && initiative.blockerReason && (
                          <div className="mt-3 text-xs font-medium text-red-600 flex items-start bg-red-50 p-2.5 rounded-lg border border-red-100 shadow-sm">
                            <AlertCircle size={14} className="mr-1.5 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{initiative.blockerReason}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start mt-2 md:mt-0 space-y-0 md:space-y-3 shrink-0">
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-1 shadow-sm md:w-auto">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 shrink-0">
                            {owner?.initials || '??'}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{owner?.name || 'Unassigned'}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-400 font-medium">
                          <Clock size={12} className="mr-1.5 shrink-0" />
                          <span>Added {format(new Date(initiative.stageUpdatedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
