-- Performance metrics: six tracked numbers per subject per 28-day period.
-- A subject is a person (subject_id = user id) or a store (subject_id = store id).
-- Additive only.

create table if not exists performance_metrics (
  id            text primary key,
  subject_type  text not null check (subject_type in ('person', 'store')),
  subject_id    text not null,
  fiscal_year   int  not null,
  period_number int  not null,
  nsnu          numeric,
  conversion    numeric,
  demo_rate     numeric,
  demo_close    numeric,
  arch_supports numeric,
  demo_ticket   numeric,
  note          text,
  updated_by    text,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (subject_type, subject_id, fiscal_year, period_number)
);

create index if not exists performance_metrics_subject_idx
  on performance_metrics (subject_type, subject_id, fiscal_year desc, period_number desc);

create index if not exists performance_metrics_period_idx
  on performance_metrics (fiscal_year, period_number);
