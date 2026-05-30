import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Job = {
  id: string;
  source: string | null;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  salary: string | null;
  score: number | null;
  reason: string | null;
  draft: string | null;
  status: string;
  feedback: string | null; // 'up' | 'down' | null
  created_at: string;
};
