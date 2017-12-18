INSERT INTO meta.migrations (id, description) VALUES ('0051', 'Add ref field to data warehouse fact tables');

ALTER TABLE dw.fc_usage ADD COLUMN ref TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE dw.fc_usage DROP CONSTRAINT fc_usage_pkey;
ALTER TABLE dw.fc_usage ADD PRIMARY KEY ( ymd, platform, version, first_time, channel, ref );

ALTER TABLE dw.fc_usage_exceptions ADD COLUMN ref TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT fc_usage_exceptions_pkey;
ALTER TABLE dw.fc_usage_exceptions ADD PRIMARY KEY ( ymd, platform, version, first_time, channel, ref );

ALTER TABLE dw.fc_usage_month ADD COLUMN ref TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE dw.fc_usage_month DROP CONSTRAINT fc_usage_month_pkey;
ALTER TABLE dw.fc_usage_month ADD PRIMARY KEY ( ymd, platform, version, channel, ref );

ALTER TABLE dw.fc_fastly_usage ADD COLUMN ref TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE dw.fc_fastly_usage DROP CONSTRAINT fc_fastly_usage_pkey;
ALTER TABLE dw.fc_fastly_usage ADD PRIMARY KEY (ymd, platform, version, channel, first_time, country_code, dma, ref);

ALTER TABLE dw.fc_fastly_calendar_month_usage ADD COLUMN ref TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE dw.fc_fastly_calendar_month_usage DROP CONSTRAINT fc_fastly_calendar_month_usage_pkey;
ALTER TABLE dw.fc_fastly_calendar_month_usage ADD PRIMARY KEY (ymd, platform, version, channel, country_code, dma, ref);
