ALTER TABLE dw.fc_usage DROP CONSTRAINT fc_usage_pkey;
ALTER TABLE dw.fc_usage DROP COLUMN ref;
ALTER TABLE dw.fc_usage ADD PRIMARY KEY ( ymd, platform, version, first_time, channel );

ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT fc_usage_exceptions_pkey;
ALTER TABLE dw.fc_usage_exceptions DROP COLUMN ref;
ALTER TABLE dw.fc_usage_exceptions ADD PRIMARY KEY ( ymd, platform, version, first_time, channel );

ALTER TABLE dw.fc_usage_month DROP CONSTRAINT fc_usage_month_pkey;
ALTER TABLE dw.fc_usage_month DROP COLUMN ref;
ALTER TABLE dw.fc_usage_month ADD PRIMARY KEY ( ymd, platform, version, channel );

ALTER TABLE dw.fc_fastly_usage DROP CONSTRAINT fc_fastly_usage_pkey;
ALTER TABLE dw.fc_fastly_usage DROP COLUMN ref;
ALTER TABLE dw.fc_fastly_usage ADD PRIMARY KEY (ymd, platform, version, channel, first_time, country_code, dma);

ALTER TABLE dw.fc_fastly_calendar_month_usage DROP CONSTRAINT fc_fastly_calendar_month_usage_pkey;
ALTER TABLE dw.fc_fastly_calendar_month_usage DROP COLUMN ref;
ALTER TABLE dw.fc_fastly_calendar_month_usage ADD PRIMARY KEY (ymd, platform, version, channel, country_code, dma);

DELETE FROM meta.migrations WHERE id = '0051';
