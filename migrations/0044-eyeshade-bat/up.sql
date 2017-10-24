CREATE TABLE dtl.bat_eyeshade_wallets (
  id                    TEXT    NOT NULL PRIMARY KEY,
  created_ts            BIGINT  NOT NULL,
  created               DATE    NOT NULL,
  updated_ts            BIGINT  NOT NULL,
  updated               DATE    NOT NULL,
  financial_balance     numeric NOT NULL DEFAULT 0,
  financial_spendable   numeric NOT NULL DEFAULT 0,
  financial_confirmed   numeric NOT NULL DEFAULT 0,
  financial_unconfirmed numeric NOT NULL DEFAULT 0
);
