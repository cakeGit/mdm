export interface Project {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  // status property removed
  created_at?: string;
  updated_at?: string;
  total_tasks?: number;
  completed_tasks?: number;
  progress?: number;
  suggested_task?: Task;
  stageProgress?: StageProgress[];
}

export interface Stage {
  id?: number;
  project_id: number;
  parent_stage_id?: number;
  name: string;
  description?: string;
  sort_order: number;
  is_completed: boolean;
  weight?: number;
  substages?: Stage[];
  tasks?: Task[];
  progress?: number;
}

export interface Task {
  id?: number;
  stage_id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 1 | 2 | 3; // 1 = High, 2 = Medium, 3 = Low
  created_at?: string;
  completed_at?: string;
  is_pinned?: boolean;
  notes?: string;
}

export interface TaskNote {
  id?: number;
  task_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkSession {
  id?: number;
  project_id: number;
  duration: number; // in seconds
  started_at: string;
  notes?: string;
  project_name?: string;
}

export interface ProjectWithDetails extends Project {
  stages: Stage[];
  stageProgress?: StageProgress[];
}

export interface StageProgress {
  id: number;
  name: string;
  progress: number;
  weight: number;
}