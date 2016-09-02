CREATE TABLE dw.fc_eyeshade_wallets (
  ymd         DATE    NOT NULL,
  total       BIGINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (ymd)
);

