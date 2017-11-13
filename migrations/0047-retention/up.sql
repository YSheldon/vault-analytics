CREATE OR REPLACE FUNCTION month_diff(d1 date, d2 date) RETURNS bigint AS $$
BEGIN
  RETURN (DATE_PART('year', d1)  - DATE_PART('year', d2)) * 12 +
         (DATE_PART('month', d1) - DATE_PART('month', d2));
END;
$$
LANGUAGE plpgsql;

create materialized view dw.fc_retention_month_mv as
select
  platform,
  channel,
  ref,
  moi,
  month_delta,
  average as current,
  max(average) over (partition by platform, channel, ref, moi, 0) starting,
  average / max(average) over (partition by platform, channel, ref, moi, 0) as retained_percentage
from (
select
  platform as platform,
  channel as channel,
  ref as ref,
  to_char(woi, 'YYYY-MM') || '-01' as moi,
  month_diff((to_char(ymd, 'YYYY-MM') || '-01')::date, (to_char(woi, 'YYYY-MM') || '-01')::date) month_delta,
  avg(total) as average
from dw.fc_retention_woi
where month_diff((to_char(ymd, 'YYYY-MM') || '-01')::date, (to_char(woi, 'YYYY-MM') || '-01')::date) >= 0
group by
  platform,
  channel,
  ref,
  to_char(woi, 'YYYY-MM') || '-01',
  month_diff((to_char(ymd, 'YYYY-MM') || '-01')::date, (to_char(woi, 'YYYY-MM') || '-01')::date)
order by
  platform,
  channel,
  ref,
  to_char(woi, 'YYYY-MM') || '-01',
  month_diff((to_char(ymd, 'YYYY-MM') || '-01')::date, (to_char(woi, 'YYYY-MM') || '-01')::date)
) I;

