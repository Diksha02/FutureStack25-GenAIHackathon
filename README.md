## 🏆 TaskPilot — Schedule smarter with Cerebras + Llama

### Overview

TaskPilot turns plain‑language plans into structured schedules with schedule‑aware AI coaching, conflict‑free editing, persistence, and one‑click calendar export — powered by Cerebras (inference) and Meta Llama.

- Hackathon: FutureStack Gen AI Hackathon 2025
- Sponsors used: Cerebras (LLM inference), Meta Llama (models), Docker (containerization)
- Demo video: add your 2‑min link here

---

## Judging Criteria Mapping

### Potential Impact
- Helps anyone convert intentions into realistic plans that respect time, energy, and priorities.
- Features: time‑range schedules, buffers, priority badges, and schedule‑aware coaching for better execution.
- Exports `.ics` to calendar; persists versions for audit and reuse.

### Creativity & Originality
- Schedule‑aware AI coach with styled, actionable sections (✅ Working Well, ⚠️ Issues, 💡 Improvements, 🧠 Energy Tips).
- Conflict‑aware, priority‑respecting rescheduling (cascading resolution; blocks when higher priority would be impacted).
- Model knob with speed/quality tradeoffs and a live performance badge (latency + tokens/sec) to showcase Cerebras.

### Technical Implementation
- Node.js/Express backend with Cerebras Llama chat completions (retry with exponential backoff; 429 handling).
- SQLite persistence (schedules + settings), import/export JSON, export `.ics`.
- Multi‑page frontend (index/today/tasks/settings) in vanilla HTML/CSS/JS.
- Dockerized for reproducible local runs via `docker-compose`.

### Learning & Growth
- Iterative journey: text → table → DB → coach → conflict resolution → model selection → Docker.
- Timezone handling, schema migrations, structured parsing, robust error UX.

### Aesthetics & UX
- Clean UI, time‑range tables, priority badges, and polished coach sections.
- Clear empty/error states; retry flows; helpful success toasts.

### Presentation & Communication
- This README, structured per judging criteria; add a crisp 2‑minute demo video.

---

## Feature Highlights

- AI plan generation (Cerebras Llama) with realistic durations, buffers, priorities, and strict time ranges (e.g., `09:00 AM - 10:00 AM`).
- Schedule‑aware AI Coach analysis rendered in professional HTML with color‑coded sections.
- Conflict‑aware editing in Tasks: automatically reschedules lower/equal priority conflicts; blocks if a higher‑priority task would be impacted.
- Model selection (multiple Cerebras Llama models) with speed/quality descriptors and last‑run metrics.
- Performance badge showing latency and estimated tokens/sec each generation.
- Persistence: save schedules (with prompt and timestamps), view all saved and today’s versions, select and delete.
- Export `.ics` calendar; export/import all schedules as JSON.

---

## Architecture

### Frontend (`/pages`)
- `index.html`: plan input → AI plan table + coach; save; export `.ics`; performance badge; model banner.
- `today.html`: current task, today’s tasks with completion toggles, all saved/today versions (activate/delete), export `.ics`.
- `tasks.html`: search/filter, add/edit/delete tasks, set priority/duration; conflict‑aware rescheduling; saves to DB.
- `settings.html`: model selection & metadata; last generation metrics; export/import data.

### Backend (`/server/src`)
- `index.js`: Express API for plan/coaching generation, schedules CRUD, export/import, models, rate‑limit handling.
- `db/database.js`: SQLite (schedules, settings), migrations, robust JSON parse, local timestamps.

### Data
- SQLite DB file in `server/src/db` with tables:
  - `schedules(id, date, plan(JSON), prompt, created_at)`
  - `settings(key, value, updated_at)`

---

## Sponsor Technology Usage

- Cerebras: Hosted inference API for Meta Llama models; high tokens/sec and low latency; exponential backoff on 429.
- Meta Llama: Multiple models (e.g., Llama 4 Scout 17B, Llama 3.1 8B, Llama 3.3 70B) selectable via UI.
- Docker: Multi‑stage `Dockerfile` + `docker-compose.yml`; production run on port 5050 mapped to 3000.

---

## Getting Started (Local)

Prerequisites: Node 20+, npm, Cerebras API key

1) Install
```bash
cd server
npm install
```

2) Configure environment (project root `.env`)
```bash
CEREBRAS_API_KEY=your_cerebras_api_key
PORT=5050
NODE_ENV=development
```

3) Run
```bash
npm start
```
Open `http://localhost:5050`.

---

## Getting Started (Docker)

Prerequisites: Docker Desktop

1) Ensure root `.env` contains `CEREBRAS_API_KEY`.

2) Build & run
```bash
docker-compose up -d --build
```
Open `http://localhost:3000`.

3) Stop
```bash
docker-compose down
```

---

## API (Key Endpoints)

- POST `/generate-plan` → { success, aiPlan, metadata(model, latency, tokensUsed?) }
- POST `/generate-suggestions` → { success, suggestions, metadata(model, latency, scheduleAware) }
- POST `/save-schedule` → persist schedule (date/prompt/plan)
- GET `/schedules/today` → latest schedule for local date
- GET `/schedules` → all schedules
- GET `/schedules/by-date?date=YYYY-MM-DD`
- PUT `/schedules/:id` → update plan (tasks)
- DELETE `/schedules/:id`
- GET `/export-schedules` / POST `/import-schedules`
- GET `/api/models` / POST `/api/models/set`

Errors return user‑friendly messages; 429s are retried with exponential backoff.

---

## Performance

- Live performance badge shows latency and estimated tokens/sec per generation.
- Uses Cerebras inference API; prompts tuned for strict time‑range outputs and structure fidelity.

---

## Submission Checklist

- [ ] 2‑minute demo video added to the top of this README
- [ ] Clear problem → solution → live demo flow
- [ ] Show model selection + performance badge (Cerebras speed)
- [ ] Demonstrate coach + conflict‑aware editing + export `.ics`
- [ ] Briefly highlight persistence and import/export

---

## Team & License

- Built for FutureStack Gen AI Hackathon 2025.
- License: MIT (open for learning, sharing, improving).
