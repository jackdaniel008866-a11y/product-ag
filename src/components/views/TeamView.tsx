import type { User } from '../../types';
import { Trash2 } from 'lucide-react';

interface TeamViewProps {
  users: User[];
  onRemoveUser: (id: string) => void;
}

export default function TeamView({ users, onRemoveUser }: TeamViewProps) {

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Current Team</h2>
          <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded-full">
            {users.length} Members
          </span>
        </div>
        
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No team members yet. Add someone above!</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm border border-slate-300">
                    {user.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{user.id}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm(`Remove ${user.name} from the team?`)) {
                      onRemoveUser(user.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
