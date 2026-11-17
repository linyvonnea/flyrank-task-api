const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
const db = require("./db");
const taskRepository = require("./taskRepository");

const app = express();
const PORT = 3000;



// Middleware that lets Express understand JSON request bodie
app.use(express.json());



function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: row.done === 1
  };
}

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.get("/tasks", async (req, res) => {
  const tasks = await taskRepository.listTasks();
  res.json(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  if (
    !Number.isInteger(taskId) ||
    taskId < 1 ||
    taskId > 2147483647
  ) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  const task = await taskRepository.getTaskById(taskId);

  if (!task) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  res.json(task);
});


app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title must be a non-empty string"
    });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title, 0);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(toTask(task));
});

// update
app.put("/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isSafeInteger(taskId)) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(taskId);

  if (!task) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({
      error: "Provide a title or done value"
    });
  }

  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim() === "")
  ) {
    return res.status(400).json({
      error: "Title must be non-empty string"
    });
  }

  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({
      error: "Done must be true or false"
    });
  }

  const nextTitle = title === undefined ? task.title : title.trim();
  const nextDone = done === undefined ? task.done : Number(done);

  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
    .run(nextTitle, nextDone, taskId);

  const updatedTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(taskId);

  res.json(toTask(updatedTask));
});

app.delete("/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isSafeInteger(taskId)) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  const result = db
    .prepare("DELETE FROM tasks WHERE id = ?")
    .run(taskId);

  if (result.changes === 0) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  res.status(204).send();
});








app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

async function startServer() {
  try {
    await taskRepository.initializeDatabase();

    console.log("PostgreSQL connected; tasks table ready");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database startup failed:", error.message);
    process.exit(1);
  }
}

startServer();