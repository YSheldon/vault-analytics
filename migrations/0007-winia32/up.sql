BEGIN;
ALTER TABLE dw.fc_usage DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_usage ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
COMMIT;

BEGIN;
ALTER TABLE dw.fc_crashes DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_crashes ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
COMMIT;

BEGIN;
ALTER TABLE dw.fc_usage_exceptions DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_usage_exceptions ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
COMMIT;

BEGIN;
ALTER TABLE dw.fc_usage_month DROP CONSTRAINT valid_platforms;
ALTER TABLE dw.fc_usage_month ADD CONSTRAINT valid_platforms CHECK ( platform IN ( 'osx', 'winx64', 'winia32', 'android', 'ios', 'unknown', 'linux' ) );
COMMIT;
