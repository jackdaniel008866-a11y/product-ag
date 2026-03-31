import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const INITIAL_INITIATIVES = [
  {
    id: `init-${Math.random().toString(36).substring(2, 9)}`,
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
    id: `init-${Math.random().toString(36).substring(2, 9)}`,
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
    id: `init-${Math.random().toString(36).substring(2, 9)}`,
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
    id: `init-${Math.random().toString(36).substring(2, 9)}`,
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

async function runImport() {
  console.log("Starting Migration Process...");

  // Parse .env.local natively without needing external packages
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const splitIndex = line.indexOf('=');
      if (splitIndex > 0) {
        const key = line.substring(0, splitIndex).trim();
        let value = line.substring(splitIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value;
      }
    }
  });

  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('initiatives').insert(INITIAL_INITIATIVES).select();
  
  if (error) {
    console.error("Migration Crash! API Rejected the format:", error);
    process.exit(1);
  }

  console.log(`\n\x1b[32mSuccessfully deployed ${data.length} static local initiatives perfectly into your cloud production database!\x1b[0m`);
}

runImport().catch(err => {
  console.error("Critical Failure:", err);
  process.exit(1);
});
