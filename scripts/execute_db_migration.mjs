import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const VITE_SUPABASE_URL = envText.match(/VITE_SUPABASE_URL=(.*)/)[1].replace(/["']/g, '').trim();
const VITE_SUPABASE_ANON_KEY = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].replace(/["']/g, '').trim();

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

const ID_MAPPINGS = {
  // Legacy -> Authentic UUIDs
  'u1': '12255c92-85a1-46ee-a61b-96041c82424a', // Sahil
  'u2': '15f68938-b608-4214-95fe-5c5ec6fbe498', // Deepjyoti Patar
  'u3': '867782c6-edfd-472a-b1fe-ec3aed9443d4', // Rajneesh Lakhera
  'u4': '4d76bd35-724b-4347-b4a2-ad29171b8069', // Nitin Verma
};

async function migrate() {
  console.log('--- DB MIGRATION: INITIATIVES ---');
  const { data: initiatives, error: initError } = await supabase.from('initiatives').select('id, ownerId, title');
  if (initError) throw initError;

  let updated = 0;
  for (const init of initiatives) {
     if (ID_MAPPINGS[init.ownerId]) {
         const newOwner = ID_MAPPINGS[init.ownerId];
         console.log(`Migrating Initiative [${init.title}] owner from legacy ${init.ownerId} to UUID ${newOwner}`);
         await supabase.from('initiatives').update({ ownerId: newOwner }).eq('id', init.id);
         updated++;
     }
  }
  console.log(`Total Initiatives Migrated: ${updated}`);

  console.log('\n--- DB MIGRATION: PURGE LEGACY USERS ---');
  // Attempt to delete specific legacy u1, u2, u3, u4 users from DB
  const legacyIds = Object.keys(ID_MAPPINGS);
  
  for (const l_id of legacyIds) {
      const { error: delErr } = await supabase.from('users').delete().eq('id', l_id);
      if (delErr) {
          console.error(`Failed to delete legacy user ${l_id}: `, delErr);
      } else {
          console.log(`Successfully purged legacy user ID: ${l_id} from database.`);
      }
  }
  
  console.log('\n=== CURRENT ACTIVE USERS IN DB ===');
  const { data: finalUsers } = await supabase.from('users').select('id, name');
  finalUsers.forEach(u => console.log(`${u.name} | [${u.id}]`));
  
  process.exit(0);
}

migrate();
