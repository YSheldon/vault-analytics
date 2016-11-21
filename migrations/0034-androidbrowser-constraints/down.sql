ALTER TABLE dw.fc_usage_month DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
ALTER TABLE dw.fc_usage DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
