ALTER TABLE dw.fc_fastly_usage DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_fastly_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux', 'winia32', 'androidbrowser' ) );

ALTER TABLE dw.fc_fastly_calendar_month_usage DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_fastly_calendar_month_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'android', 'ios', 'unknown', 'linux', 'winia32', 'androidbrowser' ) );
