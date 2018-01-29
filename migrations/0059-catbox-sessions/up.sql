CREATE SCHEMA svr;

CREATE UNLOGGED TABLE IF NOT EXISTS svr.sessions (
    id     text           NOT NULL PRIMARY KEY,
    item   JSON           NOT NULL,
    stored bigint         NOT NULL,
    ttl    bigint         NOT NULL
);
