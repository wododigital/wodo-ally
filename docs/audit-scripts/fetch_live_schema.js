const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oaujoosmbgcgacosqlhe.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fetchSchema() {
  console.log('🔍 Fetching LIVE schema from Supabase using MCP...\n');

  try {
    // Fetch tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('❌ Tables error:', tablesError.message);
    } else {
      console.log(`✅ Found ${tables?.length || 0} LIVE tables`);
    }

    // Fetch views
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('*')
      .eq('table_schema', 'public');

    if (viewsError) {
      console.error('❌ Views error:', viewsError.message);
    } else {
      console.log(`✅ Found ${views?.length || 0} LIVE views`);
    }

    // Fetch columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Columns error:', columnsError.message);
    } else {
      console.log(`✅ Found ${columns?.length || 0} LIVE columns`);
    }

    console.log('\n✅ LIVE schema fetch via Supabase MCP complete!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`LIVE Data from Supabase:`);
    console.log(`  Tables: ${tables?.length}`);
    console.log(`  Views: ${views?.length}`);
    console.log(`  Columns: ${columns?.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fetchSchema();
