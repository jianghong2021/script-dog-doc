-- 脚本分享站 D1 表结构
-- 执行： npx wrangler d1 execute script-dog-doc --file=./schema.sql --remote

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  nickname      TEXT,
  role          TEXT NOT NULL DEFAULT 'user',    -- user | admin
  status        TEXT NOT NULL DEFAULT 'active',  -- active | disabled
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scripts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  author      TEXT,
  version     TEXT,
  script_type TEXT,
  matches     TEXT,
  tags        TEXT,
  icon        TEXT,
  data_key    TEXT NOT NULL,                      -- R2 中原始导出 JSON 的对象键
  status      TEXT NOT NULL DEFAULT 'published',  -- published | offline
  downloads   INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS script_images (
  id           TEXT PRIMARY KEY,
  script_id    TEXT NOT NULL,
  r2_key       TEXT NOT NULL,
  content_type TEXT,
  size         INTEGER,
  sort         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_user ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_images_script ON script_images(script_id);
