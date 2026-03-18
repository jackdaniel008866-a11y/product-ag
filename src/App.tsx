import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import AppLayout from './components/layout/AppLayout';
import type { Initiative, Stage, Comment } from './types';
import KanbanBoard from './components/kanban/KanbanBoard';
import ListView from './components/views/ListView';
import StuckView from './components/views/StuckView';
import OwnerView from './components/views/OwnerView';
import ProductView from './components/views/ProductView';
import TeamView from './components/views/TeamView';
import RoadmapView from './components/views/RoadmapView';
import QuickAddModal from './components/modals/QuickAddModal';
import EditInitiativeModal from './components/modals/EditInitiativeModal';
import PasswordPrompt from './components/auth/PasswordPrompt';
import { useUsers } from './contexts/UserContext';
import { supabase } from './lib/supabase';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'owner' | 'product' | 'team';

function App() {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('product-os-auth') === 'true';
  });
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);
  const { usersList, addUser, removeUser } = useUsers();

  useEffect(() => {
    supabase.from('initiatives').select('*').order('createdAt', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('CRITICAL: Error fetching initiatives from Supabase:', error);
          alert(`Database Error: ${error.message}. Check browser console for details.`);
        } else {
          setInitiatives(data || []);
        }
      });
  }, []);

  const stuckCount = initiatives.filter(init => {
    const daysInStage = differenceInDays(new Date(), new Date(init.stageUpdatedAt));
    return daysInStage >= 7 && init.status !== 'Blocked' && init.status !== 'Deployed';
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
      teamMembers: newItem.teamMembers || [],
    };
    
    const { error } = await supabase.from('initiatives').insert([freshInitiative]);
    if (!error) {
      setInitiatives(prev => [freshInitiative, ...prev]);
    } else {
      console.error('Error saving initiative:', error);
    }
  };

  const handleUpdateInitiative = async (id: string, updates: Partial<Initiative>) => {
    const payload = { ...updates, updatedAt: new Date().toISOString() };
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

    const payload = { 
      stage: newStage, 
      stageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString() 
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
    const { error } = await supabase.from('initiatives').delete().eq('id', id);
    if (!error) {
      setInitiatives(prev => prev.filter(init => init.id !== id));
    } else {
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

  const handleAuthSuccess = () => {
    localStorage.setItem('product-os-auth', 'true');
    setIsAuthorized(true);
  };

  if (!isAuthorized) {
    return <PasswordPrompt onSuccess={handleAuthSuccess} />;
  }

  return (
    <AppLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      onQuickAdd={handleQuickAdd}
      stuckCount={stuckCount}
    >
      <div className="h-full">
        {currentView === 'kanban' && (
          <KanbanBoard 
            initiatives={initiatives} 
            onInitiativeClick={setEditingInitiativeId} 
            onMoveInitiative={handleMoveInitiative} 
          />
        )}
        {currentView === 'roadmap' && (
          <RoadmapView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
        )}
        {currentView === 'list' && (
          <ListView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
        )}
        {currentView === 'stuck' && (
          <StuckView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
        )}
        {currentView === 'owner' && (
          <OwnerView initiatives={initiatives} onInitiativeClick={setEditingInitiativeId} />
        )}
        {currentView === 'product' && (
          <ProductView initiatives={initiatives} />
        )}
        {currentView === 'team' && (
          <TeamView users={usersList} onAddUser={addUser} onRemoveUser={removeUser} />
        )}
      </div>

      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        onSave={handleSaveInitiative} 
      />

      <EditInitiativeModal
        initiative={initiatives.find(i => i.id === editingInitiativeId) || null}
        onClose={() => setEditingInitiativeId(null)}
        onUpdate={handleUpdateInitiative}
        onDelete={handleDeleteInitiative}
        onAddComment={handleAddComment}
      />
    </AppLayout>
  );
}

export default App;
