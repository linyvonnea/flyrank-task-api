const Database = require("better-sqlite3");
const path = require("node:path");

// Keep the database beside this file.
const databasePath = path.join(__dirname, "tasks.db");

// Open the database, creating the file if it does not exist.
const db = new Database(databasePath);

// Create the table if it does not already exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
  )
`);

// Add example tasks only when the table is empty.
const seedTasks = db.transaction(() => {
  const result = db
    .prepare("SELECT COUNT(*) AS count FROM tasks")
    .get();

  if (result.count === 0) {
    const insertTask = db.prepare(
      "INSERT INTO tasks (title, done) VALUES (?, ?)"
    );

    insertTask.run("Buy groceries", 0);
    insertTask.run("Study Express", 0);
    insertTask.run("Finish assignment", 1);
  }
});

seedTasks();

// Let other files use this database connection.
module.exports = db;