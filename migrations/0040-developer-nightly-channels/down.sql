ALTER TABLE dw.fc_usage DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_usage_exceptions ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_crashes DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_crashes ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_usage_month DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_fastly_usage DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_fastly_calendar_month_usage DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_fastly_calendar_month_usage ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_daily_telemetry DROP CONSTRAINT valid_channels_fk;
ALTER TABLE dw.fc_daily_telemetry ADD CONSTRAINT valid_channel CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

DROP TABLE dtl.channels;
