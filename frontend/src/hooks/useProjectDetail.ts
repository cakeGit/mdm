import { useState, useEffect } from 'react';
import { ProjectWithDetails, Stage, Task } from '@/types';
import { apiRequest } from '@/lib/api';

export function useProjectDetail(projectId: number) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const fetchProject = async () => {
    try {
      const response = await apiRequest(`/api/projects/${projectId}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await apiRequest(`/api/sessions?project_id=${projectId}&limit=5`);
      const sessions = await response.json();
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch recent sessions:', error);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchRecentSessions();
  }, [projectId]);

  const updateProject = async (data: Partial<ProjectWithDetails>) => {
    if (!project) return;
    try {
      await apiRequest(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchProject();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const addStage = async (name: string, description?: string, _keepOpen?: boolean) => {
    try {
      await apiRequest('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name,
          description,
        }),
      });
      await fetchProject();
    } catch (error) {
      console.error('Failed to add stage:', error);
    }
  };

  const updateStage = async (stageId: number, data: Partial<Stage>) => {
    try {
      await apiRequest(`/api/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchProject();
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const addTask = async (stageId: number, title: string, description?: string, _keepOpen?: boolean) => {
    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: stageId,
          title,
          description,
          priority: 2, // Default priority
        }),
      });
      await fetchProject();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTask = async (taskId: number, data: Partial<Task>) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchProject();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const reorderTasks = async (stageId: number, taskIds: number[]) => {
    // Optimistic update
    const originalProject = project;
    if (!project) return;
    const stage = project.stages.find(s => s.id === stageId);
    if (stage) {
  const existingTasks = stage.tasks ?? [];
  const newTasks = taskIds.map(id => existingTasks.find(t => t.id === id)).filter(Boolean) as Task[];
      const updatedStages = project.stages.map(s => s.id === stageId ? { ...s, tasks: newTasks } : s);
      setProject(prev => prev ? { ...prev, stages: updatedStages } : prev);
    }

    try {
      await apiRequest(`/api/tasks/reorder`, {
        method: 'PUT',
        body: JSON.stringify({
          stage_id: stageId,
          task_ids: taskIds,
        }),
      });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      // Revert on error
      setProject(originalProject);
    }
  };

  return {
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
  };
}
