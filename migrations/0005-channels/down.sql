ALTER TABLE dw.fc_usage DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_usage DROP CONSTRAINT fc_usage_pkey;
ALTER TABLE dw.fc_usage ADD PRIMARY KEY ( ymd, platform, version, first_time );
ALTER TABLE dw.fc_usage DROP COLUMN channel;

ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT fc_usage_exceptions_pkey;
ALTER TABLE dw.fc_usage_exceptions ADD PRIMARY KEY ( ymd, platform, version, first_time );
ALTER TABLE dw.fc_usage_exceptions DROP COLUMN channel;

ALTER TABLE dw.fc_crashes DROP CONSTRAINT valid_channels;
ALTER TABLE dw.fc_crashes DROP CONSTRAINT fc_crashes_pkey;
ALTER TABLE dw.fc_crashes ADD PRIMARY KEY ( ymd, platform, version );
ALTER TABLE dw.fc_crashes DROP COLUMN channel;
