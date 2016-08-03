CREATE MATERIALIZED VIEW dw.fc_crashes_mv AS
SELECT
  sp.to_ymd((contents->>'year_month_day'::text))             AS ymd,
  COALESCE(contents->>'_version', 'unknown')                 AS version,
  COALESCE(contents->>'platform', 'unknown')                 AS platform,
  COALESCE(contents->'metadata'->>'crash_reason', 'unknown') AS crash_reason,
  COALESCE(contents->'metadata'->>'cpu', 'unknown')          AS cpu,
  COALESCE(contents->'metadata'->>'signature', 'unknown')    AS signature,
  COUNT(*)                                                   AS total
FROM dtl.crashes
WHERE
  sp.to_ymd((contents->>'year_month_day'::text)) > (current_timestamp - '60 days'::interval)
GROUP BY
  sp.to_ymd((contents->>'year_month_day'::text)),
  COALESCE(contents->>'_version', 'unknown'),
  COALESCE(contents->>'platform', 'unknown'),
  COALESCE(contents->'metadata'->>'crash_reason', 'unknown'),
  COALESCE(contents->'metadata'->>'cpu', 'unknown'),
  COALESCE(contents->'metadata'->>'signature', 'unknown')
;
