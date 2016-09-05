CREATE TABLE dtl.eyeshade_wallets (
  id                    TEXT   NOT NULL PRIMARY KEY,
  created_ts            BIGINT NOT NULL,
  created               DATE   NOT NULL,
  updated_ts            BIGINT NOT NULL,
  updated               DATE   NOT NULL,
  financial_balance     BIGINT NOT NULL DEFAULT 0,
  financial_spendable   BIGINT NOT NULL DEFAULT 0,
  financial_confirmed   BIGINT NOT NULL DEFAULT 0,
  financial_unconfirmed BIGINT NOT NULL DEFAULT 0
);
