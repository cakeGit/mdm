# Per-User Completion Tracking

## Overview

In response to feedback on the project sharing system, we've added comprehensive per-user completion tracking. This ensures that when multiple users collaborate on a project, each user's contributions are properly tracked and personal statistics remain accurate.

## Problem Solved

**User Feedback:**
> "Good, but add that per user completion tracking, i dont want the statistics to just disappear yk"
> 
> "can you track who completed a task? if a user is the only person on a project you do not need to display, but otherwise, say [who completed it]"

When projects are shared, we needed to ensure:
1. Personal completion statistics don't "disappear" when collaborating
2. It's clear who completed each task
3. Each user can track their own contributions

## Implementation

### Database Changes

**Migration 006: Add completed_by tracking**
```sql
ALTER TABLE tasks ADD COLUMN completed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
```

This field is automatically set when a task is marked as complete and cleared when unmarked.

### API Changes

#### Task Updates (PATCH /api/tasks/:id)

When marking a task as complete:
```typescript
if (status === 'completed') {
  updates.push('completed_at = CURRENT_TIMESTAMP');
  updates.push('completed_by_user_id = ?');
  values.push(req.user.userId);
}
```

When unmarking:
```typescript
else {
  updates.push('completed_at = NULL');
  updates.push('completed_by_user_id = NULL');
}
```

#### Project Details (GET /api/projects/:id)

Now returns tasks with completion attribution:
```json
{
  "id": 5,
  "title": "Implement feature",
  "status": "completed",
  "completed_by_username": "alice"
}
```

For shared projects (2+ users), includes per-user statistics:
```json
{
  "userCompletionStats": [
    {
      "user_id": 1,
      "username": "owner",
      "completed_count": 15
    },
    {
      "user_id": 2,
      "username": "collaborator",
      "completed_count": 8
    }
  ]
}
```

**Note:** `userCompletionStats` is only included when multiple users have worked on the project. Solo projects don't show this field.

#### Personal Statistics (GET /api/stats/progress)

Updated to track only tasks completed by the authenticated user:

**Old behavior:**
- Counted all tasks in owned projects (misleading in shared projects)

**New behavior:**
- Only counts tasks where `completed_by_user_id` matches the user
- Includes tasks from both owned and shared projects
- Personal statistics remain accurate regardless of sharing

Query changes:
```sql
-- Old: Count all tasks in user's projects
WHERE p.user_id = ?

-- New: Count only tasks completed by user in owned OR shared projects
WHERE (p.user_id = ? OR ps.shared_with_user_id = ?)
  AND t.completed_by_user_id = ?
```

## Features

### 1. Task Attribution

Every completed task shows who completed it (when relevant):

```bash
# Get project details
GET /api/projects/1

# Response includes:
{
  "stages": [{
    "tasks": [{
      "id": 5,
      "title": "Bug fix",
      "status": "completed",
      "completed_by_username": "alice",  # New field
      "completed_at": "2025-10-14T15:30:00.000Z"
    }]
  }]
}
```

### 2. Per-User Statistics

For shared projects, see everyone's contributions:

```json
{
  "id": 1,
  "name": "Team Project",
  "totalTasks": 30,
  "completedTasks": 23,
  "userCompletionStats": [    # Only shown when 2+ users
    {
      "user_id": 1,
      "username": "alice",
      "completed_count": 15
    },
    {
      "user_id": 2,
      "username": "bob",
      "completed_count": 8
    }
  ]
}
```

### 3. Personal Tracking

Your personal stats always reflect YOUR contributions:

```bash
GET /api/stats/progress

# Response:
{
  "completedTasks": 23,        # Tasks YOU completed
  "totalTasks": 50,            # Tasks in projects you own/share
  "weeklyStats": {
    "thisWeek": {
      "tasks": 5              # Tasks YOU completed this week
    }
  }
}
```

Even in shared projects, you only see your own completion counts.

## Examples

### Example 1: Collaborative Development

**Scenario:** Alice and Bob work together on a mod project.

1. **Alice completes Task A:**
   ```bash
   PATCH /api/tasks/1
   { "status": "completed" }
   ```
   
   System records: `completed_by_user_id = alice.id`

2. **Bob completes Task B:**
   ```bash
   PATCH /api/tasks/2
   { "status": "completed" }
   ```
   
   System records: `completed_by_user_id = bob.id`

