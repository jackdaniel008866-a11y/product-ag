
import type { Initiative } from '../../types';

interface ProductViewProps {
  initiatives: Initiative[];
}

export default function ProductView({ initiatives }: ProductViewProps) {
  const surbo = initiatives.filter(i => i.product === 'Surbo');
  const surboChat = initiatives.filter(i => i.product === 'Surbo Chat');

  const renderStats = (title: string, data: Initiative[], badgeColor: string) => {
    const active = data.filter(i => i.status === 'Active').length;
    const blocked = data.filter(i => i.status === 'Blocked').length;
    const done = data.filter(i => i.status === 'Done').length;

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${badgeColor}`}>
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="font-medium bg-white/20 px-2 py-0.5 rounded text-sm">{data.length} Total</span>
        </div>
        <div className="p-5 flex-1">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-medium">Active</span>
                <span className="font-bold text-slate-700">{active}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data.length ? (active / data.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-medium">Blocked</span>
                <span className="font-bold text-slate-700">{blocked}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.length ? (blocked / data.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-medium">Done</span>
                <span className="font-bold text-slate-700">{done}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${data.length ? (done / data.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Product Focus Breakdown</h2>
        <p className="text-slate-500 text-sm mt-1">High-level distribution of initiatives across our core products.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderStats('Surbo', surbo, 'bg-teal-50 text-teal-800 border-teal-100')}
        {renderStats('Surbo Chat', surboChat, 'bg-blue-50 text-blue-800 border-blue-100')}
      </div>
    </div>
  );
}
