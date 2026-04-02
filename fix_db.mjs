import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: users } = await supabase.from('users').select('*');
  console.log("USERS:", users);
  
  const { data: initiatives } = await supabase.from('initiatives').select('id, ownerId, title');
  const distinctOwners = [...new Set(initiatives.map(i => i.ownerId))];
  console.log("\nDISTINCT OWNER IDS in Initiatives:", distinctOwners);
}
run();
