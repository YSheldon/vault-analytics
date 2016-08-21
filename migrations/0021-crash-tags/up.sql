CREATE TABLE dtl.crash_tags_available (
  tag         TEXT NOT NULL PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE dtl.crash_tags (
  crash_id TEXT NOT NULL REFERENCES dtl.crashes(id),
  tag      TEXT NOT NULL REFERENCES dtl.crash_tags_available(tag),
  PRIMARY KEY(crash_id, tag)
);

ALTER TABLE dtl.crashes ADD COLUMN github_repo TEXT;
ALTER TABLE dtl.crashes ADD COLUMN github_issue_number TEXT;
