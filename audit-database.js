const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://wtyjsqktcvbbjlewxrng.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0eWpzcWt0Y3ZiYmpsZXd4cm5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE5MTEyNiwiZXhwIjoyMDkyNzY3MTI2fQ.TdHw88tH6bVWgczXWNtXirzfWoMQc8aK3svviSqBH_Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditDatabase() {
  console.log('🔍 AUDITING SUPABASE DATABASE SCHEMA...\n');

  const tableNames = [
    'users',
    'chamas',
    'members',
    'contributions',
    'loans',
    'payments',
    'fines',
    'meetings',
    'meeting_attendance',
    'announcements',
    'reminders',
    'member_wallets',
    'monthly_contribution_summary',
    'contribution_insights',
    'automation_settings',
    'contribution_tracking',
    'auto_reminders',
    'auto_fines',
  ];

  console.log('📋 TABLE STATUS:\n');

  for (const tableName of tableNames) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${tableName.padEnd(30)} - TABLE NOT FOUND`);
      } else if (error) {
        console.log(`⚠️  ${tableName.padEnd(30)} - ${error.message}`);
      } else {
        console.log(`✅ ${tableName.padEnd(30)} - EXISTS (${count} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${tableName.padEnd(30)} - ERROR: ${e.message}`);
    }
  }

  console.log('\n\n📊 GETTING FIRST ROW FROM EACH TABLE (SCHEMA INSPECTION):\n');

  for (const tableName of tableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        continue;
      } else if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`${tableName}:`);
        console.log(`  Columns: ${columns.join(', ')}`);
        console.log();
      }
    } catch (e) {
      // Skip
    }
  }

  console.log('\n✅ AUDIT COMPLETE');
}

auditDatabase().catch(console.error);
