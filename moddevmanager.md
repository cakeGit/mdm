# moddevmanager - Project Specification

## 1. Overview

**moddevmanager** (abbreviated as mdm as the 'logo') is a web-based application designed to manage Minecraft modding projects. It focuses on breaking down large mods into manageable hierarchical units, tracking focused work sessions using the Pomodoro technique, and visualizing progress to maintain motivation and context.

It needs to be able to run on my home server, so it must be able to package as a Docker container. Use a volume and ensure data is backed up in reasonable intervals.

Each low level task needs to be expandable so i can write extra details inside. The section inside the tasks allows for block based notion style editing, so Headers, Subheaders, Text boxes, bullet points. All of which need to be draggable and be accessible with MarkDown style keybinfs.

## 2. Goals

-   **Reduce Friction:** Provide a dedicated tool that understands mod development structure.
-   **Prevent Burnout:** Integrate timed work sessions to encourage sustainable pacing.
-   **Keeping the user projects in mind:** Each project should have a "last worked on" time. In the dashboard, politley hint abandoned projects as being a good opportunity to revisit.
-   **Preserve Context:** Maintain project state and session history to easily resume work.
-   **Visualize Progress:** Offer clear insights into project completion and personal activity, show a detailed tiered progress bar i.e. `stages completion -> substages completion -> task completion`. You also should display a calendar of session activity in each day, similar to github's commit history callendar.

## 3. Tech Stack

-   **Frontend:** React (with TypeScript)
-   **Backend:** Node.js + Express (with TypeScript)
-   **Database:** SQLite
-   **Styling:** Tailwind CSS, using Shadcn ui
-   **Deployment:** Docker Container

## 4. Data Model

### 4.1. Database Schema (`schema.sql`)

```sql
-- Main project container
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    minecraft_version TEXT,
    status TEXT DEFAULT 'planning', -- 'planning', 'active', 'on-hold', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hierarchical Stages (e.g., "Core Mod", "Features/Cool Mob")
CREATE TABLE stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_stage_id INTEGER, -- Enables nested substages. NULL for top-level.
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Individual actionable tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- 'todo', 'in-progress', 'completed'
    priority INTEGER DEFAULT 2, -- 1 (High), 2 (Medium), 3 (Low)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Pomodoro work sessions
CREATE TABLE work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- Duration in seconds (e.g., 1500 for 25 min)
    started_at DATETIME NOT NULL,
    notes TEXT, -- Notes about what was accomplished
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);
```

### 4.2. API Endpoints

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Fetch all projects | - |
| `POST` | `/api/projects` | Create a new project | `{ name, description, mcVersion }` |
| `GET` | `/api/projects/:id` | Get project + nested stages/tasks | - |
| `PATCH` | `/api/projects/:id` | Update project status/details | `{ status }` |
| `POST` | `/api/projects/:id/stages` | Add a stage to a project | `{ name, description, parentStageId? }` |
| `POST` | `/api/stages/:id/tasks` | Add a task to a stage | `{ title, description, priority }` |
| `PATCH` | `/api/tasks/:id` | Update a task (e.g., mark complete) | `{ status, title, ... }` |
| `GET` | `/api/sessions` | Get sessions (optional `?date=YYYY-MM-DD`) | - |
| `POST` | `/api/sessions` | Log a new work session | `{ projectId, duration, notes }` |

## 5. Core Features & User Interface

### 5.1. Project Dashboard (`/`)
-   **Purpose:** Overview of all modding projects.
-   **UI Components:**
    -   Header with "New Project" button.
    -   Grid of project cards.
    -   Each card displays:
        -   Project Name, Minecraft Version, Status Badge.
        -   Progress bar (calculated from completed tasks).
        -   "Last Updated" timestamp.
    -   A "Quick Stats" widget showing `Sessions This Week: #`.

### 5.2. Project Detail View (`/project/:id`)
-   **Purpose:** Central hub for managing a single mod.
-   **UI Components:**
    -   Project header (name, description, status dropdown).
    -   **Stage Hierarchy Panel:**
        -   A nested, collapsible list of stages and substages.
        -   Each stage item has an `Add Task` button and an `Add Sub-Stage` button.
        -   Clicking a stage reveals its task list.
    -   **Task List:**
        -   Tasks are displayed in a draggable kanban board or list with statuses (Todo, In Progress, Done).
        -   In-line editing for task titles/descriptions.
    -   **Recent Session Sidebar:** Lists the last 5 work sessions for this project, with notes.

### 5.3. Global Pomodoro Timer
-   **Purpose:** Manage focused work sessions.
-   **UI/Flow:**
    -   A fixed component at the bottom of the screen.
    -   Contains a project selector, timer display (25:00), and Start/Pause buttons.
    -   Includes an "Add Quick Note" button during a session.
    -   **On Timer Completion:** A modal appears prompting the user to:
        1.  Confirm the project.
        2.  Review/add notes about the session.
        3.  Click "Save Session" to log it to the database via `POST /api/sessions`.

### 5.4. Progress Dashboard (`/dashboard`)
-   **Purpose:** Visualize long-term progress and activity.
-   **UI Components:**
    -   **Activity Calendar:**
        -   Month-view calendar (e.g., using `react-calendar`).
        -   Days are shaded based on the number of work sessions logged.
    -   **Session History List:**
        -   Filterable, reverse-chronological list of all sessions.
        -   Displays: Date, Project, Duration, Notes.
    -   **Project Progress Overview:**
        -   A list of all active projects with their progress bars and task completion counts.


# Copilot note

Use shadcn/ui components for all UI.  
Always apply theme tokens (colors, spacing, typography).  
No raw HTML buttons, inputs, or divs unless styled.  
Output must look modern, clean, and consistent with shadcn/ui defaults.  

# Shadcn theme

```css
:root  {
  --background: 190 0% 95%;
  --foreground: 190 0% 10%;
  --card: 190 0% 90%;
  --card-foreground: 190 0% 13%;
  --popover: 190 0% 95%;
  --popover-foreground: 190 95% 10%;
  --primary: 190 24% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 190 10% 70%;
  --secondary-foreground: 0 0% 0%;
  --muted: 152 10% 85%;
  --muted-foreground: 190 0% 35%;
  --accent: 152 10% 80%;
  --accent-foreground: 190 0% 13%;
  --destructive: 0 50% 30%;
  --destructive-foreground: 190 0% 90%;
  --border: 190 20% 50%;
  --input: 190 20% 18%;
  --ring: 190 24% 50%;
  --radius: 0.3rem;
}
.dark  {
  --background: 190 10% 10%;
  --foreground: 190 0% 90%;
  --card: 190 0% 10%;
  --card-foreground: 190 0% 90%;
  --popover: 190 10% 5%;
  --popover-foreground: 190 0% 90%;
  --primary: 190 24% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 190 10% 13%;
  --secondary-foreground: 0 0% 100%;
  --muted: 152 10% 15%;
  --muted-foreground: 190 0% 60%;
  --accent: 152 10% 15%;
  --accent-foreground: 190 0% 90%;
  --destructive: 0 50% 30%;
  --destructive-foreground: 190 0% 90%;
  --border: 190 20% 18%;
  --input: 190 20% 18%;
  --ring: 190 24% 50%;
  --radius: 0.3rem;
}
```