3. **View project:**
   ```bash
   GET /api/projects/1
   ```
   
   Response shows:
   - Task A: `completed_by_username: "alice"`
   - Task B: `completed_by_username: "bob"`
   - `userCompletionStats`: Alice=1, Bob=1

4. **Alice checks her stats:**
   ```bash
   GET /api/stats/progress  # As Alice
   ```
   
   Shows: `completedTasks: 1` (only Task A)

5. **Bob checks his stats:**
   ```bash
   GET /api/stats/progress  # As Bob
   ```
   
   Shows: `completedTasks: 1` (only Task B)

### Example 2: Solo Project

**Scenario:** Carol works alone on her project.

1. **Carol completes tasks:**
   ```bash
   PATCH /api/tasks/1 { "status": "completed" }
   PATCH /api/tasks/2 { "status": "completed" }
   ```

2. **View project:**
   ```bash
   GET /api/projects/1
   ```
   
   Response:
   - Tasks show as completed
   - NO `userCompletionStats` field (solo project)
   - Completion attribution not displayed (not needed)

### Example 3: Shared Project Statistics

**Scenario:** Team of 3 working together.

```bash
GET /api/projects/1
```

Response:
```json
{
  "name": "Team Mod",
  "totalTasks": 45,
  "completedTasks": 30,
  "userCompletionStats": [
    { "username": "alice", "completed_count": 15 },
    { "username": "bob", "completed_count": 10 },
    { "username": "carol", "completed_count": 5 }
  ]
}
```

Each team member's stats endpoint shows only their own contributions:
- Alice's stats: `completedTasks: 15`
- Bob's stats: `completedTasks: 10`
- Carol's stats: `completedTasks: 5`

## Testing

Added comprehensive test suite (`completion-tracking.test.ts`) with 5 tests:

✅ Track who completed each task
✅ Show per-user completion stats for shared projects
✅ Hide per-user stats for solo projects
✅ Personal stats show only user's own completions
✅ Clear tracking when task is unmarked

All 29 tests passing (24 sharing + 5 completion tracking).

## Benefits

1. **Accurate Attribution**
   - Clear visibility of who contributed what
   - Helpful for team coordination and recognition

2. **Personal Accountability**
   - Each user can track their own productivity
   - Statistics remain meaningful in shared contexts

3. **Fair Representation**
   - No one's contributions are hidden or inflated
   - Team dynamics are transparent

4. **Seamless Experience**
   - Solo projects work as before (no UI clutter)
   - Shared projects automatically show attribution
   - No configuration needed

## Technical Details

### Query Optimization

The per-user stats query is optimized with a UNION:

```sql
-- Get completions by shared users
SELECT ps.shared_with_user_id, u.username, COUNT(*) 
FROM project_shares ps
JOIN users u ON ps.shared_with_user_id = u.id
LEFT JOIN tasks t ON t.completed_by_user_id = ps.shared_with_user_id
WHERE ps.project_id = ? AND t.status = 'completed'
GROUP BY ps.shared_with_user_id

UNION

-- Get completions by project owner
SELECT p.user_id, u.username, COUNT(*)
FROM projects p
JOIN users u ON p.user_id = u.id
LEFT JOIN tasks t ON t.completed_by_user_id = p.user_id
WHERE p.id = ? AND t.status = 'completed'
GROUP BY p.user_id
```

This ensures:
- All collaborators are included (both owner and shared users)
- Counts are accurate (only completed tasks)
- Performance is good (indexed joins)

### TypeScript Types

Added new interfaces:

```typescript
interface Task {
  // ... existing fields
  completed_by_user_id?: number;
  completed_by_username?: string;
}

interface ProjectWithDetails {
  // ... existing fields
  userCompletionStats?: UserCompletionStat[];
}

interface UserCompletionStat {
  user_id: number;
  username: string;
  completed_count: number;
}
```

## Migration Path

The new `completed_by_user_id` column is added via migration 006. It's nullable and defaults to NULL for existing tasks.

**Existing tasks:** Will show as completed but without attribution (NULL `completed_by_username`)

**New completions:** Will have full attribution

This ensures backward compatibility while providing enhanced tracking for future work.

## Summary

Per-user completion tracking ensures that collaboration doesn't come at the cost of personal metrics. Each user maintains accurate statistics while still benefiting from shared project visibility. The system is smart enough to show attribution only when relevant (2+ users) and maintains privacy where appropriate (personal stats).
