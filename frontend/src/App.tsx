import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Layout } from './components/layout/Layout';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { ProgressView } from './components/Progress';
import { SessionsView } from './components/Sessions';
import { NewProjectModal } from './components/NewProjectModal';
import { QuickAddTask } from './components/QuickAddTask';
import { FocusMode } from './components/FocusMode';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Project } from './types';
import { apiRequest } from './lib/api';
import { useHotkeys } from './hooks/useHotkeys';

type View = 'dashboard' | 'projects' | 'progress' | 'sessions' | 'project';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Global hotkeys
  useHotkeys({
    'ctrl+shift+t': () => {
      if (user) {
        setShowQuickAddTask(true);
      }
    }
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await apiRequest('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  const handleViewChange = (view: string) => {
    setCurrentView(view as View);
    if (view !== 'project') {
      setSelectedProjectId(null);
    }
  };

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedProjectId(null);
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleProjectCreated = () => {
    fetchProjects(); // This should refresh the projects list
    setShowNewProjectModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authMode === 'login' ? (
          <LoginForm onToggleMode={() => setAuthMode('register')} />
        ) : (
          <RegisterForm onToggleMode={() => setAuthMode('login')} />
        )}
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ProjectDashboard
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onNewProject={handleNewProject}
            onRefresh={fetchProjects}
          />
        );
      case 'projects':
        return (
          <ProjectDashboard
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onNewProject={handleNewProject}
            onRefresh={fetchProjects}
          />
        );
      case 'progress':
        return <ProgressView />;
      case 'sessions':
        return <SessionsView />;
      case 'project':
        return selectedProjectId ? (
          <>
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={handleBackToDashboard}
            />
            <PomodoroTimer projects={projects} currentProjectId={selectedProjectId} />
          </>
        ) : null;
      default:
        return (
          <ProjectDashboard
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onNewProject={handleNewProject}
            onRefresh={fetchProjects}
          />
        );
    }
  };

  return (
    <Layout activeView={currentView} onViewChange={handleViewChange}>
      {renderContent()}
      
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
      
      <QuickAddTask
        isOpen={showQuickAddTask}
        onClose={() => setShowQuickAddTask(false)}
        onTaskAdded={fetchProjects}
      />
      
      <FocusMode
        projectId={selectedProjectId}
        isActive={focusMode}
        onToggle={() => setFocusMode(!focusMode)}
        onExit={() => {
          setFocusMode(false);
          setCurrentView('dashboard');
          setSelectedProjectId(null);
        }}
      />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;