import { useState } from 'react';
import type { User } from '../../types';
import { Trash2, UserPlus } from 'lucide-react';

interface TeamViewProps {
  users: User[];
  onAddUser: (name: string, initials: string) => void;
  onRemoveUser: (id: string) => void;
}

export default function TeamView({ users, onAddUser, onRemoveUser }: TeamViewProps) {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initials.trim()) return;
    onAddUser(name.trim(), initials.trim().toUpperCase().slice(0, 2));
    setName('');
    setInitials('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">Add Team Member</h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div className="w-full md:w-32 hidden md:block">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Initials</label>
            <input 
              type="text" 
              required
              maxLength={2}
              value={initials}
              onChange={e => setInitials(e.target.value.toUpperCase())}
              placeholder="e.g. JD"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 uppercase"
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto px-6 py-2 h-[42px] bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center shrink-0"
          >
            <UserPlus size={16} className="mr-2" />
            Add Member
          </button>
        </form>
      </div>

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
