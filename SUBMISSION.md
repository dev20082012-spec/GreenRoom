# Greenroom — Real-World Apprentice Simulator

**Tagline**: *Closing the graduate-to-workplace skills gap through simulated corporate pressure, live manager agents, and real codebase hotfixes.*  
**Track / Hackathon**: Horizon Hackathon // Unstop Engineering Apprenticeship Track  
**Release**: `v1.0.0-rc // Horizon Hackathon Release`  
**Distribution Mode**: Standalone Zero-Dependency Single Bundle (`index.html`, `styles.css`, `app.js`)

---

## 1. The Core Problem

Every year, thousands of computer science graduates enter the tech workforce knowing how to solve LeetCode algorithms and write isolated functions in academic sandboxes. Yet, **within their first 90 days, over 65% of junior hires struggle or freeze in enterprise environments**.

Why? Because college and coding bootcamps don't teach the real realities of engineering work:
1. **Ambiguous Tickets & Production Crashes**: Real bugs don't come with clean unit test prompts; they arrive as P0 crash alerts, opaque stack traces, and urgent customer outage reports.
2. **Manager & War Room Pressure**: Engineering isn't done in a vacuum. Senior architects demand concise status updates, strict incident SLAs, and adherence to security conventions.
3. **Defensive Edge-Case Discipline**: In school, passing the happy path is an "A". In production, missing an unguarded `undefined` header crashes the entire gateway container cluster.
4. **Corporate Intranet Overwhelm**: Junior engineers struggle to balance incoming email alerts, Slack incident war rooms, staging logs, and code diff reviews simultaneously.

---

## 2. The Greenroom Solution

**Greenroom** is an interactive, browser-based workplace apprenticeship simulator that bridges the transition from student to enterprise software engineer. 

Instead of generic flashcards or static tutorials, Greenroom places the candidate into the shoes of **Alex Chen**, an incoming software engineering apprentice at **ApexCore Systems**, facing their Day 1 P0 production outage.

### Core Architectural Pillars:
1. **Authentic Corporate Sandbox**:
   - **Corporate Inbox**: Real-world triage of P0 blocker incident tickets, VP security directives, and Jira automation feeds.
   - **Task Workspace & Inline Diff Highlighter**: Dual-pane editor comparing vulnerable production code with working copies, complete with Longest Common Subsequence (LCS) visual diff highlighting.
   - **Staging Server Monospace Terminal**: Realistic Node.js/Express production container logs and runtime stack traces (`TypeError: Cannot read properties of undefined (reading 'split')`).

2. **Reactive Lead Architect Agent (Vikram Malhotra)**:
   - Dynamic **Manager Patience Meter** (starts at 72%) tracking promptness, tone, and technical accuracy.
   - Real-time **Agentic Mid-Sprint War Room Interruption**: Simulates unpredictable corporate pressure by injecting high-priority executive escalation inquiries with a 45-second SLA window.
   - Instant response via enterprise status dispatch chips or natural language reports.

3. **Live Supervisory Telemetry & Hiring Readiness Scorecard**:
   - **Four-Pillar Evaluation Rubric**:
     - *Technical Rigor & Null-Safety* (RFC 6750 Bearer compliance, early returns vs messy try-catch).
     - *Professional Communication* (latency, quick-status chip etiquette, war room responsiveness).
     - *Production Urgency & SLA* (ticket intake cycle time, incident resolution velocity).
     - *Code Cleanliness & Security* (minimal diff scope, zero debug leaks, defensive guarding).
   - **Live Supervisor Audit Feed**: Real-time event log with timestamps and impact tracking.
   - **Apprenticeship Assessment Report**: Dynamic end-game debrief modal calculating candidate readiness rating (Associate L1, Junior SWE, or Guided Remediation), specific gameplay strengths & vulnerabilities, and one-click clipboard export.

4. **Zero-Dependency Sound Synthesizer & Toast System**:
   - Pure HTML5 Web Audio API synthesizing subtle enterprise chimes, test pass major triad chords, and error buzzes without external MP3 assets.
   - Real-time notification toasts for deployments, patience adjustments, and SLA warnings.

---

## 3. 90-Second Demo Video Script

*This beat-by-beat script aligns directly with the presentation hotkeys for rapid recording and live stage judging.*

