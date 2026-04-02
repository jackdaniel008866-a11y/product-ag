import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const VITE_SUPABASE_URL = envText.match(/VITE_SUPABASE_URL=(.*)/)[1].replace(/["']/g, '').trim();
const VITE_SUPABASE_ANON_KEY = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].replace(/["']/g, '').trim();

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function list() {
  const { data: users, error } = await supabase.from('users').select('id, name');
  if (error) {
     console.error('Error fetching users', error);
     process.exit(1);
  }
  console.log("");
  console.log("=== Active Users ===");
  users.forEach(u => console.log(`- ${u.name}`));
  console.log(`Total Count: ${users.length}`);
  console.log("====================");
  process.exit(0);
}
list();
