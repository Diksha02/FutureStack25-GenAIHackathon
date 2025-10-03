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
.
├── .git/
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── pages/
│   ├── index.html
│   ├── today.html
│   ├── tasks.html
│   ├── focus.html
│   ├── settings.html
│   ├── css/
│   └── js/
├── server/
│   ├── src/
│   │   ├── index.js
│   │   └── db/
│   ├── package.json
│   └── node_modules/
├── README.md
└── .env
```

---

## ⚙️ Getting Started

### Option 1: Run with Docker (Recommended)

The easiest way to run TaskPilot is using Docker:

1.  **Prerequisites:**
    - Install [Docker](https://docs.docker.com/get-docker/)
    - Install [Docker Compose](https://docs.docker.com/compose/install/)

2.  **Set up environment variables:**
    Create a `.env` file in the **root directory** and add your Cerebras API key:
    ```bash
    CEREBRAS_API_KEY=your_cerebras_api_key_here
    ```

3.  **Build and run with Docker Compose:**
    ```bash
    docker-compose up -d
    ```

4.  **Access the application:**
    Open your browser and navigate to `http://localhost:5050`

5.  **View logs (optional):**
    ```bash
    docker-compose logs -f
    ```

6.  **Stop the application:**
    ```bash
    docker-compose down
    ```

### Option 2: Run Locally (Development)

To run the backend server directly on your machine:

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    In the **root directory of the project** (one level above the `server` folder), create a file named `.env` and add your Cerebras API key:
    ```
    CEREBRAS_API_KEY="your_cerebras_api_key_here"
    ```
    *Make sure to replace `"your_cerebras_api_key_here"` with your actual key obtained from Cerebras.* (See [Cerebras Inference documentation](https://inference-docs.cerebras.ai/introduction) for details on getting an API key).

4.  **Start the server:**
    ```bash
    npm start
    # Or for development with hot-reloading:
    # npm run dev
    ```
    The server will typically run on `http://localhost:5050`.

---

<!-- ## 📹 Demo

🎥 A 2-minute demo video will showcase:

- Writing a free-form plan
- AI suggestions (Llama)
- JSON schedule generation (Cerebras)
- Calendar export & focus timer (MCP tools)

--- -->

## 📝 License

MIT License – open for learning, sharing, and improving.