| Time Window | Screen Action | Voiceover Audio Script | Demo Trigger |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:20** | Start on **Corporate Inbox**. Open email `APX-104` from QA Lead Priya Sharma showing the P0 Staging Auth Crash stack trace. Click **"OPEN IN WORKSPACE >>"**. | *"Most fresh graduates know syntax, but freeze when a production server panics. Welcome to Greenroom: a live workplace apprenticeship simulator. We're Alex Chen, Day 1 intern at ApexCore Systems. Our Corporate Inbox just lit up with a P0 blocker: our auth gateway is crashing staging with an unhandled TypeError."* | Click Inbox -> Open Workspace |
| **00:20 - 00:40** | Switch to **Team Chat**. Vikram's messages are visible. Trigger mid-sprint alert. The red war room escalation chips appear. Click *"Running regression tests now, 2 mins"*. | *"Our Lead Architect, Vikram Malhotra, is monitoring our progress on the incident channel. While we're reading the ticket, an urgent war room ping escalates: the VP of Product needs an immediate ETA. Greenroom tests crisis communication under a 45-second SLA window. We dispatch a concise status update—Vikram acknowledges, preserving our patience score."* | `Ctrl + Shift + 2` (or click chip) |
| **00:40 - 01:10** | In **Task Workspace**, click `[VIEW STAGING LOGS]`, then `[DIFF HIGHLIGHTER]`. Run tests (failing). Hit `Ctrl + Shift + 1` (loads fix) or load patch. Run tests (all 3 PASS with green sound). Click **"SUBMIT PR TO VIKRAM"** -> Dispatch. | *"In the workspace, we inspect real container logs, identifying line 14's unhandled split on undefined headers. Clicking 'Diff Highlighter' provides an instant visual diff. We run our unit test harness—it catches the regression. We implement defensive null-checks and RFC 6750 Bearer guards. We re-run: 3 out of 3 assertions pass! We dispatch Pull Request #249 directly to Vikram."* | Click Staging Logs -> `Ctrl + Shift + 1` -> Run Tests -> Submit PR |
| **01:10 - 01:30** | Vikram approves PR. Debrief modal opens automatically (or hit `Ctrl + Shift + 4`). Show Grade A (92%), breakdown metrics, click **"DOWNLOAD PERFORMANCE RECORD"**. Show toast. Switch to **Manager Evaluation Log** to reveal live telemetry feed. | *"Vikram approves and merges to staging! Instantly, Greenroom generates our Apprenticeship Assessment Report: Grade A, Associate L1 ready. It grades our technical null-safety, professional communication, and SLA urgency, auditing our exact decisions. With one click, our performance record copies to the clipboard. Greenroom bridges the gap from classroom theory to day-one production readiness."* | `Ctrl + Shift + 4` -> Click Download -> Switch to Tab 4 |

---

## 4. Hackathon Presentation Hotkey Cheat Sheet

For presenters, judges, and live demonstrations, Greenroom includes keyboard shortcuts and an on-screen **`[PRESENTATION CONTROLS]`** drawer in the sidebar footer:

| Hotkey | Action Name | System Execution |
| :--- | :--- | :--- |
| `Ctrl + Shift + 0` | **Pre-Flight Audit** | Executes 5-point automated engine diagnostic self-test and opens HUD overlay. |
| `Ctrl + Shift + 1` | **Auto-Fill Fix** | Pre-fills recommended RFC 6750 Bearer null-guard logic directly into the editor. |
| `Ctrl + Shift + 2` | **War Room Ping** | Fires the Lead Architect urgent escalation alert, ping badge, and status response chips. |
| `Ctrl + Shift + 3` | **Pass Unit Tests** | Validates unit test assertions 3/3 green and unlocks PR submission pipeline. |
| `Ctrl + Shift + 4` | **Open Assessment Report** | Opens the comprehensive end-game Sprint Debrief Scorecard modal. |

*Note: On-screen buttons inside `[PRESENTATION CONTROLS]` trigger the exact same actions for mouse-driven or touch demonstrations.*

---

## 5. Technology Stack & Offline Distribution

Greenroom is engineered strictly according to modern enterprise intranet constraints:

- **Frontend Core**: Vanilla HTML5, CSS3, ES6+ JavaScript.
- **Audio Synthesis**: Native HTML5 Web Audio API (zero external `.mp3` or `.wav` dependencies).
- **Styling Architecture**: Custom CSS custom properties, responsive desktop bounds (`min-width: 1024px`), custom scrollbars, and strict zero-gradient / zero-glassmorphism design system.
- **Diff Engine**: In-browser Longest Common Subsequence (LCS) line diff algorithm.
- **Portability**: 100% offline-capable. Runs cleanly via `file:///` protocol (double-clicking `index.html`) or any lightweight static web server (`npx serve`, Python `http.server`, etc.).

---

## 6. How to Run Locally

### Option A: Direct Browser Launch (Simplest)
1. Navigate to the repository root.
2. Double-click [index.html](file:///c:/Users/omen/GreenRoom/index.html) in any modern browser (Chrome, Edge, Firefox, Safari).

### Option B: Local Static Server
```bash
# Using Python 3
python -m http.server 8080

# Or using Node.js / npx
npx serve .
```
Then navigate to `http://localhost:8080`.

---

## 7. Submission Checklist & Rubric Verification

- [x] **Phase 1: Visual Shell & Intranet Layout**: Top navigation bar, 3-zone desktop layout, Backstage Green & Spotlight Amber design system.
- [x] **Phase 2: Core Interactivity & Diff Editor**: Functional Corporate Inbox, Team Chat, Task Workspace, and Manager Evaluation Log with tab synchronization.
- [x] **Phase 3: Live Telemetry & Evaluation Layer**: 4-metric scoring rubric, live supervisor audit trail, Web Audio API sound synthesizer, staging logs modal, and sprint debrief scorecard.
- [x] **Phase 4: QA, Hardening & Presentation Polish**: Tab key indentation, cross-tab persistence, rapid-click guards, incident escalation modal, demo hotkeys, custom scrollbars, and clipboard export.
- [x] **Zero External CDN Dependencies**: 100% self-contained and offline-safe.
- [x] **Zero Console Errors**: Verified pristine execution with zero runtime warnings or errors.

---

*ApexCore Systems // Apprenticeship Division — Built for the Horizon Hackathon 2026.*
