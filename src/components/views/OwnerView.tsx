import { useState } from 'react';
import type { Initiative } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import InitiativeCard from '../kanban/InitiativeCard';

interface OwnerViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function OwnerView({ initiatives, onInitiativeClick }: OwnerViewProps) {
  const { users } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>('u1');

  const myInitiatives = initiatives.filter(i => i.ownerId === selectedUserId);
  const activeCount = myInitiatives.filter(i => i.status === 'Active').length;
  const blockedCount = myInitiatives.filter(i => i.status === 'Blocked').length;

  return (
    <div className="max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
            {users[selectedUserId]?.initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Team Member Focus</h2>
            <p className="text-slate-500 text-sm mt-0.5">Viewing what's on {users[selectedUserId]?.name}'s plate.</p>
          </div>
        </div>

        <div>
          <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar-x">
          {Object.values(users).map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-white font-medium cursor-pointer ${selectedUserId === u.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300'}`}
            >
              {u.name}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-slate-500 text-sm font-medium mb-1">Total Initiatives</span>
          <span className="text-3xl font-bold text-slate-800">{myInitiatives.length}</span>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-slate-500 text-sm font-medium mb-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Active
          </span>
          <span className="text-3xl font-bold text-slate-800">{activeCount}</span>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-100 shadow-sm flex flex-col justify-center">
          <span className="text-red-600 text-sm font-medium mb-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></span> Blocked
          </span>
          <span className="text-3xl font-bold text-red-700">{blockedCount}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Active Work</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myInitiatives.filter(i => i.status !== 'Done' && i.status !== 'Parked').map(init => (
          <InitiativeCard key={init.id} initiative={init} onClick={() => onInitiativeClick(init.id)} />
        ))}
      </div>
      
      {myInitiatives.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          You have no active initiatives. Enjoy the peace!
        </div>
      )}
    </div>
  );
}
