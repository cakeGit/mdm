import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditProjectModal } from '@/components/EditProjectModal';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import { ProjectHeader } from './ProjectDetail/ProjectHeader';
import { ProjectProgress } from './ProjectDetail/ProjectProgress';
import { StageList } from './ProjectDetail/StageList';
import { RecentSessionsCard } from './ProjectDetail/RecentSessionsCard';

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const {
    project,
    loading,
    recentSessions,
    fetchProject,
    updateProject,
    addStage,
    updateStage,
    addTask,
    updateTask,
    reorderTasks,
  } = useProjectDetail(projectId);

  const [showEditProjectModal, setShowEditProjectModal] = useState(false);

  if (loading) return <div className="p-8">Loading project...</div>;
  if (!project) return <div className="p-8">Project not found</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <ProjectHeader project={project} onUpdateProject={updateProject} onEditProject={() => setShowEditProjectModal(true)} />
        <ProjectProgress project={project} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <StageList
            project={project}
            onAddStage={addStage}
            onUpdateStage={updateStage}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onReorderTasks={reorderTasks}
          />
        </div>

        <div>
          <RecentSessionsCard sessions={recentSessions} />
        </div>
      </div>

      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        onProjectUpdated={fetchProject}
        project={project}
      />
    </div>
  );
}