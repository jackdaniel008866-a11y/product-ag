import type { Initiative, User } from '../types';

export const USERS: Record<string, User> = {
  'u1': { id: 'u1', name: 'Nitin', initials: 'NV' },
  'u2': { id: 'u2', name: 'Deepjyoti', initials: 'DJ' },
  'u3': { id: 'u3', name: 'Rajneesh', initials: 'RJ' },
  'u4': { id: 'u4', name: 'Sahil', initials: 'SH' },
};

export const DEVELOPER_TEAMS = {
  'Front End Eng': ['Ausan', 'Pushpendra', 'Akshay Srivastava'],
  'Surbo Backend Eng': ['Bhanu', 'Ashish', 'Kartik', 'Faraz', 'Rahul Nagar', 'Akshay Bajetha'],
  'Botsup Backend Eng': ['Ankit', 'Lalit'],
  'QA': ['Amit- Surbo', 'Raj- Surbo', 'Varun- Botsup']
};

export const INITIAL_INITIATIVES: Initiative[] = [];

export const STAGES = [
  'Roadmap', 'Planning', 'Execution', 'Testing', 'Deployed', 'Parked'
] as const;
