# ModDevManager (MDM)

A web-based application designed to manage Minecraft modding projects with integrated Pomodoro timer for focused development sessions.

## Features

- **Project Management**: Organize Minecraft mod projects with hierarchical stages and tasks
- **Pomodoro Timer**: Integrated 25-minute work sessions to maintain focus
- **Progress Tracking**: Visual progress bars and completion statistics
- **Session History**: Track development time and notes
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

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/stages` - Add stage to project
- `POST /api/stages/:id/tasks` - Add task to stage
- `PATCH /api/tasks/:id` - Update task
- `GET /api/sessions` - Get work sessions
- `POST /api/sessions` - Log work session

## Data Backup

The SQLite database is stored in a Docker volume (`mdm_data`). To backup:

```bash
docker-compose exec mdm cp /app/data/database.sqlite /tmp/backup.sqlite
docker cp $(docker-compose ps -q mdm):/tmp/backup.sqlite ./backup.sqlite
```

## License

MIT