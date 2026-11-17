const { Pool } = require("pg");

// Reuse database connections across requests.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
  console.error("PostgreSQL connection error:", error.message);
});

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check your .env file.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const result = await pool.query(
    "SELECT COUNT(*) AS count FROM tasks"
  );

  if (Number(result.rows[0].count) === 0) {
    await pool.query(
      `
        INSERT INTO tasks (title, done)
        VALUES ($1, $2), ($3, $4), ($5, $6)
      `,
      [
        "Buy groceries", false,
        "Study Express", false,
        "Finish assignment", true
      ]
    );
  }
}

async function listTasks() {
  const result = await pool.query(
    "SELECT * FROM tasks ORDER BY id"
  );

  return result.rows;
}

async function getTaskById(id) {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE id = $1",
    [id]
  );

  return result.rows[0];
}

module.exports = {
  initializeDatabase,
  listTasks,
  getTaskById
};