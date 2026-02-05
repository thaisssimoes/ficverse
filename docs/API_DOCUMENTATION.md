# Fanfic Management System - API Documentation

## Overview

This document provides comprehensive API documentation for the Fanfic Management System, covering all endpoints for fanfic CRUD operations, draft/publish workflow, tags, categories, and content warnings.

## Base URL

```
http://localhost:8080/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```
POST /api/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response: 201 Created
{
  "token": "string",
  "user": {
    "id": number,
    "username": "string",
    "email": "string"
  }
}
```

#### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200 OK
{
  "token": "string",
  "user": {
    "id": number,
    "username": "string",
    "email": "string"
  }
}
```

### Fanfics

#### Create Fanfic
```
POST /api/fanfics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "synopsis": "string (HTML)",
  "disclaimer": "string (HTML)",
  "category": "string",
  "interactive_mode": boolean,
  "is_adult_content": boolean,
  "trigger_warnings": "string"
}

Response: 201 Created
{
  "id": number,
  "author_id": number,
  "title": "string",
  "synopsis": "string",
  "disclaimer": "string",
  "category": "string",
  "cover_url": "string",
  "interactive_mode": boolean,
  "is_draft": boolean,
  "is_adult_content": boolean,
  "trigger_warnings": "string",
  "published_at": "timestamp or null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Get Fanfic
```
GET /api/fanfics/:id
Authorization: Bearer <token> (optional, required for drafts)

Response: 200 OK
{
  "id": number,
  "author_id": number,
  "title": "string",
  "synopsis": "string",
  "disclaimer": "string",
  "category": "string",
  "cover_url": "string",
  "interactive_mode": boolean,
  "is_draft": boolean,
  "is_adult_content": boolean,
  "trigger_warnings": "string",
  "published_at": "timestamp or null",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "author": {
    "id": number,
    "username": "string"
  },
  "tags": [
    {
      "id": number,
      "name": "string",
      "type": "fandom|warning|pairing"
    }
  ]
}
```

#### Update Fanfic
```
PUT /api/fanfics/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "synopsis": "string (HTML)",
  "disclaimer": "string (HTML)",
  "category": "string",
  "is_adult_content": boolean,
  "trigger_warnings": "string"
}

Response: 200 OK
{
  // Updated fanfic object
}
```

#### Delete Fanfic
```
DELETE /api/fanfics/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Fanfic deleted successfully"
}
```

#### List Published Fanfics
```
GET /api/fanfics
Query Parameters:
  - category: string (optional) - Filter by category

Response: 200 OK
[
  {
    // Fanfic objects (only published)
  }
]
```

#### List Author's Fanfics
```
GET /api/fanfics/author/:id
Authorization: Bearer <token> (optional)
Query Parameters:
  - include_drafts: boolean (default: false, requires auth as author)

Response: 200 OK
[
  {
    // Fanfic objects
  }
]
```

#### Publish Fanfic
```
POST /api/fanfics/:id/publish
Authorization: Bearer <token>

Response: 200 OK
{
  // Updated fanfic object with is_draft=false and published_at set
}
```

#### Unpublish Fanfic
```
POST /api/fanfics/:id/unpublish
Authorization: Bearer <token>

Response: 200 OK
{
  // Updated fanfic object with is_draft=true
}
```

#### Upload Cover Image
```
POST /api/fanfics/:id/cover
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - cover: file (JPEG, PNG, GIF, WEBP, max 5MB)

Response: 200 OK
{
  "cover_url": "string"
}
```

### Chapters

#### Create Chapter
```
POST /api/fanfics/:fanfic_id/chapters
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string (HTML)",
  "is_draft": boolean
}

