import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function runBackup() {
  console.log("Starting Backup Process...");

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

  if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const backup = {};

  // Fetch all Users
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (userErr) throw userErr;
  backup.users = users;

  // Fetch all Initiatives
  const { data: initiatives, error: initErr } = await supabase.from('initiatives').select('*');
  if (initErr) throw initErr;
  backup.initiatives = initiatives;

  // Fetch all Notifications
  const { data: notifications, error: notifErr } = await supabase.from('notifications').select('*');
  if (notifErr) throw notifErr;
  backup.notifications = notifications;

  backup.metadata = {
    exportedAt: new Date().toISOString(),
    totalUsers: users?.length || 0,
    totalInitiatives: initiatives?.length || 0,
    totalNotifications: notifications?.length || 0
  };

  const filename = `product_os_backup_${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`\n\x1b[32mSuccessfully exported backup to ${filename}\x1b[0m`);
  console.log(`Contains:`);
  console.log(`- ${users?.length || 0} Users`);
  console.log(`- ${initiatives?.length || 0} Initiatives`);
  console.log(`- ${notifications?.length || 0} Notifications`);
  console.log(`\nYou can send this file safely to developers for instant database restoration!`);
}

runBackup().catch(err => {
  console.error("Backup failed!", err);
  process.exit(1);
});
