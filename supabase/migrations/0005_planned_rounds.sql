-- Planned rounds: a user tells us they're playing at a specific
-- course + tee time. We watch that tee-hour's forecast and warn
-- them if the score drops below their threshold, but only within
-- the 24 hours leading up to the tee time.

create table planned_rounds (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  email text not null,
  tee_time timestamptz not null,
  alert_threshold numeric not null default 7,
  unsubscribe_token text unique default encode(gen_random_bytes(24), 'hex'),
  notified_at timestamptz,
  notified_score numeric,
  created_at timestamptz not null default now()
);

create index planned_rounds_tee_time_idx on planned_rounds (tee_time);
create index planned_rounds_email_idx on planned_rounds (email);

alter table planned_rounds enable row level security;

create policy "Public read access" on planned_rounds for select using (true);
create policy "Public insert access" on planned_rounds for insert with check (true);
