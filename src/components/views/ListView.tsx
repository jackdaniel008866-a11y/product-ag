
import type { Initiative } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface ListViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function ListView({ initiatives, onInitiativeClick }: ListViewProps) {
  const { users } = useUsers();
  return (
    <div className="bg-white border text-sm box-border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <th className="px-5 py-3 font-semibold w-1/3">Initiative</th>
              <th className="px-5 py-3 font-semibold">Stage</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Owner</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initiatives.map((init) => (
              <tr key={init.id} onClick={() => onInitiativeClick(init.id)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <td className="px-5 py-3.5 flex flex-col justify-center">
                  <span className="font-semibold text-slate-800">{init.title}</span>
                  <span className="text-xs text-slate-400 mt-0.5">{init.product} • {init.type}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200 block w-max">
                    {init.stage}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={clsx(
                    "font-medium",
                    init.priority === 'High' ? 'text-red-600' : init.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {init.priority}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                      {users[init.ownerId]?.initials}
                    </div>
                    <span className="text-slate-600">{users[init.ownerId]?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={clsx(
                      "w-2 h-2 rounded-full",
                      init.status === 'Active' ? 'bg-emerald-500' : init.status === 'Blocked' ? 'bg-red-500' : 'bg-slate-400'
                    )}></span>
                    <span className="text-slate-600">{init.status}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {formatDistanceToNow(new Date(init.updatedAt), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
