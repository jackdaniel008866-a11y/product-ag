import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const VITE_SUPABASE_URL = envText.match(/VITE_SUPABASE_URL=(.*)/)[1].replace(/["']/g, '').trim();
const VITE_SUPABASE_ANON_KEY = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].replace(/["']/g, '').trim();

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function fix() {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
     console.error('Error fetching users', error);
     return;
  }
  
  const rogueUsers = users.filter(u => u.name === 'Sahil Asgher' || u.name === 'NV VFirst');
  
  if (rogueUsers.length === 0) {
      console.log("No rogue users found.");
  }

  for (const user of rogueUsers) {
      console.log(`Deleting user: ${user.name} (${user.id})`);
      const { error: delError } = await supabase.from('users').delete().eq('id', user.id);
      if (delError) {
          console.error(`Failed to delete ${user.id}:`, delError);
      } else {
          console.log(`Successfully deleted ${user.name}`);
      }
  }

  console.log(`Done processing.`);
  process.exit(0);
}

fix();
