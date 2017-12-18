INSERT INTO meta.migrations (id, description) VALUES ('0052', 'Update usage materialized view with ref field');

DROP MATERIALIZED VIEW dw.fc_usage_platform_mv;
CREATE MATERIALIZED VIEW dw.fc_usage_platform_mv AS
SELECT
  ymd,
  -- merge unknown and linux platforms
  CASE WHEN platform = 'unknown' THEN 'linux' ELSE platform END AS platform,
  channel,
  version,
  first_time,
  ref,
  SUM(total) AS total
FROM dw.fc_usage
GROUP BY
  ymd,
  CASE WHEN platform = 'unknown' THEN 'linux' ELSE platform END,
  channel,
  version,
  first_time,
  ref
;
