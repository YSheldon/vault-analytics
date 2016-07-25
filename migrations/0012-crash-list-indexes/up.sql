CREATE OR REPLACE FUNCTION sp.to_ymd(t text) RETURNS date AS $$
  SELECT to_date(t, 'YYYY-MM-DD'::text)
$$ LANGUAGE sql IMMUTABLE;

CREATE INDEX crashes_ts_idx ON dtl.crashes(ts);
CREATE INDEX crashes_ymd_idx ON dtl.crashes(sp.to_ymd(contents ->> 'year_month_day'::text));
CREATE INDEX crashes_multi_idx ON dtl.crashes(
  (contents->>'_version'),
  (contents->>'platform'),
  (contents-'metadata'->>'crash_reason'),
  (contents-'metadata'->>'cpu'),
  (contents-'metadata'->>'signature')
);
