CREATE TABLE dw.fc_retention_woi (
  ymd       date   not null,
  platform  text   not null,
  version   text   not null,
  channel   text   not null,
  woi       date   not null,
  ref       text   not null default 'none',
  total     bigint not null default 0
);

ALTER TABLE ONLY dw.fc_retention_woi ADD CONSTRAINT fc_retention_woi_pkey PRIMARY KEY (ymd, platform, version, channel, woi, ref);

ALTER TABLE dw.fc_retention_woi ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);
ALTER TABLE dw.fc_retention_woi ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'androidbrowser', 'ios', 'unknown', 'linux', 'winia32' ) );
ALTER TABLE dw.fc_retention_woi ADD CONSTRAINT version_format CHECK ((version ~ '^\d+\.\d+\.\d+$'::text))
