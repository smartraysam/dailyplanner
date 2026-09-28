# Daily Planner & Autonomous AI Agent ⚡

> **A high-performance engineering cadence and timeboxing platform designed for software engineers, engineering managers, and technical leads. Mitigate context-switching fatigue, maintain continuous learning habits, and delegate context-rich tasks to an autonomous AI agent built from scratch.**

---

## 🌟 Overview & Core Philosophy

Modern software development requires balancing demanding priorities: deep-work feature coding, urgent bug triaging, code reviews, and continuous learning (e.g., CS fundamentals, distributed systems, system design). Unstructured days lead to **context-switching penalty** and mental fatigue.

**Daily Planner** solves this by combining:
1. **Intelligent Timeboxing**: Scheduled blocks with proactive audio/visual cues (T-5 minute pre-alert and T-0 task switch alerts).
2. **Context Snapshot Preservation**: When switching away from an interrupted task, the system prompts for a quick 1-line mental state capture—eliminating re-entry lag when resuming.
3. **Multi-Horizon Tracking**: Velocity, deep-work ratio, and skill investment tracking aggregated seamlessly across **Day**, **Week**, and **Month** horizons.
4. **Autonomous AI Agent Built From Scratch**: A dedicated ReAct (Reasoning + Acting) loop runtime running in an isolated sandbox that takes on context-rich tasks (e.g., investigating error traces, writing tests, applying patches).

---

## 🏗️ Architecture & Monorepo Layout

The project is structured as a high-velocity monorepo managed with **pnpm workspaces** and **Turborepo**:

```
dailyplanner/
├── apps/
│   ├── web/                      # Next.js 15 (App Router) + React 19 Frontend
│   │   ├── src/app/              # Dashboard, Timeline, Horizon Selectors, Agent Drawer
│   │   └── tailwind.config.ts    # Glassmorphic dark theme tailored for engineers
│   ├── api/                      # NestJS Core Application Backend
│   │   ├── src/modules/
│   │   │   ├── schedules/        # Timeblocks, routines, task switching logic
│   │   │   ├── notifications/    # WebSocket Gateway & timebox transition triggers
│   │   │   ├── analytics/        # Multi-horizon aggregation (Day / Week / Month)
│   │   │   └── agent/            # Bridge to Python Autonomous Agent Core
│   │   └── main.ts               # API server entrypoint (Port 4000)
│   └── desktop/                  # Tauri v2 native desktop application wrapper
│       └── src-tauri/            # Rust native layer (System tray, global hotkeys, push)
├── services/
│   └── agent-core/               # Custom Python AI Agent (Built from Scratch)
│       ├── agent/
│       │   └── loop.py           # ReAct state machine & planning engine
│       ├── tools/
│       │   └── registry.py       # Native tools (read_code, apply_patch, grep, sandbox)
│       ├── server.py             # FastAPI streaming server (Port 8001)
│       └── requirements.txt
├── packages/
│   └── shared-types/             # Shared TypeScript interfaces, DTOs, and WS events
├── docker-compose.yml            # PostgreSQL (pgvector) & Redis
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 🚀 Key Features

### 1. Proactive Timeboxing & Transition Alerts
- **Real-time Countdown Dial**: Live seconds/minutes countdown ring tracking your active block.
- **5-Minute Heads-Up Warning**: Pre-alert notification giving you a clean window to commit changes or wrap up thoughts.
- **Task-Switch Modal with Context Snapshot**: At block expiration, a dialog prompts you to log where you left off (e.g. *"Debugged discount token null check; ready to write test assertion tomorrow"*) so you can transition to your next task with a clear mind.

### 2. Multi-Horizon Progress Analytics
- **Day Horizon**: Real-time focus time (planned vs. actual), deep-work ratio, context switch count, and category tags.
- **Week Horizon**: 5-day velocity distribution (Feature vs. Bug vs. CS Fundamentals vs. Meetings) and burndown trends.
- **Month Horizon**: Cumulative skill learning hours, consistency streaks, and monthly retrospective metrics.

### 3. Scratch-Built Autonomous AI Agent Core
- **No Black Boxes**: Built entirely with transparent Python primitives implementing the **ReAct (Reason + Act)** cycle:
  $$\text{Thought} \longrightarrow \text{Action (Tool Call)} \longrightarrow \text{Observation} \longrightarrow \text{Verification}$$
- **Full Context Ingestion**: Takes task metadata, target repo path, active git branch, ticket URL, and stack traces.
- **Native Sandboxed Toolset**:
  - `read_code`: Inspects source files with precise line ranges.
  - `grep_search`: Searches codebases for symbols and function references.
  - `apply_patch`: Applies defensive edits and targeted code patches.
  - `run_sandbox_command`: Executes `./mvnw test` or test suites in isolated sandbox containers.
  - `git_status_and_diff`: Inspects branch diffs and prepares review packages.
- **Interactive Review UI**: Generates a unified git patch diff with test verification summary, ready for engineer approval.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v20.x or v22.x
- **pnpm**: v9.x or later (`corepack enable pnpm`)
- **Python**: 3.12+ (for `agent-core`)
- **Docker**: (Optional, for running PostgreSQL + Redis via Docker Compose)

---

### Installation

1. **Navigate to the repository**:
   ```bash
   cd ~/NodeJsProjects/dailyplanner
   ```

2. **Install all workspace dependencies**:
   ```bash
   pnpm install
   ```

3. **Build shared types**:
   ```bash
   pnpm --filter @planner/shared-types build
   ```

---

### Running the Services

#### Option A: Run Full Stack via Turborepo
```bash
pnpm dev
```

#### Option B: Run Services Individually

1. **Start the NestJS Core API** (Port 4000):
   ```bash
   pnpm --filter @planner/api dev
   # or run the production bundle:
   pnpm --filter @planner/api start:prod
   ```

2. **Start the Next.js Web Dashboard** (Port 3005):
   ```bash
   pnpm --filter @planner/web dev -p 3005
   # or run the production bundle:
   pnpm --filter @planner/web start -p 3005
   ```

3. **Start the Python Autonomous Agent Core** (Port 8001):
   ```bash
   cd services/agent-core
   pip install -r requirements.txt
   python3 server.py
   ```

4. **Start PostgreSQL & Redis (Optional)**:
   ```bash
   docker compose up -d
   ```

---

## 📡 API & WebSocket Reference

### HTTP Endpoints (`http://localhost:4000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/schedules/overview` | Returns active timebox, seconds remaining, current & next task. |
| `GET` | `/schedules/tasks` | Lists all tasks with full engineering context (repo, branch, error trace). |
| `POST`| `/schedules/switch` | Switches to the next timeblock and records context snapshot note. |
| `POST`| `/schedules/snooze` | Adds snooze minutes (+5m) to current active block. |
| `POST`| `/schedules/simulate-alert` | Triggers a test `WARNING` (5m) or `SWITCH_NOW` alert. |
| `GET` | `/analytics/horizon?horizon=DAY` | Returns Day, Week, or Month progress metrics. |
| `POST`| `/agent/delegate` | Hands off a task to the autonomous ReAct agent loop. |

