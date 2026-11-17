const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");
const taskRepository = require("./taskRepository");

const app = express();
const PORT = 3000;

app.use(express.json());

function isValidTaskId(id) {
  return Number.isInteger(id) && id > 0 && id <= 2147483647;
}

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", async (req, res) => {
  const tasks = await taskRepository.listTasks();
  res.json(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  if (!isValidTaskId(taskId)) {
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

app.post("/tasks", async (req, res) => {
  const { title } = req.body || {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title must be a non-empty string"
    });
  }

  const task = await taskRepository.createTask(title);
  res.status(201).json(task);
});

app.put("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  if (!isValidTaskId(taskId)) {
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
  const nextDone = done === undefined ? task.done : done;

  const updatedTask = await taskRepository.updateTask(
    taskId,
    nextTitle,
    nextDone
  );

  if (!updatedTask) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  res.json(updatedTask);
});

app.delete("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  if (!isValidTaskId(taskId)) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  const deleted = await taskRepository.deleteTask(taskId);

  if (!deleted) {
    return res.status(404).json({
      error: `Task ${taskId} not found`
    });
  }

  res.status(204).send();
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Request body must be valid JSON"
    });
  }

  console.error("Request failed:", error.message);

  res.status(500).json({
    error: "Internal server error"
  });
});

async function startServer() {
  try {
    await taskRepository.initializeDatabase();

    console.log("PostgreSQL connected; tasks table ready");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database startup failed:", error.message);
    process.exit(1);
  }
}

startServer();