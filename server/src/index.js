import express from "express";

const app = express();
app.use(express.static("../pages"));

app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/focus", (req, res) => {
  res.render("focus.html");
});

app.get("/today", (req, res) => {
  res.render("today.html");
});

app.get("/tasks", (req, res) => {
  res.render("tasks.html");
});

app.get("/settings", (req, res) => {
  res.render("settings.html");
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Endpoint not found",
      path: req.path,
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(config.nodeEnv === "development" && { stack: err.stack }),
    },
  });
});

// Start server
const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`API on http://localhost:${port}`));

export default app;
