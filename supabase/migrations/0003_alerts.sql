alter table favorites add column email text;
alter table favorites add column alert_threshold numeric default 8;
alter table favorites add column unsubscribe_token text unique default encode(gen_random_bytes(24), 'hex');
alter table favorites add column last_alerted_at timestamptz;
alter table favorites add column last_alerted_score numeric;

create index favorites_email_idx on favorites (email) where email is not null;

create policy "Public update access" on favorites for update using (true) with check (true);
