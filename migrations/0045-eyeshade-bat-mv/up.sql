CREATE MATERIALIZED VIEW dw.fc_bat_wallets_mv AS
SELECT
  created,
  wallets,
  balance,
  funded
FROM
( SELECT
  created,
  COUNT(1) as wallets,
  SUM(financial_balance) as balance,
  ( SELECT count(1) FROM dtl.bat_eyeshade_wallets WHERE created = EW.created and financial_balance > 0) AS funded
FROM dtl.bat_eyeshade_wallets EW
GROUP BY created ) VW
;
