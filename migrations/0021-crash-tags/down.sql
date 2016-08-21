ALTER TABLE dtl.crashes DROP COLUMN github_issue_number;
ALTER TABLE dtl.crashes DROP COLUMN github_repo;

DROP TABLE dtl.crash_tags;
DROP TABLE dtl.crash_tags_available;
