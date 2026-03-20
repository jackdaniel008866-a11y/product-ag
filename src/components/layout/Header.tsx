import { Search, Plus, Bell, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  onQuickAdd: () => void;
}

export default function Header({ onQuickAdd }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 bg-white">
      {/* Logo & Branding */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center h-8 px-2 bg-slate-50 rounded border border-slate-100">
          <img src="/logos/surbo-logo.webp" alt="Surbo" className="h-5 w-auto object-contain" title="Surbo" />
        </div>
        <div className="flex items-center justify-center h-8 px-2 bg-slate-50 rounded border border-slate-100">
          <img src="/logos/surbo-chat-logo.webp" alt="Surbo Chat" className="h-5 w-auto object-contain" title="Surbo Chat" />
        </div>
        <div className="flex items-center justify-center h-8 px-2 bg-slate-50 rounded border border-slate-100">
          <img src="/logos/botsup-logo.webp" alt="Botsup" className="h-5 w-auto object-contain" title="Botsup" />
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl px-12 relative hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search initiatives, notes, or tags... (Cmd+K)" 
            className="w-full bg-slate-100 hover:bg-slate-200/50 focus:bg-white border focus:border-teal-500 border-transparent rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none transition-all focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-500"
          />
        </div>
      </div>



      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="flex items-center space-x-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm border border-transparent hover:border-red-100"
        >
          <LogOut size={16} strokeWidth={2.5} />
          <span>Sign Out</span>
        </button>
        <button className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-full hover:bg-slate-100 relative hidden md:block">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>
        <button 
          onClick={onQuickAdd}
          className="flex items-center space-x-1.5 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Quick Add</span>
        </button>
      </div>
    </header>
  );
}
