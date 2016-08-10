CREATE MATERIALIZED VIEW dw.fc_crashes_dau_mv AS
SELECT
  CRS.ymd,
  CRS.version,
  CRS.platform,
  crashes,
  total,
  crashes / total AS crash_rate
FROM
( SELECT
  sp.to_ymd((contents->>'year_month_day'::text)) AS ymd,
  COALESCE(contents->>'_version', 'unknown')     AS version,
  sp.canonical_platform(
    COALESCE(contents->>'platform', 'unknown'),
    COALESCE(contents->'metadata'->>'cpu', 'unknown')
  )                                              AS platform,
  COUNT(*)                                       AS crashes
FROM dtl.crashes
WHERE
  sp.to_ymd((contents->>'year_month_day'::text)) > (current_timestamp - '60 days'::interval)
GROUP BY
  sp.to_ymd((contents->>'year_month_day'::text)),
  COALESCE(contents->>'_version', 'unknown'),
  sp.canonical_platform(
    COALESCE(contents->>'platform', 'unknown'),
    COALESCE(contents->'metadata'->>'cpu', 'unknown')
  )
) CRS JOIN (
  SELECT ymd, version, platform, sum(total) as total
  FROM dw.fc_usage
  GROUP BY ymd, version, platform
) USG ON CRs.ymd = USG.ymd AND CRS.version = USG.version AND CRS.platform = USG.platform
WHERE total > 10
;
