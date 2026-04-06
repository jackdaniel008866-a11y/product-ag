import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import AppLayout from './components/layout/AppLayout';
import type { Initiative, Stage, Comment, AppNotification } from './types';
import KanbanBoard from './components/kanban/KanbanBoard';
import ListView from './components/views/ListView';
import StuckView from './components/views/StuckView';
import ProductView from './components/views/ProductView';
import InsightsView from './components/views/InsightsView';
import TeamView from './components/views/TeamView';
import RoadmapView from './components/views/RoadmapView';
import ClientUpdatesView from './components/views/ClientUpdatesView';
import QuickAddModal from './components/modals/QuickAddModal';
import EditInitiativeModal from './components/modals/EditInitiativeModal';
import AuthModal from './components/auth/AuthModal';
import { useUsers, UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { SalesRequest } from './types';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'product' | 'team' | 'insights' | 'client-updates';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [stuckDaysThreshold, setStuckDaysThreshold] = useState<number>(7);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [salesRequests, setSalesRequests] = useState<SalesRequest[]>([]);
  const { usersList, removeUser } = useUsers();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Initiatives & Sync User
  useEffect(() => {
    if (!session) return;

    // Graceful Profile Auto-sync
    const syncProfile = async () => {
      const { user } = session;
      if (user && user.user_metadata?.full_name) {
        // Attempt to seamlessly insert/update them into the team dictionary now that they are verified and authorized
        await supabase.from('users').upsert({
          id: user.id,
          name: user.user_metadata.full_name,
          initials: `${user.user_metadata.first_name?.[0] || ''}${user.user_metadata.last_name?.[0] || ''}`.toUpperCase()
        }, { onConflict: 'id' });
      }
    };
    syncProfile();

    supabase.from('initiatives').select('*').order('createdAt', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('CRITICAL: Error fetching initiatives from Supabase:', error);
        } else {
          setInitiatives(data || []);
        }
      });
      
    // Fetch Notifications
    supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          setNotifications(data || []);
        }
      });
      
    // Fetch Sales Requests
    supabase.from('sales_requests').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching sales requests:', error);
        } else {
          setSalesRequests(data || []);
        }
      });

    // Subscribe to new notifications natively
    const notificationSubscription = supabase.channel('realtime:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, payload => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as AppNotification : n));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [session]);

  const stuckCount = initiatives.filter(init => {
    const daysInStage = differenceInDays(new Date(), new Date(init.stageUpdatedAt));
    return daysInStage >= stuckDaysThreshold && init.status !== 'Blocked' && init.status !== 'Deployed';
  }).length;

  const handleQuickAdd = () => {
    setIsQuickAddOpen(true);
  };

  const handleSaveInitiative = async (newItem: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt' | 'stageUpdatedAt'>) => {
    const freshInitiative: Initiative = {
      ...newItem,
      id: `init-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stageUpdatedAt: new Date().toISOString(),
      tags: newItem.tags || [],
      stageHistory: [{ stage: newItem.stage, enteredAt: new Date().toISOString(), exitedAt: null }]
    };
    
    const { error } = await supabase.from('initiatives').insert([freshInitiative]);
    if (!error) {
      setInitiatives(prev => [freshInitiative, ...prev]);
    } else {
      console.error('Error saving initiative:', error);
    }
  };

  const handleUpdateInitiative = async (id: string, updates: Partial<Initiative>) => {
    const init = initiatives.find(i => i.id === id);
    let updatedHistory = init?.stageHistory;
    
    if (init && updates.stage && updates.stage !== init.stage) {
      updatedHistory = [
        ...(init.stageHistory || [{ stage: init.stage, enteredAt: init.createdAt, exitedAt: null }]).map(h => h.exitedAt ? h : { ...h, exitedAt: new Date().toISOString() }),
        { stage: updates.stage, enteredAt: new Date().toISOString(), exitedAt: null }
      ];
    }
    
    const payload = { 
      // Ensure we don't accidentally overwrite if it wasn't modified
      ...updates, 
      updatedAt: new Date().toISOString(),
      ...(updatedHistory && updates.stage !== init?.stage ? { stageHistory: updatedHistory } : {})
    };
    
    const { error } = await supabase.from('initiatives').update(payload).eq('id', id);
    if (!error) {
      setInitiatives(prev => prev.map(init => 
        init.id === id ? { ...init, ...payload } : init
      ));
    } else {
      console.error('Error updating initiative:', error);
    }
  };

  const handleMoveInitiative = async (id: string, newStage: Stage) => {
    const currentInit = initiatives.find(i => i.id === id);
    if (!currentInit || currentInit.stage === newStage) return; // No change

    const newHistory = [
      ...(currentInit.stageHistory || [{ stage: currentInit.stage, enteredAt: currentInit.createdAt, exitedAt: null }]).map(h => h.exitedAt ? h : { ...h, exitedAt: new Date().toISOString() }),
      { stage: newStage, enteredAt: new Date().toISOString(), exitedAt: null }
    ];

    const payload = { 
      stage: newStage, 
      stageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stageHistory: newHistory
    };

    // Optimistic UI update for instant feedback
    setInitiatives(prev => prev.map(init => 
      init.id === id ? { ...init, ...payload } : init
    ));

    const { error } = await supabase.from('initiatives').update(payload).eq('id', id);
    if (error) {
      console.error('Error moving initiative:', error);
    }
  };

  const handleDeleteInitiative = async (id: string) => {
    // 1. Optimistic UI: Delete it from the local browser immediately so it vanishes and clears from CSV
    setInitiatives(prev => prev.filter(init => init.id !== id));

    // 2. Perform the actual backend deletion
    const { error } = await supabase.from('initiatives').delete().eq('id', id);
    
    // 3. Catch invisible failures
    if (error) {
      alert('WARNING: Your card was hidden locally, but Supabase blocked the deletion! Refresh the page. Error: ' + JSON.stringify(error));
      console.error('Error deleting initiative:', error);
    }
  };

  const handleAddComment = async (initiativeId: string, comment: Comment) => {
    const currentInit = initiatives.find(i => i.id === initiativeId);
    if (!currentInit) return;
    
    const newComments = [...(currentInit.comments || []), comment];

    // Optimistic UI update
    setInitiatives(prev => prev.map(init => 
      init.id === initiativeId ? { ...init, comments: newComments } : init
    ));

    const { error } = await supabase.from('initiatives').update({ comments: newComments }).eq('id', initiativeId);
    if (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    // Optimistic
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleNotificationClick = async (initiativeId: string) => {
    const exists = initiatives.some(i => i.id === initiativeId);
    if (!exists) {
      alert("This initiative has been safely deleted by a team member.");
      const notifsToRemove = notifications.filter(n => n.initiative_id === initiativeId);
      if (notifsToRemove.length > 0) {
        const ids = notifsToRemove.map(n => n.id);
        setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
        await supabase.from('notifications').delete().in('id', ids);
      }
      return;
    }
    setEditingInitiativeId(initiativeId);
  };

  const handleSaveSalesRequest = async (newItem: Omit<SalesRequest, 'id' | 'created_at' | 'updated_at'>) => {
    const payload = {
      ...newItem,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('sales_requests').insert([payload]).select().single();
    if (error) {
      console.error('Error saving sales request:', error);
    } else if (data) {
      setSalesRequests(prev => [data, ...prev]);
    }
  };

  const handleUpdateSalesRequest = async (id: string, updates: Partial<SalesRequest>) => {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    // Optimistic UI updates
    setSalesRequests(prev => prev.map(sr => sr.id === id ? { ...sr, ...payload } : sr));
    
    const { error } = await supabase.from('sales_requests').update(payload).eq('id', id);
    if (error) {
      console.error('Error updating sales request:', error);
    }
  };

  const handleDeleteSalesRequest = async (id: string) => {
    setSalesRequests(prev => prev.filter(sr => sr.id !== id));
    const { error } = await supabase.from('sales_requests').delete().eq('id', id);
    if (error) {
       console.error('Error deleting sales request:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthModal />;
  }

  const handleExportCSV = () => {
    if (initiatives.length === 0) {
      alert("No initiatives to export.");
      return;
    }

    const headers = ['ID', 'Title', 'Description', 'Product', 'Type', 'Priority', 'Owner', 'Developers', 'Stage', 'Status', 'Target Date', 'Tags', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...initiatives.map(init => {
        const ownerName = usersList.find(u => u.id === init.ownerId)?.name || 'Unknown';
        const developerNames = (init.developers || []).join(' | ');
        return [
          `"${init.id}"`,
          `"${(init.title || '').replace(/"/g, '""')}"`,
          `"${(init.description || '').replace(/"/g, '""')}"`,
          `"${init.product}"`,
          `"${init.type}"`,
          `"${init.priority}"`,
          `"${ownerName}"`,
          `"${developerNames}"`,
          `"${init.stage}"`,
          `"${init.status}"`,
          `"${init.targetDate || ''}"`,
          `"${(init.tags || []).join(' | ')}"`,
          `"${init.createdAt}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `product_os_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="product-ag-theme">
      <UserProvider>
        <AppLayout 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onQuickAdd={handleQuickAdd}
          onExportData={handleExportCSV}
          stuckCount={stuckCount}
          initiatives={initiatives}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationClick={handleNotificationClick}
        >
          <div className="h-full">
            {currentView === 'kanban' && (
              <KanbanBoard 
                initiatives={initiatives} 
                onInitiativeClick={setEditingInitiativeId} 
                onMoveInitiative={handleMoveInitiative} 
                stuckDaysThreshold={stuckDaysThreshold}
              />
            )}
            {currentView === 'roadmap' && (
              <RoadmapView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
            )}
            {currentView === 'list' && (
              <ListView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
            )}
            {currentView === 'stuck' && (
              <StuckView 
                initiatives={initiatives} 
                onInitiativeClick={setEditingInitiativeId} 
                stuckDaysThreshold={stuckDaysThreshold}
                onThresholdChange={setStuckDaysThreshold}
              />
            )}
            {currentView === 'product' && (
              <ProductView initiatives={initiatives} />
            )}
            {currentView === 'insights' && (
              <InsightsView initiatives={initiatives} />
            )}
            {currentView === 'client-updates' && (
              <ClientUpdatesView 
                salesRequests={salesRequests} 
                onSave={handleSaveSalesRequest}
                onUpdate={handleUpdateSalesRequest}
                onDelete={handleDeleteSalesRequest}
              />
            )}
            {currentView === 'team' && (
              <TeamView users={usersList} onRemoveUser={removeUser} />
            )}
          </div>

          <QuickAddModal 
            isOpen={isQuickAddOpen} 
            onClose={() => setIsQuickAddOpen(false)} 
            onSave={handleSaveInitiative} 
          />

          <EditInitiativeModal
            initiative={initiatives.find(i => i.id === editingInitiativeId) || null}
            currentUserMetadata={session.user.user_metadata || {}}
            currentUserId={session.user.id}
            onClose={() => setEditingInitiativeId(null)}
            onUpdate={handleUpdateInitiative}
            onDelete={handleDeleteInitiative}
            onAddComment={handleAddComment}
          />
        </AppLayout>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
