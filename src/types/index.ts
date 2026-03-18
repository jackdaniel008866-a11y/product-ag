export type Product = 'Surbo' | 'Surbo Chat';
export type InitiativeType = 'Feature' | 'Enhancement' | 'Client Ask' | 'Bug Theme' | 'Experiment' | 'Internal Improvement';
export type Priority = 'High' | 'Medium' | 'Low';
export type Stage = 'Discussion' | 'Roadmap' | 'Planning' | 'Execution' | 'Testing' | 'Release' | 'Optimization' | 'Done' | 'Parked';
export type Status = 'Active' | 'Blocked' | 'Parked' | 'Done';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
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
  tags?: string[];
  teamMembers?: string[];
  stageUpdatedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
