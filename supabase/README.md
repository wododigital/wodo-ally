# Database Setup

Run these SQL files in Supabase SQL Editor in order:

1. **migrations/001_schema.sql** - Creates all tables, RLS policies, indexes, and sequences
2. **seed.sql** - Inserts test data (clients, invoices, projects, payments, expense categories)

## Steps
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Copy contents of `001_schema.sql` and run it
4. Copy contents of `seed.sql` and run it

The app should then be ready to use with test data.
