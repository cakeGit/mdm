export interface Project {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  // status property removed
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
  weight?: number;
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
  completed_by_user_id?: number;
  completed_by_username?: string;
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
}

export interface ProjectWithDetails extends Project {
  stages: StageWithTasks[];
  totalTasks: number;
  completedTasks: number;
  progress: number;
  stageProgress?: StageProgress[];
  userCompletionStats?: UserCompletionStat[];
}

export interface UserCompletionStat {
  user_id: number;
  username: string;
  completed_count: number;
}

export interface StageWithTasks extends Stage {
  tasks: Task[];
  progress?: number;
}

export interface StageProgress {
  id: number;
  name: string;
  progress: number;
  weight: number;
}

export interface ProjectShare {
  id?: number;
  project_id: number;
  shared_with_user_id: number;
  permission: 'read' | 'readwrite';
  created_at?: string;
  created_by_user_id: number;
  shared_with_username?: string;
  shared_with_email?: string;
}

export interface ProjectShareToken {
  id?: number;
  project_id: number;
  token: string;
  created_at?: string;
  created_by_user_id: number;
  expires_at?: string;
}