CREATE TABLE dw.fc_usage (
  ymd         DATE    NOT NULL,
  platform    TEXT    NOT NULL,
  version     TEXT    NOT NULL,
  first_time  BOOLEAN NOT NULL,
  total       BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version, first_time)
);

ALTER TABLE dw.fc_usage ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown' ) );
