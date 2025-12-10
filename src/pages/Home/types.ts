// Types for Home page components
// Using index signature to be compatible with BaseItem

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface ProjectMember {
  userId: number;
  role: string;
  user?: { id: number; name: string; avatar?: string };
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  owner?: User;
  members?: ProjectMember[];
  _count?: { tasks: number; members: number };
  [key: string]: unknown;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project?: { id: number; name: string };
  assignee?: User;
  [key: string]: unknown;
}

// Select mode types
export type SelectMode = 'single' | 'multiple';

// Cascading select state
export interface CascadingSelectState {
  memberIds: number[];
  projectIds: number[];
  taskIds: number[];
}
