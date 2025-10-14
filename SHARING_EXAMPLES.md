# Project Sharing Examples

This document provides practical examples of using the project sharing system.

## Scenario 1: Collaborating with a Teammate

**Context:** Alice wants to collaborate with Bob on her Minecraft mod project. Bob should be able to add tasks and update progress.

### Step 1: Alice creates a project
```bash
# Alice logs in and creates a project
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Awesome Mod",
    "description": "A collaborative Minecraft mod",
    "color": "#6366f1"
  }'
```

Response:
```json
{
  "id": 1,
  "name": "Awesome Mod",
  "description": "A collaborative Minecraft mod",
  "color": "#6366f1",
  "status": "active"
}
```

### Step 2: Alice shares with Bob (read/write permission)
```bash
curl -X POST http://localhost:3001/api/projects/1/share \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "permission": "readwrite"
  }'
```

Response:
```json
{
  "id": 1,
  "project_id": 1,
  "shared_with_user_id": 2,
  "permission": "readwrite",
  "created_by_user_id": 1
}
```

### Step 3: Bob sees the shared project
```bash
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer BOB_TOKEN"
```

Response includes:
```json
[
  {
    "id": 1,
    "name": "Awesome Mod",
    "description": "A collaborative Minecraft mod",
    "permission": "readwrite",
    "is_shared": 1,
    ...
  }
]
```

### Step 4: Bob adds a stage
```bash
curl -X POST http://localhost:3001/api/stages \
  -H "Authorization: Bearer BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "Core Mechanics",
    "description": "Implement core game mechanics"
  }'
```

### Step 5: Bob adds tasks
```bash
curl -X POST http://localhost:3001/api/stages/1/tasks \
  -H "Authorization: Bearer BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Create custom block",
    "description": "Implement the basic block with textures",
    "priority": 1
  }'
```

### Step 6: Alice and Bob track their own sessions
```bash
# Alice logs her work session
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "duration": 1500,
    "notes": "Set up project structure"
  }'

# Bob logs his work session separately
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "duration": 1800,
    "notes": "Implemented custom block"
  }'
```

**Result:** Alice and Bob can both modify the project, but their work sessions remain separate for accurate time tracking.

---

## Scenario 2: Getting Feedback from a Beta Tester

**Context:** Carol wants to share her mod progress with a beta tester (Dave) who should only view the project, not modify it.

### Step 1: Carol shares with Dave (read-only)
```bash
curl -X POST http://localhost:3001/api/projects/2/share \
  -H "Authorization: Bearer CAROL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dave",
    "permission": "read"
  }'
```

### Step 2: Dave views the project
```bash
# Dave can view the project
curl http://localhost:3001/api/projects/2 \
  -H "Authorization: Bearer DAVE_TOKEN"
```

### Step 3: Dave tries to modify (fails)
```bash
# This will fail with 403 Forbidden
curl -X PATCH http://localhost:3001/api/projects/2 \
  -H "Authorization: Bearer DAVE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

Response:
```json
{
  "error": "Write access denied"
}
```

**Result:** Dave can view all project details but cannot make any modifications.

---

## Scenario 3: Sharing Progress Publicly

**Context:** Eve wants to share her mod development progress on social media without requiring viewers to create an account.

### Step 1: Eve generates an anonymous share link
```bash
curl -X POST http://localhost:3001/api/projects/3/share-token \
  -H "Authorization: Bearer EVE_TOKEN"
```

Response:
```json
{
  "id": 1,
  "project_id": 3,
  "token": "a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8",
  "created_at": "2025-10-14T15:30:00.000Z"
}
```

### Step 2: Eve shares the URL
Eve posts this URL on Twitter/Reddit:
```
http://mymod.com/api/shared/a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8
```

### Step 3: Anyone can view without authentication
```bash
# No authentication required!
curl http://localhost:3001/api/shared/a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8
```

Response includes full project details:
```json
{
  "id": 3,
  "name": "Eve's Awesome Mod",
  "description": "A public mod project",
  "stages": [...],
  "permission": "read",
  "shared": true
}
```

### Step 4: Eve revokes the link when needed
```bash
curl -X DELETE http://localhost:3001/api/projects/3/share-token \
  -H "Authorization: Bearer EVE_TOKEN"
