-- ========================================
-- 潜能星图 - SQLite 数据库模式
-- ========================================
PRAGMA foreign_keys = ON;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL DEFAULT '测评用户',
  avatar TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  identity_type TEXT CHECK(identity_type IN ('student', 'successor')) DEFAULT 'student',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('super_admin', 'viewer')) DEFAULT 'viewer',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 用户认证方式表（支持多种登录方式绑定在一个账号）
CREATE TABLE IF NOT EXISTS user_auth_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  auth_type TEXT CHECK(auth_type IN ('phone', 'password')) NOT NULL,
  identifier TEXT NOT NULL,
  credential TEXT DEFAULT NULL,
  bound_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (auth_type, identifier)
);

-- 短信验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_expires ON sms_codes(expires_at);

-- 测评会话表
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  selected_questionnaires TEXT NOT NULL,
  ordered_questionnaires TEXT NOT NULL,
  current_index INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('in_progress', 'completed', 'submitted', 'approved', 'rejected')) DEFAULT 'in_progress',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_session_user_status ON assessment_sessions(user_id, status);

-- 测评记录表
CREATE TABLE IF NOT EXISTS assessment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id INTEGER DEFAULT NULL,
  questionnaire_id TEXT NOT NULL,
  questionnaire_name TEXT NOT NULL,
  answers TEXT NOT NULL,
  score_result TEXT NOT NULL,
  ai_report TEXT DEFAULT NULL,
  review_status TEXT CHECK(review_status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  review_comment TEXT DEFAULT NULL,
  reviewed_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_record_user ON assessment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_record_session ON assessment_records(session_id);
CREATE INDEX IF NOT EXISTS idx_record_q ON assessment_records(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_record_time ON assessment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_record_review ON assessment_records(review_status);

-- 综合报告表
CREATE TABLE IF NOT EXISTS comprehensive_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  questionnaires_completed TEXT NOT NULL,
  score_summary TEXT NOT NULL,
  report_content TEXT NOT NULL DEFAULT '',
  report_html TEXT DEFAULT NULL,
  docx_path TEXT DEFAULT NULL,
  report_type TEXT CHECK(report_type IN ('student', 'successor')) DEFAULT 'student',
  report_serial_no INTEGER DEFAULT NULL,
  comprehensive_score NUMERIC NOT NULL,
  review_status TEXT CHECK(review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  review_comment TEXT DEFAULT NULL,
  reviewed_at TEXT DEFAULT NULL,
  reviewed_by INTEGER DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_report_user ON comprehensive_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON comprehensive_reports(review_status);

-- 插入默认管理员 (密码: admin123)
INSERT OR IGNORE INTO admins (username, password_hash, role)
VALUES ('admin', '$2b$10$N07.AIugRBr4sGYJx84PxeQePL.gK9pX2dC7J5r5ymAPHVRW5RPoe', 'super_admin');
