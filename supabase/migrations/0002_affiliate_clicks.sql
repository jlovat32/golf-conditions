create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  partner text not null,
  place_id text,
  course_name text,
  score numeric,
  clicked_at timestamptz not null default now()
);

create index affiliate_clicks_partner_clicked_at_idx
  on affiliate_clicks (partner, clicked_at desc);

alter table affiliate_clicks enable row level security;

create policy "Public insert access" on affiliate_clicks for insert with check (true);
create policy "Public read access" on affiliate_clicks for select using (true);
