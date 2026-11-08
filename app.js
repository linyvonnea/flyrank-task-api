const express = require("express");

const app = express();
const PORT = 3000;

// Middleware that lets Express understand JSON request bodie
app.use(express.json());

const tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Study Express", done: false },
  { id: 3, title: "Finish assignment", done: true }
];

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

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);

  const task = tasks.find((task) => task.id === taskId);

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

  const nextId =
    tasks.length > 0
      ? Math.max(...tasks.map((task) => task.id)) + 1
      : 1;

  const newTask = {
    id: nextId,
    title: title,
    done: false
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

// update
app.put("/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);

    const task = tasks.find((task) => task.id === taskId);

    if (!task){
        return res.status(404).json({
            error: `Task ${taskId} not found`
        });
    }

    const { title, done} = req.body || {};

    if (title === undefined && done === undefined){
        return res.status(400).json({
            error: "Provide a title or done value"
        })
    }

    if (
        title !== undefined && 
        (typeof title !== "string" || title.trim() === "")
    ) {
        return res.status(400).json({
                error: "Title must be non-empty string"
            });
        }
        if (done !== undefined && typeof done !== "boolean"){
            return res.status(400).json({
                error: "Done must be true or false"
            });
        }

        if (title !== undefined){
            task.title = title.trim();
        }

        if (done !== undefined) {
            task.done = done;
        }

        res.status(200).json(task);

});

app.delete("/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);

    const taskIndex = tasks.findIndex(
        (task) => task.id === taskId
    );

    if (taskIndex === -1){
        return res.status(404).json({
            error: `Task ${taskId} not found`
        });
    }

    tasks.splice(taskIndex, 1);

    res.status(204).send();
})










app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});