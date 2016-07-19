CREATE TABLE appannie.fc_inception_by_country (
  country_code TEXT   NOT NULL REFERENCES appannie.dm_countries(code) PRIMARY KEY,
  downloads    BIGINT NOT NULL DEFAULT 0,
  upgrades     BIGINT NOT NULL DEFAULT 0
);