```

**Result:** Anyone with the link can view the project progress without signing in. Eve can revoke access at any time.

---

## Scenario 4: Managing Multiple Collaborators

**Context:** Frank is managing a large mod project with multiple team members with different permission levels.

### Step 1: Frank shares with team members
```bash
# Share with developer (read/write)
curl -X POST http://localhost:3001/api/projects/4/share \
  -H "Authorization: Bearer FRANK_TOKEN" \
  -d '{"username": "developer1", "permission": "readwrite"}'

# Share with another developer (read/write)
curl -X POST http://localhost:3001/api/projects/4/share \
  -H "Authorization: Bearer FRANK_TOKEN" \
  -d '{"username": "developer2", "permission": "readwrite"}'

# Share with designer (read-only for feedback)
curl -X POST http://localhost:3001/api/projects/4/share \
  -H "Authorization: Bearer FRANK_TOKEN" \
  -d '{"username": "designer", "permission": "read"}'
```

### Step 2: Frank lists all shares
```bash
curl http://localhost:3001/api/projects/4/shares \
  -H "Authorization: Bearer FRANK_TOKEN"
```

Response:
```json
[
  {
    "id": 1,
    "project_id": 4,
    "shared_with_user_id": 5,
    "shared_with_username": "developer1",
    "shared_with_email": "dev1@example.com",
    "permission": "readwrite",
    "created_at": "2025-10-14T10:00:00.000Z"
  },
  {
    "id": 2,
    "project_id": 4,
    "shared_with_user_id": 6,
    "shared_with_username": "developer2",
    "shared_with_email": "dev2@example.com",
    "permission": "readwrite",
    "created_at": "2025-10-14T10:01:00.000Z"
  },
  {
    "id": 3,
    "project_id": 4,
    "shared_with_user_id": 7,
    "shared_with_username": "designer",
    "shared_with_email": "designer@example.com",
    "permission": "read",
    "created_at": "2025-10-14T10:02:00.000Z"
  }
]
```

### Step 3: Frank removes access for someone who left
```bash
curl -X DELETE http://localhost:3001/api/projects/4/shares/2 \
  -H "Authorization: Bearer FRANK_TOKEN"
```

**Result:** Frank maintains full control over who can access and modify the project.

---

## Scenario 5: Updating Permission Levels

**Context:** Grace initially gave Harry read-only access but now wants to give him read/write permission.

### Step 1: Grace updates Harry's permission
```bash
# Sharing with the same username updates the existing permission
curl -X POST http://localhost:3001/api/projects/5/share \
  -H "Authorization: Bearer GRACE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "harry",
    "permission": "readwrite"
  }'
```

The system automatically updates the existing share record due to the `UNIQUE(project_id, shared_with_user_id)` constraint and `ON CONFLICT` clause.

**Result:** Harry's permission is upgraded from read to readwrite without creating a duplicate share.

---

## Best Practices

1. **Use read/write permission for active collaborators** who will contribute code and tasks
2. **Use read permission for reviewers and testers** who should only view progress
3. **Use anonymous links for public sharing** on social media or with external stakeholders
4. **Revoke anonymous tokens** when they're no longer needed to maintain security
5. **Regularly review shares** using the list endpoint to ensure only current team members have access
6. **Track personal sessions separately** - even in shared projects, each user's time tracking remains private

## Security Notes

- Only project owners can share projects or manage shares
- Anonymous tokens are 64 characters long and cryptographically secure
- All write operations are permission-checked at the API level
- Session data is always user-specific and never shared
- Removing a share immediately revokes all access for that user
