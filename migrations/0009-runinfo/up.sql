CREATE TABLE dtl.runinfo (
  run_id   BIGSERIAL      NOT NULL PRIMARY KEY,
  ts       TIMESTAMP      NOT NULL DEFAULT current_timestamp,
  id       TEXT           NOT NULL,
  duration NUMERIC(10, 1) NOT NULL
);
