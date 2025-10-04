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
  getSetting,
  setSetting,
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

// Retry configuration for rate limiting
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff(apiCall, retries = RETRY_CONFIG.maxRetries) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit =
        error.status === 429 ||
        (error.error && error.error.type === "too_many_requests_error");
      const isLastAttempt = attempt === retries;

      if (isRateLimit && !isLastAttempt) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelayMs *
            Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelayMs
        );

        console.log(
          `Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${
            retries + 1
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Re-throw error if not rate limit or last attempt
      throw error;
    }
  }
}

// Available Cerebras models with metadata
const AVAILABLE_MODELS = [
  {
    id: "llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    description: "Ultra-fast model optimized for quick responses",
    speed: "⚡ Very Fast",
    quality: "⭐⭐⭐ Good",
    tokensPerSecond: "~800",
    bestFor: "Quick plans, simple scheduling, real-time responses",
  },
  {
    id: "llama3.1-8b",
    name: "Llama 3.1 8B",
    description: "Balanced speed and quality for everyday use",
    speed: "⚡⚡ Fast",
    quality: "⭐⭐⭐⭐ Very Good",
    tokensPerSecond: "~500",
    bestFor: "General purpose, balanced performance, daily planning",
  },
  {
    id: "llama3.3-70b",
    name: "Llama 3.3 70B",
    description: "High-quality model with advanced reasoning",
    speed: "⚡⚡ Moderate",
    quality: "⭐⭐⭐⭐⭐ Excellent",
    tokensPerSecond: "~200",
    bestFor: "Complex plans, detailed analysis, multi-step reasoning",
  },
  {
    id: "llama3.1-70b",
    name: "Llama 3.1 70B",
    description: "Powerful model for detailed planning",
    speed: "⚡⚡ Moderate",
    quality: "⭐⭐⭐⭐⭐ Excellent",
    tokensPerSecond: "~200",
    bestFor: "Detailed schedules, comprehensive planning",
  },
  {
    id: "llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    description: "Instruction-tuned for following complex directions",
    speed: "⚡⚡ Moderate",
    quality: "⭐⭐⭐⭐⭐ Excellent",
    tokensPerSecond: "~200",
    bestFor: "Structured output, detailed instructions, complex tasks",
  },
];

// Initialize the database first
initDb();

// Load current model from database (persisted setting)
let currentModel = getSetting("currentModel", "llama-4-scout-17b-16e-instruct");
console.log(`Loaded model from database: ${currentModel}`);

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
  const generatedSchedule = req.body.schedule; // NEW: Receive the generated schedule

  if (!userDailyPlan) {
    return res
      .status(400)
      .json({ success: false, error: "Daily plan is required." });
  }

  try {
    // Use same model as plan generation to avoid rate limits
    // (Can upgrade to larger model when traffic is lower)
    const coachModel = currentModel;

    const startTime = Date.now();

    // Build the prompt based on whether we have a schedule or not
    let userContent;

    if (generatedSchedule && generatedSchedule.length > 0) {
      // SCHEDULE-AWARE COACHING: Analyze the actual schedule
      const scheduleText = generatedSchedule
        .map((task) => `${task.time} - ${task.task} (${task.duration})`)
        .join("\n");

      userContent = `You are an AI productivity coach analyzing a daily schedule. Review the schedule carefully and provide specific, actionable suggestions.

Original User Request:
"${userDailyPlan}"

Generated Schedule:
${scheduleText}

Analyze this schedule and provide coaching in these categories (use these exact emoji headers):

✅ What's Working Well:
- Identify 2-3 positive aspects (e.g., good timing, energy alignment, priorities)

⚠️ Potential Issues:
- Find any problems: missing breaks, no lunch, back-to-back meetings, time conflicts, unrealistic durations, energy mismatches

💡 Specific Improvements:
- Suggest concrete changes with exact times (e.g., "Add 15-min break at 12:00 PM", "Move X to Y time")

🧠 Energy & Focus Tips:
- Comment on task timing relative to typical energy levels (morning = peak focus, afternoon = post-lunch dip, evening = wind-down)

Keep suggestions specific to THIS schedule. Format as bullet points with emojis.`;
    } else {
      // FALLBACK: Generic suggestions if no schedule available
      userContent = `You are an AI productivity coach. The user wants to plan their day with these activities:

"${userDailyPlan}"

Provide helpful suggestions in these categories:

✅ Planning Tips:
- General advice for organizing these activities

💡 Productivity Suggestions:
- Specific tips for each activity mentioned

🧠 Energy Management:
- When to schedule different types of activities

Format as bullet points with emojis at the start of each point.`;
    }

    // Wrap API call with retry logic
    const chatCompletion = await retryWithBackoff(async () => {
      return await client.chat.completions.create({
        model: coachModel,
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI productivity coach specializing in schedule optimization and energy management. Provide specific, actionable advice based on actual schedule data.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 600, // Increased for more detailed coaching
      });
    });

    const suggestions = chatCompletion.choices[0].message.content;
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (!suggestions) {
      throw new Error("Failed to generate suggestions from Cerebras Llama.");
    }

    console.log(`Coaching generated using ${coachModel} in ${latency}ms`);

    res.json({
      success: true,
      suggestions: suggestions,
      metadata: {
        model: coachModel,
        latency: latency,
        scheduleAware: !!generatedSchedule,
      },
    });
  } catch (error) {
    console.error("Error generating AI suggestions:", error);

    // Provide user-friendly error messages
    const isRateLimit =
      error.status === 429 ||
      (error.error && error.error.type === "too_many_requests_error");

    const userMessage = isRateLimit
      ? "Cerebras is experiencing high traffic. Please try again in a moment."
      : error.message || "Failed to generate AI suggestions.";

    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      error: userMessage,
      retryable: isRateLimit,
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
    const startTime = Date.now();

    // Wrap API call with retry logic
    const chatCompletion = await retryWithBackoff(async () => {
      return await client.chat.completions.create({
        model: currentModel, // Use the currently selected model
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant specialized in creating efficient daily plans.",
          },
          {
            role: "user",
            content: `You are an expert AI scheduling assistant powered by Cerebras. Transform user requests into optimized daily schedules.

**CRITICAL RULES (MUST FOLLOW EXACTLY):**
1. ALWAYS use time RANGES in format: "HH:MM AM/PM - HH:MM AM/PM" (NOT single times!)
   ✓ CORRECT: "09:00 AM - 10:00 AM"
   ✗ WRONG: "09:00 AM"
2. Include realistic durations (15-120 min per task)
3. Add buffer time between tasks (5-15 min)
4. Respect work-life balance (meals, breaks, sleep)
5. Front-load high-priority/energy tasks (morning)
6. Each task MUST have BOTH start AND end time

**Example 1:**
User: "Tomorrow I need to finish the hackathon project, buy groceries, and then go for a run in the evening. Also, a quick meeting with the team at 10 AM."

AI Plan:
1. **08:00 AM - 09:00 AM**: Review hackathon project progress and outline remaining tasks. (Priority: High)
2. **09:00 AM - 10:00 AM**: Deep work - Implement core hackathon features. (Priority: High)
3. **10:00 AM - 10:30 AM**: Team standup meeting. (Priority: High)
4. **10:30 AM - 12:30 PM**: Continue hackathon development - debugging and testing. (Priority: High)
5. **12:30 PM - 01:30 PM**: Lunch break + mental reset. (Priority: Medium)
6. **01:30 PM - 02:30 PM**: Grocery shopping. (Priority: Medium)
7. **02:30 PM - 04:30 PM**: Finalize hackathon documentation and demo prep. (Priority: High)
8. **04:30 PM - 05:00 PM**: Buffer time - handle last-minute tasks. (Priority: Low)
9. **05:00 PM - 06:00 PM**: Evening run (exercise & stress relief). (Priority: Medium)
10. **06:00 PM - 07:00 PM**: Dinner. (Priority: Medium)
11. **07:00 PM onwards**: Free time / relaxation.

**Example 2:**
User: "I have 3 client calls, need to write a report, and want to go to the gym"

AI Plan:
1. **09:00 AM - 09:30 AM**: Morning review & email triage. (Priority: Medium)
2. **09:30 AM - 10:30 AM**: Client call #1. (Priority: High)
3. **10:30 AM - 11:30 AM**: Client call #2. (Priority: High)
4. **11:30 AM - 12:00 PM**: Break + prep for next call. (Priority: Low)
5. **12:00 PM - 01:00 PM**: Client call #3. (Priority: High)
6. **01:00 PM - 02:00 PM**: Lunch break. (Priority: Medium)
7. **02:00 PM - 04:00 PM**: Deep work - Write report (uninterrupted). (Priority: High)
8. **04:00 PM - 04:30 PM**: Review & edit report. (Priority: Medium)
9. **04:30 PM - 05:30 PM**: Gym workout. (Priority: Medium)
10. **05:30 PM onwards**: Evening routine.

**Now, create an optimized schedule for:**
User Input: "${userDailyPlan}"

**IMPORTANT REMINDER:**
- Every line MUST have time ranges (start - end), NOT single times
- Format: "HH:MM AM/PM - HH:MM AM/PM"
- Include (Priority: High/Medium/Low) at the end of each task

**AI Plan Output (follow exact format above):**
`,
          },
        ],
        // Add other parameters as needed, e.g., temperature, max_tokens
        temperature: 0.7,
        max_tokens: 1000, // Increased to allow for longer responses
      });
    });

    const aiPlan = chatCompletion.choices[0].message.content;
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (!aiPlan) {
      throw new Error("Failed to generate plan from Cerebras API.");
    }

    console.log(`Plan generated using ${currentModel} in ${latency}ms`);

    res.json({
      success: true,
      aiPlan: aiPlan,
      metadata: {
        model: currentModel,
        latency: latency,
        tokensUsed: chatCompletion.usage || null,
      },
    });
  } catch (error) {
    console.error("Error generating AI plan:", error);

    // Provide user-friendly error messages
    const isRateLimit =
      error.status === 429 ||
      (error.error && error.error.type === "too_many_requests_error");

    const userMessage = isRateLimit
      ? "Cerebras is experiencing high traffic. Please try again in a moment."
      : error.message || "Failed to generate AI plan.";

    res.status(isRateLimit ? 429 : 500).json({
      success: false,
      error: userMessage,
      retryable: isRateLimit,
    });
  }
});

// Get available models
app.get("/api/models", (req, res) => {
  res.json({
    success: true,
    models: AVAILABLE_MODELS,
    currentModel: currentModel,
  });
});

// Set current model
app.post("/api/models/set", (req, res) => {
  const { modelId } = req.body;

  if (!modelId) {
    return res.status(400).json({
      success: false,
      error: "modelId is required",
    });
  }

  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    return res.status(400).json({
      success: false,
      error: "Invalid model ID",
    });
  }

  currentModel = modelId;

  // Persist the model selection to database
  const saved = setSetting("currentModel", modelId);

  if (saved) {
    console.log(
      `Model switched to: ${model.name} (${modelId}) - Saved to database`
    );
  } else {
    console.warn(
      `Model switched to: ${model.name} (${modelId}) - Failed to save to database`
    );
  }

  res.json({
    success: true,
    message: `Model set to ${model.name}`,
    currentModel: currentModel,
    persisted: saved,
  });
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
