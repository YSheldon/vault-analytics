CREATE TABLE dw.dm_platform (
  platform TEXT    NOT NULL PRIMARY KEY,
  mobile   BOOLEAN NOT NULL,
  vendor   TEXT    NOT NULL
);

INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('osx', 'f', 'apple');
INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('winia32', 'f', 'microsoft');
INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('winx64', 'f', 'microsoft');
INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('linux', 'f', 'various');
INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('ios', 't', 'apple');
INSERT INTO dw.dm_platform(platform, mobile, vendor) VALUES ('android', 't', 'google');
