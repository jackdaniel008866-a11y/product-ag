export type Product = 'Surbo' | 'Surbo Chat' | 'Surbo Ace' | 'AI Voicebot';
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
  targetDate?: string | null; // ISO date string or yyyy-mm-dd format
  developers?: string[];
  comments?: Comment[];
  tags?: string[];
  stageUpdatedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  stageHistory?: StageTransition[];
}

export type SalesRequestStatus = 'Assisting' | 'Awaiting Sales Update' | 'Closed - Won' | 'Closed - Lost';

export interface SalesRequest {
  id: string;
  client_name: string;
  sales_poc: string;
  description: string;
  product_owner_id?: string;
  status: SalesRequestStatus;
  outcome?: string;
  follow_up_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export type PersonalTaskTag = 'Surbo' | 'Surbo Chat' | 'AI Voicebot' | 'Meeting' | 'Demo' | 'Deep Work' | 'Client Call' | 'Admin' | 'Follow Up' | 'Review' | 'Strategy' | 'General';

export interface PersonalTask {
  id: string;
  user_id: string;
  content: string;
  tags: PersonalTaskTag[];
  is_completed: boolean;
  created_at: string;
}

export interface PersonalNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}
