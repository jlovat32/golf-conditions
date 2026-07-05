create extension if not exists pgcrypto;

create table favorites (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table condition_history (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  score numeric not null,
  temp_f numeric,
  wind_mph numeric,
  precip_probability numeric,
  recorded_at timestamptz not null default now()
);

create index condition_history_place_id_recorded_at_idx
  on condition_history (place_id, recorded_at desc);

alter table favorites enable row level security;
alter table condition_history enable row level security;

create policy "Public read access" on favorites for select using (true);
create policy "Public insert access" on favorites for insert with check (true);
create policy "Public delete access" on favorites for delete using (true);

create policy "Public read access" on condition_history for select using (true);
create policy "Public insert access" on condition_history for insert with check (true);
