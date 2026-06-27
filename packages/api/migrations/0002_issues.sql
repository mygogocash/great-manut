-- Issue domain

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY NOT NULL,
  team_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'none',
  state_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (state_id) REFERENCES workflow_states(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS issues_team_number_idx ON issues (team_id, number);
CREATE INDEX IF NOT EXISTS issues_team_active_idx ON issues (team_id, deleted_at);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY NOT NULL,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS labels_team_name_active_idx
  ON labels (team_id, name)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS issue_labels (
  id TEXT PRIMARY KEY NOT NULL,
  issue_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (label_id) REFERENCES labels(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS issue_labels_unique_active_idx
  ON issue_labels (issue_id, label_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS issue_assignees (
  id TEXT PRIMARY KEY NOT NULL,
  issue_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS issue_assignees_unique_active_idx
  ON issue_assignees (issue_id, user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS issue_comments (
  id TEXT PRIMARY KEY NOT NULL,
  issue_id TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS issue_comments_issue_idx ON issue_comments (issue_id, deleted_at);
