import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhecnqaejsukulaktjob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZWNucWFlanN1a3VsYWt0am9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU5NDQ3NiwiZXhwIjoyMDcyMTcwNDc2fQ.tq3CcavGP4qDlqYrC62ptW0jUeqm-FpK1T9IFdk_Y38';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  console.log('Checking if profiles table exists...\n');

  // Try to query the profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying profiles table:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    return;
  }

  console.log('✅ Profiles table exists!');
  console.log('Data:', data);

  // Check table structure using SQL query
  console.log('\nChecking table columns...');
  const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position;
    `
  });

  if (colError) {
    // Try direct SQL query instead
    const { data: cols, error: sqlError } = await supabase
      .schema('information_schema')
      .from('columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');

    if (!sqlError && cols) {
      console.log('\nTable columns:');
      cols.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Check for required columns
      const requiredCols = ['account_status', 'warning_count', 'reputation_score'];
      console.log('\nChecking for required columns:');
      requiredCols.forEach(col => {
        const exists = cols.some(c => c.column_name === col);
        console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      });
    } else {
      console.log('Could not retrieve column information');
    }
  }

  // Try to get count
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log('\nTotal rows:', count);
  }
}

checkProfilesTable().then(() => {
  console.log('\nCheck complete.');
  process.exit(0);
}).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
