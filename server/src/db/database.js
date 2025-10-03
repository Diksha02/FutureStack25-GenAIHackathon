import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "./taskpilot.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

let createdAtAvailable = false;
let promptAvailable = false;

// Initialize the database schema
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      plan TEXT NOT NULL
    );
  `);
  // Detect and add columns if missing
  try {
    const cols = db.prepare("PRAGMA table_info(schedules)").all();
    createdAtAvailable = cols.some((c) => c.name === "created_at");
    promptAvailable = cols.some((c) => c.name === "prompt");
    if (!createdAtAvailable) {
      // Add column without NOT NULL to maximize compatibility
      db.exec("ALTER TABLE schedules ADD COLUMN created_at TEXT");
      // Backfill existing rows with current UTC timestamp
      db.exec(
        "UPDATE schedules SET created_at = datetime('now') WHERE created_at IS NULL"
      );
      createdAtAvailable = true;
    }
    if (!promptAvailable) {
      db.exec("ALTER TABLE schedules ADD COLUMN prompt TEXT");
      promptAvailable = true;
    }
  } catch (_) {
    // Re-detect gracefully
    const cols2 = db.prepare("PRAGMA table_info(schedules)").all();
    createdAtAvailable = cols2.some((c) => c.name === "created_at");
    promptAvailable = cols2.some((c) => c.name === "prompt");
  }
};

const safeParsePlan = (planText) => {
  try {
    const parsed = JSON.parse(planText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// Function to save a schedule (explicitly sets created_at when available)
const saveScheduleToDb = (date, plan, prompt) => {
  // Local timestamp "YYYY-MM-DD HH:MM:SS"
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const createdAt = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  if (createdAtAvailable && promptAvailable) {
    const stmt = db.prepare(
      "INSERT INTO schedules (date, plan, prompt, created_at) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(date, plan, prompt || null, createdAt);
    return info.lastInsertRowid;
  }
  if (createdAtAvailable && !promptAvailable) {
    const stmt = db.prepare(
      "INSERT INTO schedules (date, plan, created_at) VALUES (?, ?, ?)"
    );
    const info = stmt.run(date, plan, createdAt);
    return info.lastInsertRowid;
  }
  if (!createdAtAvailable && promptAvailable) {
    const stmt = db.prepare(
      "INSERT INTO schedules (date, plan, prompt) VALUES (?, ?, ?)"
    );
    const info = stmt.run(date, plan, prompt || null);
    return info.lastInsertRowid;
  }
  const stmt = db.prepare("INSERT INTO schedules (date, plan) VALUES (?, ?)");
  const info = stmt.run(date, plan);
  return info.lastInsertRowid;
};

// Function to get a schedule by date (latest by id)
const getScheduleForDate = (date) => {
  const row = db
    .prepare(
      "SELECT plan FROM schedules WHERE date = ? ORDER BY id DESC LIMIT 1"
    )
    .get(date);
  return row ? safeParsePlan(row.plan) : null; // Parse the JSON string back to an object
};

const getAllSchedules = () => {
  const selectCols = ["id", "date", "plan"];
  if (createdAtAvailable) selectCols.push("created_at");
  else selectCols.push("NULL as created_at");
  if (promptAvailable) selectCols.push("prompt");
  else selectCols.push("NULL as prompt");
  const orderBy = createdAtAvailable
    ? "ORDER BY date DESC, datetime(created_at) DESC, id DESC"
    : "ORDER BY date DESC, id DESC";
  const rows = db
    .prepare(`SELECT ${selectCols.join(", ")} FROM schedules ${orderBy}`)
    .all();
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    created_at: r.created_at,
    prompt: r.prompt,
    plan: safeParsePlan(r.plan),
  }));
};

const getSchedulesByDate = (date) => {
  const selectCols = ["id", "date", "plan"];
  if (createdAtAvailable) selectCols.push("created_at");
  else selectCols.push("NULL as created_at");
  if (promptAvailable) selectCols.push("prompt");
  else selectCols.push("NULL as prompt");
  const orderBy = createdAtAvailable
    ? "ORDER BY datetime(created_at) DESC, id DESC"
    : "ORDER BY id DESC";
  const rows = db
    .prepare(
      `SELECT ${selectCols.join(", ")} FROM schedules WHERE date = ? ${orderBy}`
    )
    .all(date);
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    created_at: r.created_at,
    prompt: r.prompt,
    plan: safeParsePlan(r.plan),
  }));
};

const deleteScheduleById = (id) => {
  const stmt = db.prepare("DELETE FROM schedules WHERE id = ?");
  const info = stmt.run(id);
  return info.changes;
};

export {
  initDb,
  saveScheduleToDb,
  getScheduleForDate,
  getAllSchedules,
  getSchedulesByDate,
  deleteScheduleById,
};
