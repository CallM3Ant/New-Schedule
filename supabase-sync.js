/* ==========================================================================
   Scheduly — Supabase sync bridge
   Separate `type="module"` file so it can use ES `import`; exposes a plain
   `window.ScheduleSync` object for app.js (a regular classic script) to
   call. app.js never touches Supabase directly.

   >>> SETUP REQUIRED (~3 minutes, no "production mode" needed) <<<
   1. Go to https://supabase.com -> New project. Pick any DB password
      (you won't need it here) and wait ~2 min for it to provision.
   2. Project Settings (gear icon) -> API -> copy the "Project URL" and
      the "anon public" key into SUPABASE_URL / SUPABASE_ANON_KEY below.
   3. Open the SQL Editor (left sidebar) -> New query -> paste and run:

        create table schedule_sync (
          id text primary key,
          templates jsonb,
          plans jsonb,
          updated_at timestamptz default now()
        );

      (If you already created this table before the `plans` column was
      added, just run: alter table schedule_sync add column if not
      exists plans jsonb;)

      Do NOT click "Enable RLS" on this table. This app has no real auth —
      just the one shared password gating the UI — so Row Level Security
      isn't doing anything for us here; leaving it off lets the anon key
      read/write freely, which is what we want. (If it ever gets enabled
      by accident, undo it with: alter table schedule_sync disable row
      level security;)
   That's it — no server, no edge functions, nothing to deploy.
   ========================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- fill these in from your Supabase project's API settings ----
const SUPABASE_URL = "https://guvxnytdthpqhqttijvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dnhueXRkdGhwcWhxdHRpanZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDYyMzIsImV4cCI6MjEwMzY4MjIzMn0.BgYyyYxCcRvOWXtAzqb2TTibe-_xSsZaSEIdKHiJ_i4";

// Single shared row holding everyone's templates AND plans.
// (One password, one shared dataset in mind — if you ever want per-user
// syncing, key rows by a user id instead of this fixed constant.)
const ROW_ID = "shared";

let client = null;
function ensureClient() {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

async function pushAll({ templates, plans }) {
  const supabase = ensureClient();
  const { error } = await supabase
    .from("schedule_sync")
    .upsert({ id: ROW_ID, templates, plans, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function pullAll() {
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from("schedule_sync")
    .select("templates, plans")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    templates: Array.isArray(data.templates) ? data.templates : null,
    plans: data.plans && typeof data.plans === "object" ? data.plans : null,
  };
}

window.ScheduleSync = { pushAll, pullAll };