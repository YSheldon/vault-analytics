DROP MATERIALIZED VIEW dw.fc_platform_downloads_summary_mv;

DELETE FROM meta.migrations WHERE id = '0055';
