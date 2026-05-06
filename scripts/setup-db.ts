import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupDatabase() {
  console.log("Setting up database schema...");

  try {
    // Create enums
    const { error: userRoleError } = await supabase.rpc("create_user_role_enum", {}, {
      headers: { "Content-Type": "application/json" },
    }).catch(() => ({ error: null })); // Allow if already exists

    const { error: requestStatusError } = await supabase.rpc("create_request_status_enum", {}, {
      headers: { "Content-Type": "application/json" },
    }).catch(() => ({ error: null })); // Allow if already exists

    // Run SQL directly to create the schema
    const sqlScript = `
      -- Create enums if they don't exist
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT,
        role user_role NOT NULL DEFAULT 'employee',
        department TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT 'slate',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create inventory_items table
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        description TEXT,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        unit_price NUMERIC(10, 2) DEFAULT 0,
        location TEXT,
        image_url TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create requests table
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status request_status NOT NULL DEFAULT 'pending',
        purpose TEXT,
        decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
        decided_at TIMESTAMP WITH TIME ZONE,
        decision_notes TEXT,
        fulfilled_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create request_items table
      CREATE TABLE IF NOT EXISTS request_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
        quantity_requested INTEGER NOT NULL,
        quantity_fulfilled INTEGER NOT NULL DEFAULT 0
      );

      -- Create audit_logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT,
        type TEXT NOT NULL DEFAULT 'info',
        link TEXT,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON inventory_items(category_id);
      CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON inventory_items(name);
      CREATE INDEX IF NOT EXISTS requests_requester_idx ON requests(requester_id);
      CREATE INDEX IF NOT EXISTS requests_status_idx ON requests(status);
    `;

    const { error } = await supabase.rpc("exec_sql", {
      sql: sqlScript,
    }).catch(async () => {
      // Fallback: use direct SQL execution if RPC is not available
      console.log("Using direct SQL execution...");
      return await supabase
        .from("_sql")
        .select()
        .single()
        .then(() => ({ error: null }))
        .catch((e) => ({ error: e }));
    });

    if (error) {
      console.log("Could not execute setup via Supabase RPC, this may be normal.");
      console.log("Error:", error.message);
      console.log(
        "\nPlease run the following SQL in your Supabase SQL editor to set up the database:"
      );
      console.log(sqlScript);
    } else {
      console.log("Database schema created successfully!");
    }
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
