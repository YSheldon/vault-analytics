CREATE TABLE dtl.channels (
  channel       TEXT NOT NULL PRIMARY KEY,
  description   TEXT NOT NULL,
  label         TEXT NOT NULL
);

INSERT INTO dtl.channels (channel, description, label)
VALUES
  ('dev', 'Release channel', 'Release'),
  ('beta', 'Beta channel', 'Beta'),
  ('stable', 'Stable channel', 'Stable'),
  ('developer', 'Developer channel', 'Developer'),
  ('nightly', 'Nightly channel', 'Nightly')
;

ALTER TABLE dw.fc_usage DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_usage_exceptions ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

ALTER TABLE dw.fc_crashes DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_crashes ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

ALTER TABLE dw.fc_usage_month DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

ALTER TABLE dw.fc_fastly_usage DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

ALTER TABLE dw.fc_fastly_calendar_month_usage DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_fastly_calendar_month_usage ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);
ALTER TABLE dw.fc_daily_telemetry DROP CONSTRAINT valid_channel;
ALTER TABLE dw.fc_daily_telemetry ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);
