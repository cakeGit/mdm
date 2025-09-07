import { useState, useEffect } from 'react';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { NewProjectModal } from './components/NewProjectModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Project } from './types';

type View = 'dashboard' | 'project';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
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

  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
}

export default App;