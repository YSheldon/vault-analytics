CREATE TABLE dtl.publishers (
  publisher   text    not null primary key,
  created     bigint  not null,
  created_at  date    not null,
  verified    boolean not null,
  authorized  boolean not null,
  alexa_rank  bigint
);
