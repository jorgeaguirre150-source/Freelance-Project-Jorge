-- Migracion: anade feedback (👍/👎) a una tabla `jobs` YA existente.
-- Ejecutar en Supabase -> SQL Editor si ya creaste la tabla antes.
alter table jobs add column if not exists feedback text;
create index if not exists jobs_feedback_idx on jobs (feedback);
