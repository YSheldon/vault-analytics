DROP TABLE dw.fc_daily_publishers;

CREATE TABLE dw.fc_daily_publishers (
  ymd         DATE           NOT NULL,
  total       BIGINT         NOT NULL DEFAULT 0,
  verified    BIGINT         NOT NULL DEFAULT 0,
  authorized  BIGINT         NOT NULL DEFAULT 0,
  irs         BIGINT         NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd)
);
