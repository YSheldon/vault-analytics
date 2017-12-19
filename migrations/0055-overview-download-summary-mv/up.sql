INSERT INTO meta.migrations (id, description) VALUES ( '0055', 'Platform downloads summary' );

CREATE MATERIALIZED VIEW dw.fc_platform_downloads_summary_mv AS
SELECT SM.platform, SM.count, PL.mobile, PL.vendor FROM (
SELECT
  sp.platform_mapping(FC.platform) AS platform,
  SUM(FC.total) AS count
FROM dw.fc_usage FC
WHERE
  FC.ymd >= '2016-01-26'::date AND
  first_time AND
  ( sp.platform_mapping(FC.platform) <> 'ios' AND sp.platform_mapping(FC.platform) <> 'android' AND sp.platform_mapping(FC.platform) <> 'androidbrowser' )
GROUP BY sp.platform_mapping(FC.platform)
  UNION
SELECT 'ios' AS platform, (SELECT SUM(downloads) FROM appannie.fc_inception_by_country) AS count
  UNION
SELECT 'android' AS platform, (SELECT SUM(downloads) FROM appannie.fc_android_inception_by_country) AS count
  UNION
  SELECT 'androidbrowser' AS platform, (SELECT SUM(total) FROM dw.fc_usage WHERE platform = 'androidbrowser' AND first_time) AS count
) SM JOIN dw.dm_platform PL ON SM.platform = PL.platform
ORDER BY PL.mobile, PL.vendor
;
