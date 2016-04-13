CREATE TABLE dw.fc_usage_month (
  ymd         DATE    NOT NULL,
  platform    TEXT    NOT NULL,
  version     TEXT    NOT NULL,
  channel     TEXT    NOT NULL,
  total       BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version, channel)
);

ALTER TABLE dw.fc_usage_month ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux' ) );
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );
