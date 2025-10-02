import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
app.use(express.static("../pages"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new Cerebras({
  apiKey: process.env["CEREBRAS_API_KEY"],
});

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

app.post("/generate-plan", async (req, res) => {
  const userDailyPlan = req.body.dailyPlan;

  if (!userDailyPlan) {
    return res
      .status(400)
      .json({ success: false, error: "Daily plan is required." });
  }

  try {
    const chatCompletion = await client.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct", // Or choose an appropriate Llama model from Cerebras
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant specialized in creating efficient daily plans.",
        },
        {
          role: "user",
          content: `A user will provide their daily plan in plain human language. Your task is to transform this into a structured, actionable AI plan.\n\nExample User Input:\n"Tomorrow I need to finish the hackathon project, buy groceries, and then go for a run in the evening. Also, a quick meeting with the team at 10 AM."\n\nExample AI Plan Output:\n1. **08:00 AM - 09:00 AM**: Review hackathon project progress and outline remaining tasks.\n2. **09:00 AM - 10:00 AM**: Work on hackathon project - implement feature X.\n3. **10:00 AM - 10:30 AM**: Team meeting (virtual).\n4. **10:30 AM - 01:00 PM**: Continue working on hackathon project - debug and refine feature Y.\n5. **01:00 PM - 02:00 PM**: Lunch break.\n6. **02:00 PM - 03:00 PM**: Go grocery shopping.\n7. **03:00 PM - 05:00 PM**: Finalize hackathon project documentation and prepare for demo.\n8. **05:00 PM - 06:00 PM**: Go for an evening run.\n9. **06:00 PM onwards**: Free time / Dinner.\n\nNow, generate an AI plan for the following user input:\nUser Input:\n"${userDailyPlan}"\n\nAI Plan Output:\n`,
        },
      ],
      // Add other parameters as needed, e.g., temperature, max_tokens
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiPlan = chatCompletion.choices[0].message.content;

    if (!aiPlan) {
      throw new Error("Failed to generate plan from Cerebras API.");
    }

    res.json({ success: true, aiPlan: aiPlan });
  } catch (error) {
    console.error("Error generating AI plan:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI plan.",
    });
  }
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