Response: 201 Created
{
  "id": number,
  "fanfic_id": number,
  "title": "string",
  "content": "string",
  "order": number,
  "is_draft": boolean,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Get Chapter
```
GET /api/chapters/:id
Authorization: Bearer <token> (optional, required for drafts)

Response: 200 OK
{
  // Chapter object
}
```

#### Update Chapter
```
PUT /api/chapters/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string (HTML)"
}

Response: 200 OK
{
  // Updated chapter object
}
```

#### Delete Chapter
```
DELETE /api/chapters/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Chapter deleted successfully"
}
```

#### Publish Chapter
```
POST /api/chapters/:id/publish
Authorization: Bearer <token>

Response: 200 OK
{
  // Updated chapter object with is_draft=false
}
```

#### List Chapters
```
GET /api/fanfics/:fanfic_id/chapters
Authorization: Bearer <token> (optional)

Response: 200 OK
[
  {
    // Chapter objects (drafts hidden from non-authors)
  }
]
```

#### Reorder Chapters
```
PUT /api/fanfics/:fanfic_id/chapters/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "chapter_ids": [number, number, ...]
}

Response: 200 OK
{
  "message": "Chapters reordered successfully"
}
```

### Tags

#### Create Tag
```
POST /api/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "type": "fandom|warning|pairing"
}

Response: 201 Created
{
  "id": number,
  "name": "string",
  "type": "string",
  "created_at": "timestamp"
}
```

#### List Tags by Type
```
GET /api/tags
Query Parameters:
  - type: string (optional) - Filter by type (fandom, warning, pairing)

Response: 200 OK
[
  {
    "id": number,
    "name": "string",
    "type": "string"
  }
]
```

#### Search Tags
```
GET /api/tags/search
Query Parameters:
  - q: string (required) - Search query
  - type: string (optional) - Filter by type

Response: 200 OK
[
  {
    "id": number,
    "name": "string",
    "type": "string"
  }
]
```

#### Add Tags to Fanfic
```
POST /api/fanfics/:id/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tag_ids": [number, number, ...]
}

Response: 200 OK
{
  "message": "Tags added successfully"
}

Note: Maximum 5 tags per type (fandom, warning, pairing)
```

#### Remove Tag from Fanfic
```
DELETE /api/fanfics/:fanfic_id/tags/:tag_id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Tag removed successfully"
}
```

#### Get Fanfic Tags
```
GET /api/fanfics/:id/tags

Response: 200 OK
{
  "fandom": [
    {"id": number, "name": "string", "type": "fandom"}
  ],
  "warning": [
    {"id": number, "name": "string", "type": "warning"}
  ],
  "pairing": [
    {"id": number, "name": "string", "type": "pairing"}
  ]
}
```

#### Search Fanfics by Tags
```
GET /api/fanfics/search/tags
Query Parameters:
  - tag_ids: string (comma-separated tag IDs)

Response: 200 OK
[
  {
    // Fanfic objects matching ALL specified tags
  }
]
```

### Comments

#### Create Comment
```
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "fanfic_id": number,
  "chapter_id": number (optional),
  "content": "string"
}

Response: 201 Created
{
  "id": number,
  "user_id": number,
  "fanfic_id": number,
  "chapter_id": number or null,
  "content": "string",
  "created_at": "timestamp"
}
```

#### List Fanfic Comments
```
GET /api/fanfics/:id/comments

Response: 200 OK
[
  {
    // Comment objects
  }
]
```

#### List Chapter Comments
```
GET /api/chapters/:id/comments

Response: 200 OK
[
  {
    // Comment objects
  }
]
```

#### Delete Comment
```
DELETE /api/comments/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Comment deleted successfully"
}

Note: Only comment author or fanfic owner can delete
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Error message describing validation failure"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Categories

The system supports the following predefined categories:
- Romance
- Aventura
- Drama
- Comédia
- Ficção Científica
- Fantasia
- Terror
- Mistério

## Tag Types

Tags are organized into three types:
- **fandom**: Universe/series the fanfic belongs to
- **warning**: Content warnings (violence, mature themes, etc.)
- **pairing**: Character relationships/pairings

Each fanfic can have up to 5 tags of each type.

## Draft/Publish Workflow

1. **Creation**: Fanfics are created in draft mode by default (`is_draft=true`)
2. **Editing**: Authors can edit drafts freely
3. **Publishing**: Use `/api/fanfics/:id/publish` to make visible to readers
4. **Unpublishing**: Use `/api/fanfics/:id/unpublish` to return to draft mode

Draft fanfics and chapters are only visible to their authors.

## Content Warnings

Fanfics can be marked with:
- **is_adult_content**: Boolean flag for adult content
- **trigger_warnings**: Free-text field for specific warnings

These should be displayed prominently before allowing readers to access the content.
