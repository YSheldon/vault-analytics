DROP INDEX dtl.crashes_ts_idx;
DROP INDEX dtl.crashes_ymd_idx;
DROP INDEX dtl.crashes_multi_idx;

DROP FUNCTION sp.to_ymd(text);
