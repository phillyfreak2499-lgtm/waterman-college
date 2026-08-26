-- Tableau / sheet sync: remember where a row came from, and keep a short log.

alter table performance_metrics
  add column if not exists source text not null default 'manual';

alter table performance_metrics
  add column if not exists synced_at timestamptz;

create table if not exists metrics_sync_log (
  id             text primary key,
  fiscal_year    int  not null,
  period_number  int  not null,
  source         text not null,
  matched        int  not null default 0,
  skipped        int  not null default 0,
  created_by     text not null,
  created_at     timestamptz not null default now()
);
