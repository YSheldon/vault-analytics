ALTER TABLE dw.fc_usage ADD COLUMN channel TEXT DEFAULT 'dev' NOT NULL;
ALTER TABLE dw.fc_usage DROP CONSTRAINT fc_usage_pkey;
ALTER TABLE dw.fc_usage ADD PRIMARY KEY ( ymd, platform, version, first_time, channel );
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_usage_exceptions ADD COLUMN channel TEXT DEFAULT 'dev' NOT NULL;
ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT fc_usage_exceptions_pkey;
ALTER TABLE dw.fc_usage_exceptions ADD PRIMARY KEY ( ymd, platform, version, first_time, channel );
ALTER TABLE dw.fc_usage_exceptions ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );

ALTER TABLE dw.fc_crashes ADD COLUMN channel TEXT DEFAULT 'dev' NOT NULL;
ALTER TABLE dw.fc_crashes DROP CONSTRAINT fc_crashes_pkey;
ALTER TABLE dw.fc_crashes ADD PRIMARY KEY ( ymd, platform, version, channel );
ALTER TABLE dw.fc_crashes ADD CONSTRAINT valid_channels CHECK ( channel IN ( 'dev', 'beta', 'stable' ) );
