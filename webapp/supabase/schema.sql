-- Daily Freelance Hunter — esquema Supabase
-- Ejecuta esto en Supabase -> SQL Editor

create table if not exists jobs (
  id          uuid primary key default gen_random_uuid(),
  dedup_key   text unique not null,
  source      text,
  title       text not null,
  company     text,
  location    text,
  url         text,
  salary      text,
  description text,
  score       int,
  reason      text,
  draft       text,
  status      text not null default 'new',
  feedback    text,                 -- 'up' | 'down' | null  (aprende tu gusto)
  created_at  timestamptz not null default now()
);

create index if not exists jobs_score_idx  on jobs (score desc);
create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_created_idx on jobs (created_at desc);

-- RLS: el acceso va siempre por el backend con la service_role key
-- (que bypassa RLS). Mantenemos RLS activado y sin politicas publicas.
alter table jobs enable row level security;
