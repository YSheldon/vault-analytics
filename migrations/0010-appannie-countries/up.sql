CREATE SCHEMA appannie;

CREATE TABLE appannie.dm_countries (
  code TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
