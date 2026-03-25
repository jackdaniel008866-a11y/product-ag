import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, LogOut, CheckCircle2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import type { AppNotification } from '../../types';

interface HeaderProps {
  onQuickAdd: () => void;
  onExportData: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onNotificationClick: (initiativeId: string) => void;
}

export default function Header({ onQuickAdd, onExportData, notifications = [], onMarkRead, onNotificationClick }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`transition-colors p-1.5 rounded-full relative ${isDropdownOpen ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-10 w-80 max-h-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      notifications.filter(n => !n.is_read).forEach(n => onMarkRead(n.id));
                    }}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No new notifications.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          if (!notification.is_read) onMarkRead(notification.id);
                          setIsDropdownOpen(false);
                          onNotificationClick(notification.initiative_id);
                        }}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="mt-0.5 relative shrink-0">
                          {notification.is_read ? (
                            <CheckCircle2 size={16} className="text-slate-300" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-sm leading-snug break-words whitespace-normal ${!notification.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                            {notification.message}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={onExportData}
          className="flex items-center space-x-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
        >
          <Download size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Export</span>
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
