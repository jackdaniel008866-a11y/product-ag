import type { Initiative, User } from '../types';

export const USERS: Record<string, User> = {
  'u1': { id: 'u1', name: 'Nitin', initials: 'NV' },
  'u2': { id: 'u2', name: 'Deepjyoti', initials: 'DJ' },
  'u3': { id: 'u3', name: 'Rajneesh', initials: 'RJ' },
  'u4': { id: 'u4', name: 'Sahil', initials: 'SH' },
};

export const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: 'init-1',
    title: 'Voicebot Context Retention',
    description: 'Ensure voicebot remembers conversation context post-interruption.',
    product: 'Surbo',
    type: 'Enhancement',
    priority: 'High',
    ownerId: 'u1',
    stage: 'Execution',
    status: 'Active',
    stageUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['#AI', '#Voicebot']
  },
  {
    id: 'init-2',
    title: 'WhatsApp Notification Triggers',
    description: 'Trigger WhatsApp messages based on specific user events.',
    product: 'Surbo Chat',
    type: 'Feature',
    priority: 'Medium',
    ownerId: 'u2',
    stage: 'Planning',
    status: 'Blocked',
    blockerReason: 'Waiting for Meta API approval',
    stageUpdatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'init-3',
    title: 'Analytics Dashboard Revamp',
    description: 'Redesign the analytics dashboard for better insights.',
    product: 'Surbo',
    type: 'Internal Improvement',
    priority: 'Low',
    ownerId: 'u3',
    stage: 'Planning',
    status: 'Active',
    stageUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'init-4',
    title: 'Custom Chatbot Avatars',
    description: 'Allow clients to upload their own chatbot avatars.',
    product: 'Surbo Chat',
    type: 'Client Ask',
    priority: 'High',
    ownerId: 'u4',
    stage: 'Testing',
    status: 'Active',
    stageUpdatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const STAGES = [
  'Roadmap', 'Planning', 'Execution', 'Testing', 'Deployed', 'Parked'
] as const;
