# 🏆 TaskPilot – Your AI Productivity Copilot

## 🚀 Overview

TaskPilot is an **AI-powered task management app** that transforms messy, free-form daily plans into a structured, actionable schedule. Built for the hackathon, it combines **AI coaching, strict scheduling, and secure real-world integration** to help people actually execute their daily goals.

Instead of just listing tasks, TaskPilot acts like a **personal productivity coach**:

- Write down your day in plain language (e.g., _“Gym at 7, deep work 9–11, standup at 11:15, groceries after 6”_).
- **Meta’s Llama** suggests optimizations and productivity tips.
- **Cerebras API** converts plans into **strict JSON schedules** with times, durations, and priorities.
- **Docker MCP Gateway** safely runs real tools like exporting tasks to calendar or starting focus timers.

The result: you don’t just plan—you leave with a **full, validated daily roadmap** you can sync, track, and act on.

---

## 🎯 Features

- **Plan Page**: Paste daily intentions → get AI suggestions + validated schedule.
- **Today Dashboard**: Shows your next task, checkboxes for progress, and quick focus timer access.
- **Focus Mode**: Pomodoro-style deep work tracker with session logging.
- **Task Manager**: View, filter, and edit all tasks.
- **Calendar Export**: One-click export to `.ics` for Google/Apple Calendar.
- **Settings**: Timezone, focus length, and data import/export.

---

## 🧩 Sponsor Technology

- **Meta Llama** → Generates human-readable productivity coaching and task suggestions.
- **Cerebras API** → Produces structured JSON schedules to feed into the app.
- **Docker MCP Gateway** → Connects AI outputs to real tools (calendar sync, timers, etc.) in a secure, policy-driven way.

---

## 🏅 Why It Stands Out

- **Human + Machine Harmony**: Suggestions you can read, paired with data machines can use.
- **Sponsor Showcase**: Each sponsor tech is core to the experience, not bolted on.
- **Real Utility**: Simple UI and workflow designed for actual daily use.
- **Hackathon Ready**: Focused scope, working prototype, clear demo.

---

## 📂 Repository Structure

```
├─ index.html        # Plan page
├─ today.html        # Today dashboard
├─ tasks.html        # Task manager
├─ focus.html        # Focus timer
├─ settings.html     # Settings page
├─ css/
├─ js/
└─ public/
```

---

## 📹 Demo

🎥 A 2-minute demo video will showcase:

- Writing a free-form plan
- AI suggestions (Llama)
- JSON schedule generation (Cerebras)
- Calendar export & focus timer (MCP tools)

---

## 📝 License

MIT License – open for learning, sharing, and improving.
