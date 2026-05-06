# Database Setup Guide

This application uses Supabase as the database backend. Follow these steps to set up the database schema:

## Prerequisites

- Supabase account and project already set up
- Environment variables configured (SUPABASE_URL, etc.)

## Setup Steps

### Option 1: Use Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Create a new query
4. Copy the contents of `supabase/migrations/001_init_schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the schema creation

The migration will:
- Create the necessary PostgreSQL enums (user_role, request_status)
- Create all required tables (users, categories, inventory_items, requests, request_items, audit_logs, notifications)
- Set up proper foreign key relationships
- Create helpful indexes for performance

### Option 2: Use TypeScript Setup Script (Alternative)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the setup script:
   ```bash
   npx tsx scripts/setup-db.ts
   ```

## Verifying the Setup

After running the migration, you can verify the schema was created correctly:

1. In Supabase dashboard, go to **Table Editor**
2. You should see the following tables:
   - users
   - categories
   - inventory_items
   - requests
   - request_items
   - audit_logs
   - notifications

3. Check that you can see the enums:
   - Go to **SQL Editor**
   - Run: `SELECT * FROM pg_type WHERE typname IN ('user_role', 'request_status');`
   - You should see 2 results

## Important Notes

- The `users` table uses UUID as primary key (matches Supabase Auth user IDs)
- All timestamp columns use `TIMESTAMP WITH TIME ZONE` for consistency
- Foreign key relationships are set up with appropriate cascade/restrict rules
- The app includes error handling for when the database tables don't exist yet
- When users first log in, their profile will be created with default values

## Troubleshooting

**Error: "Failed query: select ... from 'users'..."**
- This means the tables haven't been created yet
- Run the SQL migration from Option 1 or Option 2 above

**Error: "Failed to fetch users table"**
- Verify that your SUPABASE_URL and POSTGRES_URL environment variables are set correctly
- Check that your Supabase project is active

**Connection timeout**
- Make sure your IP is allowed in Supabase firewall settings (if applicable)
- Check that your database is running in the Supabase dashboard
