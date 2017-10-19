CREATE TABLE dw.fc_ios_usage (
  ymd         DATE     NOT NULL,
  platform    TEXT     NOT NULL,
  version     TEXT     NOT NULL,
  first_time  BOOLEAN  NOT NULL,
  channel     TEXT     NOT NULL,
  woi         DATE     NOT NULL,
  ref         TEXT     NOT NULL,
  total       BIGINT   NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd, platform, version, first_time, channel, woi, ref)
);

ALTER TABLE dw.fc_ios_usage ADD CONSTRAINT version_format CHECK ( version ~ '^\d+\.\d+\.\d+$' );
ALTER TABLE dw.fc_ios_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux', 'winia32' ) );
ALTER TABLE dw.fc_ios_usage ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);
