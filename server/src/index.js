import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  initDb,
  saveScheduleToDb,
  getScheduleForDate,
  getAllSchedules,
  getSchedulesByDate,
  deleteScheduleById,
  updateScheduleById,
} from "./db/database.js";
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

// Initialize the database
initDb();

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

// New endpoint for saving a schedule
app.post("/save-schedule", async (req, res) => {
  const { date, plan, prompt } = req.body;

  if (!plan) {
    return res.status(400).json({ success: false, error: "Plan is required." });
  }

  // Build local date string YYYY-MM-DD (server local time)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const localDate = `${yyyy}-${mm}-${dd}`;

  const dateToSave = date || localDate;

  try {
    const lastInsertRowid = saveScheduleToDb(dateToSave, plan, prompt);
    console.log("Saved schedule", {
      id: lastInsertRowid,
      date: dateToSave,
      bytes: String(plan).length,
    });
    res.json({
      success: true,
      message: "Schedule saved successfully.",
      id: lastInsertRowid,
      date: dateToSave,
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to save schedule.",
    });
  }
});

// Update a schedule by id
app.put("/schedules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { plan } = req.body;

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    if (!plan) {
      return res
        .status(400)
        .json({ success: false, error: "Plan is required" });
    }

    const planJson = typeof plan === "string" ? plan : JSON.stringify(plan);
    const changes = updateScheduleById(id, planJson);

    console.log(`Updated schedule ${id}: ${changes} row(s) affected`);
    res.json({ success: true, updated: changes });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update schedule.",
    });
  }
});

// Delete a schedule by id
app.delete("/schedules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const changes = deleteScheduleById(id);
    res.json({ success: true, deleted: changes });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete schedule.",
    });
  }
});

// New endpoint to get today's schedule
app.get("/schedules/today", async (req, res) => {
  // Build local date string YYYY-MM-DD (matches client save format)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  try {
    const result = getScheduleForDate(today);
    if (result) {
      res.json({ success: true, scheduleId: result.id, schedule: result.plan });
    } else {
      res
        .status(404)
        .json({ success: false, message: "No schedule found for today." });
    }
  } catch (error) {
    console.error("Error fetching schedule for today:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch schedule for today.",
    });
  }
});

// New endpoint to get all schedules
app.get("/schedules", async (req, res) => {
  try {
    const schedules = getAllSchedules();
    console.log("/schedules ->", schedules.length, "rows");
    res.json({ success: true, schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    // Degrade gracefully to avoid UI 500s
    res.json({
      success: true,
      schedules: [],
      warning: "fetch_schedules_failed",
    });
  }
});

// Get schedules by date (all variants for a day)
app.get("/schedules/by-date", async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "date query param is required (YYYY-MM-DD)",
      });
    }
    const schedules = getSchedulesByDate(date);
    console.log("/schedules/by-date", date, "->", schedules.length, "rows");
    res.json({ success: true, schedules });
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    // Degrade gracefully to avoid UI 500s
    res.json({
      success: true,
      schedules: [],
      warning: "fetch_schedules_by_date_failed",
    });
  }
});

// New endpoint for Meta Llama suggestions
app.post("/generate-suggestions", async (req, res) => {
  const userDailyPlan = req.body.dailyPlan;

  if (!userDailyPlan) {
    return res
      .status(400)
      .json({ success: false, error: "Daily plan is required." });
  }

  try {
    const chatCompletion = await client.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct", // Use the same Cerebras Llama model
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant specialized in providing helpful and actionable productivity suggestions based on a user's daily plan. Provide concise, bullet-point suggestions. Each suggestion should include an emoji at the beginning.",
        },
        {
          role: "user",
          content: `Example User Input:\n"Tomorrow I need to finish the hackathon project, buy groceries, and then go for a run in the evening. Also, a quick meeting with the team at 10 AM."\n\nExample AI Suggestions Output:\n- ⏰ Consider time-blocking for your hackathon project to ensure focused work.\n- 🛒 Create a grocery list beforehand to save time and avoid impulse buys.\n- 🏃‍♂️ Schedule your run to avoid peak sun hours and stay hydrated.\n- 🤝 Prepare a brief agenda for your team meeting to keep it efficient.\n\nNow, provide suggestions for the following user input:\nUser Input:\n"${userDailyPlan}"\n\nAI Suggestions Output:\n`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const suggestions = chatCompletion.choices[0].message.content;

    if (!suggestions) {
      throw new Error("Failed to generate suggestions from Cerebras Llama.");
    }

    res.json({ success: true, suggestions: suggestions });
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI suggestions.",
    });
  }
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
          content: `A user will provide their daily plan in plain human language. Your task is to transform this into a structured, actionable AI plan.\n\nExample User Input:\n"Tomorrow I need to finish the hackathon project, buy groceries, and then go for a run in the evening. Also, a quick meeting with the team at 10 AM."\n\nExample AI Plan Output(follow this syntax ):\n1. **08:00 AM - 09:00 AM**: Review hackathon project progress and outline remaining tasks.\n2. **09:00 AM - 10:00 AM**: Work on hackathon project - implement feature X.\n3. **10:00 AM - 10:30 AM**: Team meeting (virtual).\n4. **10:30 AM - 01:00 PM**: Continue working on hackathon project - debug and refine feature Y.\n5. **01:00 PM - 02:00 PM**: Lunch break.\n6. **02:00 PM - 03:00 PM**: Go grocery shopping.\n7. **03:00 PM - 05:00 PM**: Finalize hackathon project documentation and prepare for demo.\n8. **05:00 PM - 06:00 PM**: Go for an evening run.\n9. **06:00 PM onwards**: Free time / Dinner.\n\nNow, generate an AI plan for the following user input:\nUser Input:\n"${userDailyPlan}"\n\nAI Plan Output:\n`,
        },
      ],
      // Add other parameters as needed, e.g., temperature, max_tokens
      temperature: 0.7,
      max_tokens: 1000, // Increased to allow for longer responses
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

// Export all schedules as JSON
app.get("/export-schedules", async (req, res) => {
  try {
    const schedules = getAllSchedules();
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      totalSchedules: schedules.length,
      schedules: schedules,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="taskpilot-backup-${
        new Date().toISOString().split("T")[0]
      }.json"`
    );
    res.json(exportData);
    console.log(`📦 Exported ${schedules.length} schedules`);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to export data.",
    });
  }
});

// Import schedules from JSON
app.post("/import-schedules", async (req, res) => {
  try {
    const { schedules, replaceExisting } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        error: "Invalid data format. Expected schedules array.",
      });
    }

    let imported = 0;
    let skipped = 0;

    // If replaceExisting, we could clear the database first
    // For now, we'll just add new schedules

    schedules.forEach((schedule) => {
      try {
        const planJson =
          typeof schedule.plan === "string"
            ? schedule.plan
            : JSON.stringify(schedule.plan);
        saveScheduleToDb(
          schedule.date,
          planJson,
          schedule.prompt || "",
          schedule.created_at ||
            new Date().toISOString().replace("T", " ").substring(0, 19)
        );
        imported++;
      } catch (err) {
        console.error(`Failed to import schedule for ${schedule.date}:`, err);
        skipped++;
      }
    });

    console.log(`📥 Imported ${imported} schedules, skipped ${skipped}`);
    res.json({
      success: true,
      imported,
      skipped,
      message: `Successfully imported ${imported} schedule(s)`,
    });
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to import data.",
    });
  }
});

// 404 handler - must be AFTER all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Endpoint not found",
      path: req.path,
    },
  });
});

// Error handler - must be last
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
