CREATE TABLE dw.fc_crashes (
  ymd         DATE    NOT NULL,
  platform    TEXT    NOT NULL,
  version     TEXT    NOT NULL,
  total       BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version)
);

ALTER TABLE dw.fc_crashes ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_crashes ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown' ) );
