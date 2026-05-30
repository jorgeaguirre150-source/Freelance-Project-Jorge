-- Migracion: anade premium (empresas TOP) a una tabla `jobs` YA existente.
alter table jobs add column if not exists premium boolean default false;
create index if not exists jobs_premium_idx on jobs (premium);
