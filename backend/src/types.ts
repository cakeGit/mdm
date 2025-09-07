export interface Project {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface Stage {
  id?: number;
  project_id: number;
  parent_stage_id?: number;
  name: string;
  description?: string;
  sort_order: number;
  is_completed: boolean;
  substages?: Stage[];
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
}

export interface WorkSession {
  id?: number;
  project_id: number;
  duration: number; // in seconds
  started_at: string;
  notes?: string;
}

export interface ProjectWithDetails extends Project {
  stages: StageWithTasks[];
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export interface StageWithTasks extends Stage {
  tasks: Task[];
}