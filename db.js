const Database = require("better-sqlite3");
const db = new Database("agent_logs.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    event_name TEXT,
    repository TEXT,
    issue_number INTEGER,
    pr_number INTEGER,
    user_input TEXT,
    agent_output TEXT,
    action_type TEXT,
    success INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pr_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    repository TEXT,
    pr_number INTEGER,
    commit_sha TEXT,
    file_path TEXT,
    line_number INTEGER,
    comment TEXT,
    severity TEXT
  )
`);

function saveLog(eventName, repository, issueNumber, prNumber, userInput, agentOutput, actionType, success) {
  const stmt = db.prepare(`
    INSERT INTO logs (timestamp, event_name, repository, issue_number, pr_number, user_input, agent_output, action_type, success)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    new Date().toISOString(),
    eventName,
    repository,
    issueNumber || null,
    prNumber || null,
    userInput,
    agentOutput,
    actionType,
    success
  );
}

function savePrReview(repository, prNumber, commitSha, filePath, lineNumber, comment, severity) {
  const stmt = db.prepare(`
    INSERT INTO pr_reviews (timestamp, repository, pr_number, commit_sha, file_path, line_number, comment, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    new Date().toISOString(),
    repository,
    prNumber,
    commitSha,
    filePath,
    lineNumber || null,
    comment,
    severity
  );
}

function getRecentLogs(limit = 10) {
  const stmt = db.prepare(`
    SELECT timestamp, event_name, repository, issue_number, pr_number, user_input, agent_output, action_type, success
    FROM logs
    ORDER BY id DESC
    LIMIT ?
  `);

  return stmt.all(limit);
}

function getRecentPrReviews(limit = 10) {
  const stmt = db.prepare(`
    SELECT timestamp, repository, pr_number, commit_sha, file_path, line_number, comment, severity
    FROM pr_reviews
    ORDER BY id DESC
    LIMIT ?
  `);

  return stmt.all(limit);
}

function getSuccessRate() {
  const row = db.prepare(`
    SELECT COUNT(*) as total, SUM(success) as success_count
    FROM logs
  `).get();

  const total = row.total || 0;
  const successCount = row.success_count || 0;

  return {
    total,
    success_count: successCount,
    success_rate: total ? Number(((successCount / total) * 100).toFixed(2)) : 0
  };
}

module.exports = {
  saveLog,
  savePrReview,
  getRecentLogs,
  getRecentPrReviews,
  getSuccessRate
};