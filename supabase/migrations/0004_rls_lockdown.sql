-- Tighten RLS on public-facing tables. All mutations that happen from the
-- server (cron alerts marking last_alerted_at, unsubscribe nulling the
-- email) must go through the service_role key, which bypasses RLS.
-- Anon clients can still read, and can still insert new favorites /
-- history rows / affiliate click logs — but they cannot modify or
-- delete existing rows.

drop policy "Public update access" on favorites;
drop policy "Public delete access" on favorites;

-- condition_history is append-only from the anon client. Nothing to drop
-- there since we never created update/delete policies.

-- affiliate_clicks is also append-only. Nothing to drop.
