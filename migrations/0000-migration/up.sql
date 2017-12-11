create schema meta;

create table meta.migrations (
  id text not null primary key,
  description text not null
);
