# Project Sharing Documentation

The ModDevManager (MDM) project sharing system allows you to collaborate with others on your projects. There are two types of sharing:

1. **User-based sharing** - Share with specific users with read or read/write permissions
2. **Anonymous sharing** - Generate a read-only link that anyone can access without signing in

## Features

### Separate Session Data
- Each user maintains their own work sessions and time tracking
- Sessions are never shared between users, even when collaborating on the same project
- This ensures accurate personal productivity metrics

### Shared Tasks
- All tasks, stages, and project structure are shared between collaborators
- Changes made by any user with write access are immediately visible to all collaborators
- Progress tracking reflects contributions from all team members

## User-Based Sharing

### Permission Levels

#### Read Permission
- View project structure, stages, and tasks
- See project progress and completion statistics
- Cannot modify anything in the project

#### Read/Write Permission
- All read permissions
- Create, edit, and delete stages
- Create, edit, and delete tasks
- Update project details (name, description, color)
- Cannot share the project with others (only the owner can do this)

### Sharing a Project

**Endpoint:** `POST /api/projects/:id/share`

**Request Body:**
```json
{
  "username": "friendUsername",
  "permission": "read"
}
```

**Permission values:**
- `"read"` - Read-only access
- `"readwrite"` - Read and write access

**Example:**
```bash
curl -X POST http://localhost:3001/api/projects/1/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "friend", "permission": "readwrite"}'
```

### Listing Shares

**Endpoint:** `GET /api/projects/:id/shares`

Returns all users the project is shared with, including their usernames and permissions.

**Example Response:**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "shared_with_user_id": 5,
    "shared_with_username": "friend",
    "shared_with_email": "friend@example.com",
    "permission": "readwrite",
    "created_at": "2025-10-14T10:30:00.000Z"
  }
]
```

### Removing a Share

**Endpoint:** `DELETE /api/projects/:id/shares/:shareId`

Removes access for a specific user. Only the project owner can remove shares.

## Anonymous Share Links

Anonymous share links provide read-only access to a project without requiring the recipient to sign in or create an account.

### Generating an Anonymous Link

**Endpoint:** `POST /api/projects/:id/share-token`

Creates or returns an existing anonymous share token for the project.

**Example Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "token": "a1b2c3d4e5f6...",
  "created_at": "2025-10-14T10:30:00.000Z"
}
```

The shareable URL would be: `http://your-domain.com/api/shared/a1b2c3d4e5f6...`

### Accessing a Shared Project

**Endpoint:** `GET /api/shared/:token`

No authentication required. Returns the full project structure including stages and tasks.

**Example:**
```bash
curl http://localhost:3001/api/shared/a1b2c3d4e5f6...
```

**Response:**
```json
{
  "id": 1,
  "name": "My Mod Project",
  "description": "A cool mod",
  "color": "#6366f1",
  "stages": [...],
  "permission": "read",
  "shared": true
}
```

### Revoking an Anonymous Link

**Endpoint:** `DELETE /api/projects/:id/share-token`

Permanently revokes the anonymous share link. The token becomes invalid immediately.

## Viewing Shared Projects

### In Project List

When you call `GET /api/projects`, the response includes both your own projects and projects shared with you. Shared projects have these additional fields:

```json
{
  "id": 5,
  "name": "Shared Project",
  "permission": "read",
  "is_shared": 1,
  ...
}
```

- `permission`: Your permission level (`"read"`, `"readwrite"`, or `"owner"`)
- `is_shared`: `1` if shared with you, `0` if you own it

## Security Considerations

1. **Owner-only operations:**
   - Only the project owner can share the project or manage shares
   - Only the owner can generate or revoke anonymous links

2. **Permission enforcement:**
   - All API endpoints check permissions before allowing operations
   - Read permission prevents any modifications
   - Write permission is required for creating/updating stages and tasks

3. **Session isolation:**
   - Work sessions are always tied to the user who created them
   - Users cannot see or modify other users' sessions
   - Session statistics remain personal

4. **Token security:**
   - Anonymous share tokens are 64-character random hex strings
   - Tokens can be revoked at any time by the project owner
   - No expiration by default, but can be implemented if needed

## Examples

### Complete Collaboration Workflow

1. **User A creates a project:**
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -d '{"name": "New Mod", "description": "Building a new mod together"}'
```

2. **User A shares with User B (read/write):**
```bash
curl -X POST http://localhost:3001/api/projects/1/share \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -d '{"username": "userB", "permission": "readwrite"}'
```

3. **User B can now see and edit the project:**
```bash
# List projects (includes shared projects)
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer USER_B_TOKEN"

# Add a stage
curl -X POST http://localhost:3001/api/stages \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{"project_id": 1, "name": "Core Features"}'

# Add a task
curl -X POST http://localhost:3001/api/stages/1/tasks \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{"title": "Implement block system", "priority": 1}'
```

4. **User A generates a public link for feedback:**
```bash
curl -X POST http://localhost:3001/api/projects/1/share-token \
  -H "Authorization: Bearer USER_A_TOKEN"

# Returns token: abc123...
# Share URL: http://localhost:3001/api/shared/abc123...
```

5. **Anyone can view via the public link:**
```bash
curl http://localhost:3001/api/shared/abc123...
# No authentication needed!
```

## Testing

The sharing system includes comprehensive tests covering:

- ✅ Sharing projects with read permission
- ✅ Sharing projects with read/write permission
- ✅ Access control (non-owners cannot share)
- ✅ Listing shares
- ✅ Read access to shared projects
- ✅ Including shared projects in project list
- ✅ Denying write access with read permission
- ✅ Allowing write access with read/write permission
- ✅ Creating stages with write permission
- ✅ Creating tasks with write permission
- ✅ Generating anonymous tokens
- ✅ Accessing projects via anonymous tokens
- ✅ Token reuse (same token returned on subsequent requests)
- ✅ Revoking anonymous tokens
- ✅ Removing shares

Run tests with:
```bash
cd backend
npm test
```
