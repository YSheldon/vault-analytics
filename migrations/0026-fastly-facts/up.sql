CREATE TABLE dw.fc_fastly_usage (
  ymd          DATE    NOT NULL,
  platform     TEXT    NOT NULL,
  version      TEXT    NOT NULL,
  channel      TEXT    NOT NULL,
  first_time   BOOLEAN NOT NULL,
  country_code TEXT    NOT NULL,
  dma          TEXT    NOT NULL,
  total        BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version, channel, first_time, country_code, dma)
);

ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );
ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux', 'winia32' ) );
