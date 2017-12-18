INSERT INTO meta.migrations (id, description) VALUES ('0053', 'Add ref code to monthly average daily active users');

DROP MATERIALIZED VIEW dw.fc_average_monthly_usage_mv;
CREATE MATERIALIZED VIEW dw.fc_average_monthly_usage_mv AS
SELECT
  FC.ym || '-01' AS ymd,
  FC.platform,
  FC.channel,
  FC.ref,
  M.mau,
  COALESCE(D.average_dau, 0) AS average_dau,
  COALESCE(F.average_first_time, 0) AS average_first_time
FROM
( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, ref
  FROM dw.fc_usage_month
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel, ref ) FC LEFT JOIN

( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, ref, SUM(total) AS mau
  FROM dw.fc_usage_month
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel, ref ) M ON (FC.ym = M.ym AND FC.channel = M.channel AND FC.platform = M.platform AND FC.ref = M.ref) LEFT JOIN

( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, ref, COALESCE((SUM(total) / 30)::BIGINT, 0) AS average_dau
  FROM dw.fc_usage
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel, ref ) D ON (FC.ym = D.ym AND FC.channel = D.channel AND FC.platform = D.platform AND FC.ref = D.ref) LEFT JOIN

( SELECT SUBSTRING(ymd::text, 0, 8) AS ym, platform, channel, ref, COALESCE((SUM(total) / 30)::BIGINT, 0) as average_first_time
  FROM dw.fc_usage
  WHERE first_time
  GROUP BY SUBSTRING(ymd::text, 0, 8), platform, channel, ref ) F ON (FC.ym = F.ym AND FC.channel = F.channel AND FC.platform = F.platform AND FC.ref = F.ref)

WHERE
  FC.ym >= '2016-02' AND
  FC.platform <> 'linux' AND -- linux is denoted as unknown
  FC.ym <> SUBSTRING(CURRENT_TIMESTAMP::TEXT, 0, 8)
;
