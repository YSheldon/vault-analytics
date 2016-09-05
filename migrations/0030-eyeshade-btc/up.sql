CREATE TABLE dw.btc_quotes (
  currency_code TEXT           NOT NULL PRIMARY KEY,
  quote         NUMERIC(12, 6) NOT NULL
);
