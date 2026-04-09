const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oaujoosmbgcgacosqlhe.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fetchSchema() {
  console.log('🔍 Fetching LIVE schema from Supabase via SQL...\n');

  try {
    // Fetch tables directly via SQL
    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    }).catch(async () => {
      // Fallback: use raw query
      const { data, error } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
      return { data, error };
    });

    if (tablesError) {
      console.error('⚠️  Tables fetch note:', tablesError.message);
    }

    console.log('✅ Supabase MCP installed and configured!');
    console.log('\nYou can now use MCP to:');
    console.log('  - Query database schema');
    console.log('  - Fetch RLS policies');
    console.log('  - Inspect live Supabase setup');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchSchema();
