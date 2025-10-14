# ModDevManager (MDM)

A web-based application designed to manage Minecraft modding projects with integrated Pomodoro timer for focused development sessions.

## Features

- **Project Management**: Organize Minecraft mod projects with hierarchical stages and tasks
- **Project Sharing**: Share projects with other users with read or read/write permissions
- **Anonymous Share Links**: Generate read-only links that don't require sign-in
- **Pomodoro Timer**: Integrated 25-minute work sessions to maintain focus
- **Progress Tracking**: Visual progress bars and completion statistics
- **Session History**: Track development time and notes (separate per user)
- **Responsive UI**: Modern interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js with Express and TypeScript
- **Database**: SQLite
- **Deployment**: Docker

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd mdm
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application at `http://localhost:3001`

## Development Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Start development servers:
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

## Project Structure

```
/
├── backend/          # Node.js/Express API
│   ├── src/         # TypeScript source code
│   └── schema.sql   # Database schema
├── frontend/        # React application
│   └── src/        # React components and utilities
├── Dockerfile      # Production container
└── docker-compose.yml  # Docker Compose configuration
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects (owned and shared)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (requires write access)

### Project Sharing
- `POST /api/projects/:id/share` - Share project with a user
- `GET /api/projects/:id/shares` - List all shares for a project
- `DELETE /api/projects/:id/shares/:shareId` - Remove a share
- `POST /api/projects/:id/share-token` - Generate anonymous read-only link
- `GET /api/projects/:id/share-token` - Get existing share token
- `DELETE /api/projects/:id/share-token` - Revoke anonymous link
- `GET /api/shared/:token` - Access project via anonymous token (no auth required)

### Stages & Tasks
- `POST /api/projects/:id/stages` - Add stage to project (requires write access)
- `POST /api/stages/:id/tasks` - Add task to stage (requires write access)
- `PATCH /api/tasks/:id` - Update task (requires write access)

### Sessions
- `GET /api/sessions` - Get work sessions (user-specific)
- `POST /api/sessions` - Log work session (user-specific)

## Data Backup

The SQLite database is stored in a Docker volume (`mdm_data`). To backup:

```bash
docker-compose exec mdm cp /app/data/database.sqlite /tmp/backup.sqlite
docker cp $(docker-compose ps -q mdm):/tmp/backup.sqlite ./backup.sqlite
```

## License

MIT