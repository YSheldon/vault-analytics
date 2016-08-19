CREATE TABLE dtl.object_types (
  object_type TEXT NOT NULL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  table_name  TEXT NOT NULL UNIQUE
);

INSERT INTO dtl.object_types(object_type, name, table_name) VALUES ('crash', 'crash', 'dtl.crashes');

CREATE TABLE dtl.fti (
  id          BIGSERIAL NOT NULL PRIMARY KEY,
  object_type TEXT      NOT NULL REFERENCES dtl.object_types(object_type),
  object_id   TEXT      NOT NULL,
  searchable  TSVECTOR  NOT NULL,
  UNIQUE(object_type, object_id)
);

CREATE INDEX fti_searchable ON dtl.fti USING GIN (searchable);
