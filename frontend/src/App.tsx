import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Layout } from './components/layout/Layout';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { NewProjectModal } from './components/NewProjectModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Project } from './types';
import { apiRequest } from './lib/api';

type View = 'dashboard' | 'project';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
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
    fetchProjects();
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

  return (
    <Layout>
      {currentView === 'dashboard' && (
        <ProjectDashboard
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
        />
      )}

      {currentView === 'project' && selectedProjectId && (
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={handleBackToDashboard}
        />
      )}

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />

      <PomodoroTimer projects={projects} />
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