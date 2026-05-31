# Automation Setup — n8n agent + dashboard

The recurring engine lives in the repo `Freelance-Project-Jorge` and in `daily_freelance_hunter.n8n.json` (this folder).

## Daily flow
1. **08:30** — n8n runs: ingest 7 global sources + 16 elite-company ATS boards → AI scoring (Haiku) vs profile → drafts (Sonnet) → upsert to Supabase.
2. **~09:00** — sends 2 emails to `aguirre_coslada@hotmail.com`: General + 🏆 Fresh News (elite companies).
3. Dashboard (Vercel + Supabase): `/top` (elite) and `/` (general) — filters, 1-click apply, pipeline, 👍/👎 feedback.

## Setup (one-time)
- Supabase: run `webapp/supabase/schema.sql`.
- n8n (Docker): import `daily_freelance_hunter.n8n.json`; env `ANTHROPIC_API_KEY`, `ADZUNA_*`, `SUPABASE_*`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`; SMTP credential (Gmail App Password, from `jorgeaguirre150@gmail.com`).
- Vercel: deploy `webapp/` (Root = webapp) with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ACCESS_PASSWORD`.
- Full guide: `DEPLOY.md` in the repo.

## Tuning
- Quality threshold (78), elite-company list, rate floor (295) → editable in `code_2_ai.js` / `code_1_ingest.js`.
