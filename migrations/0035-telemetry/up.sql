CREATE TABLE dw.fc_daily_telemetry (
  ymd         DATE           NOT NULL,
  platform    TEXT           NOT NULL,
  version     TEXT           NOT NULL,
  channel     TEXT           NOT NULL,
  measure     TEXT           NOT NULL,
  machine     TEXT           NOT NULL,
  average     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  stddev      NUMERIC(12, 6) NOT NULL DEFAULT 0,
  minimum     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  maximum     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  quant25     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  quant75     NUMERIC(12, 6) NOT NULL DEFAULT 0,
  samples     BIGINT         NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version, channel, measure, machine)
);

ALTER TABLE dw.fc_daily_telemetry ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_daily_telemetry ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux', 'androidbrowser' ) );
ALTER TABLE dw.fc_daily_telemetry ADD CONSTRAINT valid_channel CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );
