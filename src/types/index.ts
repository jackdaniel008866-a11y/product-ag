export type Product = 'Surbo' | 'Surbo Chat';
export type InitiativeType = 'Feature' | 'Enhancement' | 'Client Ask' | 'Bug Theme' | 'Experiment' | 'Internal Improvement';
export type Priority = 'High' | 'Medium' | 'Low';
export type Stage = 'Roadmap' | 'Planning' | 'Execution' | 'Testing' | 'Deployed' | 'Parked';
export type Status = 'Active' | 'Blocked' | 'Parked' | 'Deployed';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO string
  isSystem?: boolean;
}

export interface StageTransition {
  stage: Stage;
  enteredAt: string;
  exitedAt: string | null;
}

export interface DirectionScore {
  date: string;
  score: number;
}

export interface AppNotification {
  id: string;
  user_id: string;
  message: string;
  initiative_id: string;
  is_read: boolean;
  created_at: string;
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  product: Product;
  type: InitiativeType;
  priority: Priority;
  ownerId: string;
  stage: Stage;
  status: Status;
  blockerReason?: string;
  notes?: string;
  targetDate?: string; // ISO date string or yyyy-mm-dd format
  comments?: Comment[];
  tags?: string[];
  teamMembers?: string[];
  stageUpdatedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  stageHistory?: StageTransition[];
}
