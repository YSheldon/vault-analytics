CREATE MATERIALIZED VIEW dw.fc_average_monthly_usage_mv AS
SELECT
  FC.ym || '-01' AS ymd,
  FC.platform,
  FC.channel,
  M.mau,
  D.average_dau,
  F.average_first_time
FROM
( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel
  FROM dw.fc_usage_month
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel ) FC JOIN
( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, SUM(total) AS mau
  FROM dw.fc_usage_month
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel ) M ON (FC.ym = M.ym AND FC.channel = M.channel AND FC.platform = M.platform) JOIN
( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, (SUM(total) / 30)::BIGINT AS average_dau
  FROM dw.fc_usage
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel ) D ON (FC.ym = D.ym AND FC.channel = D.channel AND FC.platform = D.platform) JOIN
( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, (SUM(total) / 30)::BIGINT as average_first_time
  FROM dw.fc_usage
  WHERE first_time
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel ) F ON (FC.ym = F.ym AND FC.channel = F.channel AND FC.platform = F.platform)
WHERE
  FC.ym >= '2016-02' AND
  FC.ym <> SUBSTRING(CURRENT_TIMESTAMP::TEXT, 0, 8)
;