### WebSocket Gateway (`ws://localhost:4000`)

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `TIMEBOX_TICK` | Server $\to$ Client | `{ activeTimeboxId, secondsRemaining }` (Emitted every second) |
| `TIMEBOX_WARNING` | Server $\to$ Client | 5-minute pre-alert payload with current & next block details |
| `TIMEBOX_SWITCH` | Server $\to$ Client | Task transition alert triggering the switch modal |
| `AGENT_STREAM_UPDATE` | Server $\to$ Client | Token-by-token ReAct thought, tool call, and observation logs |

---

## 🧠 Autonomous ReAct Agent Loop Walkthrough

When you click **"Delegate to Agent"** on a task like *"Solve Bug A on SellerPro project"*:

```
[Agent Initialized]
  │
  ├── 1. Ingest Context:
  │      Repo: /repos/sellerpro | Branch: fix/sp-412-checkout-npe
  │      Error: NPE at CheckoutService.java:142
  │
  ├── 2. Action: read_code(path='CheckoutService.java', lines=138-146)
  │      Observation: Line 141 lacks null-guard on discount token.
  │
  ├── 3. Action: grep_search(query='applyDiscount', dir='src/test')
  │      Observation: Missing unit test for null discount token.
  │
  ├── 4. Action: apply_patch(file='CheckoutService.java', null_guard)
  │      Observation: Patch applied cleanly.
  │
  ├── 5. Action: run_sandbox_command(cmd='./mvnw test -Dtest=CheckoutServiceTest')
  │      Observation: Tests run: 3, Failures: 0, BUILD SUCCESS.
  │
  └── [Success]: Prepares Git Diff and requests review in Planner UI.
```

---

## 🖥️ Desktop App (Tauri v2)

The desktop shell is located in `apps/desktop`. When Rust and Cargo are installed on your machine, you can run:

```bash
cd apps/desktop
pnpm dev
```

This compiles a native desktop executable featuring:
- **System Tray Mini-Widget**: Persistent countdown timer in your macOS menu bar with quick *Snooze* and *Switch* actions.
- **Global Hotkey** (`Cmd+Shift+K`): Instant popup to log an impromptu interruption or snapshot your thoughts without switching windows.
- **Native OS Notifications**: Desktop banners even when the window is minimized or behind your IDE.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
