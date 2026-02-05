# Design Document: Fanfic Management System

## Overview

Este documento detalha o design técnico para o sistema completo de gerenciamento de fanfics, incluindo funcionalidades de CRUD, upload de capas, editor de texto rico, sistema de rascunhos, publicação, avisos de conteúdo, sistema de tags e busca. O sistema será implementado seguindo a arquitetura existente do backend em Go com Gin framework e frontend em JavaScript vanilla.

## Architecture

### Backend Architecture

O backend segue uma arquitetura em camadas:

1. **Handler Layer** (`routes/`): Processa requisições HTTP, valida entrada, gerencia autenticação
2. **Service Layer** (`fanfic/`, `chapter/`, `tag/`): Implementa lógica de negócio e validações
3. **Repository Layer** (`fanfic/`, `chapter/`, `tag/`): Gerencia operações de banco de dados
4. **Model Layer** (`models/`): Define estruturas de dados e relacionamentos

### Frontend Architecture

O frontend utiliza:

1. **HTML Pages**: Páginas estáticas com estrutura semântica
2. **JavaScript Modules**: Módulos separados por funcionalidade
3. **CSS Stylesheets**: Estilos organizados por componente
4. **API Client**: Módulo centralizado para comunicação com backend

### Database Schema Extensions

Novas tabelas e campos necessários:

```sql
-- Adicionar campos à tabela fanfics
ALTER TABLE fanfics ADD COLUMN is_draft BOOLEAN DEFAULT TRUE;
ALTER TABLE fanfics ADD COLUMN is_adult_content BOOLEAN DEFAULT FALSE;
ALTER TABLE fanfics ADD COLUMN trigger_warnings TEXT;
ALTER TABLE fanfics ADD COLUMN published_at TIMESTAMP;

-- Adicionar campo à tabela chapters
ALTER TABLE chapters ADD COLUMN is_draft BOOLEAN DEFAULT TRUE;

-- Nova tabela: tags
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fandom', 'warning', 'pairing')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_name ON tags(name);

-- Nova tabela: fanfic_tags (many-to-many)
CREATE TABLE fanfic_tags (
    id SERIAL PRIMARY KEY,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fanfic_id, tag_id)
);

CREATE INDEX idx_fanfic_tags_fanfic ON fanfic_tags(fanfic_id);
CREATE INDEX idx_fanfic_tags_tag ON fanfic_tags(tag_id);
```

## Components and Interfaces

### Backend Components

#### 1. Fanfic Service Extensions

```go
// Extended Fanfic model
type Fanfic struct {
    ID              int
    AuthorID        int
    Title           string
    Synopsis        string
    Disclaimer      string
    Category        string
    CoverURL        string
    InteractiveMode bool
    IsDraft         bool
    IsAdultContent  bool
    TriggerWarnings string
    PublishedAt     *time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
    
    Author   User
    Chapters []Chapter
    Tags     []Tag
}

// Service methods
CreateFanfic(authorID int, data FanficCreateData) (*Fanfic, error)
UpdateFanfic(fanficID, authorID int, data FanficUpdateData) (*Fanfic, error)
DeleteFanfic(fanficID, authorID int) error
PublishFanfic(fanficID, authorID int) error
UnpublishFanfic(fanficID, authorID int) error
GetFanfic(fanficID int, includeUnpublished bool) (*Fanfic, error)
ListPublishedFanfics() ([]Fanfic, error)
ListAuthorFanfics(authorID int, includeDrafts bool) ([]Fanfic, error)
```

#### 2. Tag Service

```go
type Tag struct {
    ID        int
    Name      string
    Type      string // "fandom", "warning", "pairing"
    CreatedAt time.Time
}

type TagService interface {
    CreateTag(name, tagType string) (*Tag, error)
    GetOrCreateTag(name, tagType string) (*Tag, error)
    GetTagsByType(tagType string) ([]Tag, error)
    SearchTags(query, tagType string) ([]Tag, error)
    AddTagsToFanfic(fanficID int, tagIDs []int) error
    RemoveTagFromFanfic(fanficID, tagID int) error
    GetFanficTags(fanficID int) ([]Tag, error)
    SearchFanficsByTags(tagIDs []int) ([]Fanfic, error)
}
```

#### 3. Chapter Service Extensions

```go
// Extended Chapter model
type Chapter struct {
    ID        int
    FanficID  int
    Title     string
    Content   string // HTML content from rich text editor
    Order     int
    IsDraft   bool
    CreatedAt time.Time
    UpdatedAt time.Time
}

// Service methods
CreateChapter(fanficID, authorID int, data ChapterCreateData) (*Chapter, error)
UpdateChapter(chapterID, authorID int, data ChapterUpdateData) (*Chapter, error)
DeleteChapter(chapterID, authorID int) error
PublishChapter(chapterID, authorID int) error
```

### Frontend Components

#### 1. Rich Text Editor Component

```javascript
class RichTextEditor {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        this.toolbar = null;
        this.contentArea = null;
        this.options = options;
    }
    
    init() {
        // Initialize Quill.js or similar library
        // Toolbar: bold, italic, underline, strikethrough, lists, headings
    }
    
    getContent() {
        // Return HTML content
    }
    
    setContent(html) {
        // Set HTML content
    }
    
    clear() {
        // Clear editor
    }
}
```

#### 2. Fanfic Form Component

```javascript
class FanficForm {
    constructor(mode = 'create') {
        this.mode = mode; // 'create' or 'edit'
        this.fanficId = null;
        this.editors = {};
    }
    
    async init(fanficId = null) {
        // Initialize rich text editors for synopsis, disclaimer
        // Setup cover upload
        // Setup tag selectors
        // Load existing data if editing
    }
    
    async saveDraft() {
        // Save as draft
    }
    
    async publish() {
        // Validate and publish
    }
    
    async uploadCover(file) {
        // Upload cover image
    }
    
    async addTag(tagName, tagType) {
        // Add tag to fanfic
    }
    
    async removeTag(tagId) {
        // Remove tag from fanfic
    }
}
```

#### 3. Tag Search Component

```javascript
class TagSearch {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedTags = [];
    }
    
    async searchByTags(tagIds) {
        // Search fanfics by tags
    }
    
    renderResults(fanfics) {
        // Display search results
    }
    
    addTagFilter(tag) {
        // Add tag to filter
    }
    
    removeTagFilter(tagId) {
        // Remove tag from filter
    }
}
```

#### 4. Content Warning Modal

```javascript
class ContentWarningModal {
    constructor() {
        this.modal = null;
    }
    
    show(fanfic) {
        // Display warning modal with trigger warnings and adult content flag
    }
    
    onConfirm(callback) {
        // Handle user confirmation
    }
    
    hide() {
        // Close modal
    }
}
```

## Data Models

### Fanfic Model (Extended)

```go
type Fanfic struct {
    ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
    AuthorID        int       `gorm:"not null;index" json:"author_id"`
    Title           string    `gorm:"size:500;not null" json:"title"`
    Synopsis        string    `gorm:"type:text;not null" json:"synopsis"`
    Disclaimer      string    `gorm:"type:text" json:"disclaimer"`
    Category        string    `gorm:"size:100;not null;index" json:"category"`
    CoverURL        string    `gorm:"size:500" json:"cover_url"`
    InteractiveMode bool      `gorm:"default:false" json:"interactive_mode"`
    IsDraft         bool      `gorm:"default:true;index" json:"is_draft"`
    IsAdultContent  bool      `gorm:"default:false" json:"is_adult_content"`
    TriggerWarnings string    `gorm:"type:text" json:"trigger_warnings"`
    PublishedAt     *time.Time `gorm:"index" json:"published_at"`
    CreatedAt       time.Time `gorm:"autoCreateTime;index" json:"created_at"`
    UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
    
    Author   User      `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
    Chapters []Chapter `gorm:"foreignKey:FanficID" json:"chapters,omitempty"`
    Tags     []Tag     `gorm:"many2many:fanfic_tags" json:"tags,omitempty"`
}
```

### Tag Model

```go
type Tag struct {
    ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
    Name      string    `gorm:"size:100;not null;uniqueIndex" json:"name"`
    Type      string    `gorm:"size:20;not null;index" json:"type"` // fandom, warning, pairing
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
    
    Fanfics []Fanfic `gorm:"many2many:fanfic_tags" json:"fanfics,omitempty"`
}
```

### Chapter Model (Extended)

```go
type Chapter struct {
    ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
    FanficID  int       `gorm:"not null;index" json:"fanfic_id"`
    Title     string    `gorm:"size:500;not null" json:"title"`
    Content   string    `gorm:"type:text;not null" json:"content"`
    Order     int       `gorm:"not null;index" json:"order"`
    IsDraft   bool      `gorm:"default:true" json:"is_draft"`
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Default Draft Mode on Creation

*For any* newly created fanfic, the is_draft flag should be set to true by default.

**Validates: Requirements 1.1, 1.5, 7.1**

### Property 2: Unique Identifier Assignment

*For any* fanfic created, the system should assign a unique identifier that is never reused.

**Validates: Requirements 1.2**

### Property 3: Author Assignment Integrity

*For any* fanfic creation, the author_id should match the authenticated user's ID.

**Validates: Requirements 1.3**

### Property 4: Update Preserves Identity

*For any* fanfic update operation, the fanfic ID should remain unchanged.

**Validates: Requirements 2.1**

### Property 5: Authorization Enforcement

*For any* fanfic or chapter modification operation (edit, delete, publish), the operation should succeed only if the requesting user is the fanfic author.

**Validates: Requirements 2.5, 3.6, 5.4**

### Property 6: Timestamp Update on Modification

*For any* fanfic metadata update, the updated_at timestamp should be set to the current time.

**Validates: Requirements 2.6**

### Property 7: Cascade Deletion Integrity

*For any* fanfic deletion, all associated chapters, comments, questions, answers, and tag associations should be removed from the database.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 8: Cover Image File Cleanup

*For any* fanfic deletion or cover replacement, if a cover image exists, the old cover image file should be removed from storage.

**Validates: Requirements 3.5, 4.6**

### Property 9: Cover Image Format Validation

*For any* cover image upload, if the file format is not in the allowed list (JPEG, PNG, GIF, WEBP), the upload should be rejected with an error.

**Validates: Requirements 4.1, 4.7**

### Property 10: Cover Image Size Validation

*For any* cover image upload, if the file size exceeds 5MB, the upload should be rejected with an error.

**Validates: Requirements 4.2, 4.7**

### Property 11: Cover Image Storage and URL Update

*For any* valid cover image upload, the file should be stored in the uploads directory and the fanfic's cover_url field should be updated with the file path.

**Validates: Requirements 4.3, 4.5**

### Property 12: Unique Cover Filename Generation

*For any* cover image upload, the system should generate a unique filename to prevent conflicts with existing files.

**Validates: Requirements 4.4**

### Property 13: Chapter Cascade Deletion

*For any* chapter deletion, all comments associated with that chapter should be removed.

**Validates: Requirements 5.1, 5.2**

### Property 14: Chapter Reordering Consistency

*For any* chapter deletion, the remaining chapters should maintain sequential ordering without gaps (1, 2, 3, ..., N).

**Validates: Requirements 5.3**

### Property 15: Rich Text HTML Preservation

*For any* content saved through the rich text editor, the HTML formatting should be preserved when retrieved and displayed (round-trip property).

**Validates: Requirements 6.8, 6.9**

### Property 16: Draft Isolation from Public View

*For any* fanfic in draft mode (is_draft = true), it should not appear in public listings or search results for users other than the author.

**Validates: Requirements 7.3**

### Property 17: Draft Chapter Visibility Control

*For any* chapter in draft mode, it should be hidden from readers but visible to the fanfic author.

**Validates: Requirements 7.4**

### Property 18: Chapter Draft Status Setting

*For any* chapter creation, the system should allow setting the is_draft flag.

**Validates: Requirements 7.2**

### Property 19: Publication State Transition

*For any* draft fanfic, when published, the is_draft flag should be set to false and published_at timestamp should be set to the current time.

**Validates: Requirements 8.1, 8.5**

### Property 20: Published Fanfic Visibility

*For any* fanfic with is_draft = false, it should appear in public listings and search results.

**Validates: Requirements 8.2**

### Property 21: Chapter Publication Visibility

*For any* chapter with is_draft = false, it should be visible to all readers.

**Validates: Requirements 8.3**

### Property 22: Publication Validation

*For any* fanfic publication attempt, if required fields (title, synopsis) are empty or whitespace-only, the publication should be prevented with validation errors.

**Validates: Requirements 8.4**

### Property 23: Unpublication State Transition

*For any* published fanfic, when unpublished, the is_draft flag should be set to true and it should be hidden from public view.

**Validates: Requirements 8.6**

### Property 24: Adult Content Flag Persistence

*For any* fanfic marked as adult content, the is_adult_content flag should be stored in the database and included in API responses.

**Validates: Requirements 9.2, 9.6**

### Property 25: Tag Limit Enforcement

*For any* fanfic, the number of tags of each type (fandom, warning, pairing) should not exceed 5.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 26: Tag Association Persistence

*For any* tags added to a fanfic, the associations should be stored in the database and retrievable.

**Validates: Requirements 10.4**

### Property 27: Tag Grouping by Type

*For any* fanfic with tags, when retrieved, the tags should be grouped by type (fandom, warning, pairing).

**Validates: Requirements 10.5**

### Property 28: Tag Removal

*For any* tag removal operation, the association between the tag and fanfic should be removed from the database.

**Validates: Requirements 10.6**

### Property 29: Tag Creation on Demand

*For any* tag that doesn't exist in the database, the system should create it when adding to a fanfic.

**Validates: Requirements 10.7**

### Property 30: Tag Search by Type

*For any* search by a specific tag (fandom, warning, or pairing), only published fanfics with that tag should be returned.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 31: Multi-Tag Search Conjunction

*For any* search with multiple tags, only published fanfics that have ALL specified tags should be returned (AND logic).

**Validates: Requirements 11.4**

### Property 32: Category Requirement

*For any* fanfic creation or update, if no category is provided, the operation should fail with a validation error.

**Validates: Requirements 12.1**

### Property 33: Category Persistence

*For any* category selection, the category should be stored with the fanfic and retrievable.

**Validates: Requirements 12.3**

### Property 34: Category Grouping

*For any* homepage fanfic listing, fanfics should be grouped by their category.

**Validates: Requirements 12.4**

### Property 35: Category Filtering

*For any* category filter, only fanfics with that specific category should be returned.

**Validates: Requirements 12.5**

### Property 36: Trigger Warning Persistence

*For any* trigger warnings provided, they should be stored as part of the fanfic metadata and retrievable.

**Validates: Requirements 13.2**

## Error Handling

### Backend Error Handling

1. **Validation Errors**: Return 400 Bad Request with specific error codes
   - `TITLE_REQUIRED`, `SYNOPSIS_REQUIRED`, `CATEGORY_REQUIRED`
   - `INVALID_IMAGE_FORMAT`, `IMAGE_TOO_LARGE`
   - `TAG_LIMIT_EXCEEDED`

2. **Authorization Errors**: Return 403 Forbidden
   - `UNAUTHORIZED` - User is not the fanfic author

3. **Not Found Errors**: Return 404 Not Found
   - `FANFIC_NOT_FOUND`, `CHAPTER_NOT_FOUND`, `TAG_NOT_FOUND`

4. **Server Errors**: Return 500 Internal Server Error
   - `DATABASE_ERROR`, `FILE_SYSTEM_ERROR`

### Frontend Error Handling

1. **Form Validation**: Client-side validation before submission
   - Required fields check
   - Image format and size validation
   - Tag limit validation

2. **API Error Display**: User-friendly error messages
   - Toast notifications for errors
   - Inline form validation messages
   - Modal dialogs for critical errors

3. **Network Errors**: Retry logic and offline detection
   - Automatic retry for failed uploads
   - Save draft locally if network unavailable

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Fanfic Service Tests**
   - Create fanfic with valid data
   - Create fanfic with missing required fields
   - Update fanfic as author
   - Update fanfic as non-author (should fail)
   - Delete fanfic with cover image (verify cleanup)
   - Publish draft fanfic
   - Unpublish published fanfic

2. **Tag Service Tests**
   - Create new tag
   - Get or create existing tag
   - Add tags to fanfic (within limit)
   - Add tags exceeding limit (should fail)
   - Search fanfics by single tag
   - Search fanfics by multiple tags (AND logic)

3. **Chapter Service Tests**
   - Create chapter with HTML content
   - Delete chapter and verify reordering
   - Publish draft chapter

4. **Cover Upload Tests**
   - Upload valid image formats (JPEG, PNG, GIF, WEBP)
   - Upload invalid format (should fail)
   - Upload oversized image (should fail)
   - Replace existing cover (verify old file deleted)

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs. Each test should run a minimum of 100 iterations.

1. **Property Test: Draft Mode Isolation**
   - Generate random fanfics with is_draft=true
   - Query public listings
   - Verify draft fanfics not in results
   - **Feature: fanfic-management, Property 1: Draft Mode Isolation**

2. **Property Test: Authorization Enforcement**
   - Generate random fanfics with different authors
   - Attempt modifications with non-author users
   - Verify all operations fail with authorization error
   - **Feature: fanfic-management, Property 2: Authorization Enforcement**

3. **Property Test: Cover Image Validation**
   - Generate random image files with various formats and sizes
   - Attempt uploads
   - Verify only valid formats/sizes succeed
   - **Feature: fanfic-management, Property 3: Cover Image Validation**

4. **Property Test: Chapter Reordering Consistency**
   - Generate random fanfics with multiple chapters
   - Delete random chapters
   - Verify remaining chapters have sequential ordering
   - **Feature: fanfic-management, Property 5: Chapter Reordering Consistency**

5. **Property Test: Tag Limit Enforcement**
   - Generate random fanfics
   - Attempt to add more than 5 tags of each type
   - Verify operations fail when limit exceeded
   - **Feature: fanfic-management, Property 6: Tag Limit Enforcement**

6. **Property Test: Tag Search Conjunction**
   - Generate random fanfics with various tag combinations
   - Search with multiple tags
   - Verify results contain ALL specified tags
   - **Feature: fanfic-management, Property 7: Tag Search Conjunction**

7. **Property Test: Publication State Transition**
   - Generate random draft fanfics
   - Publish them
   - Verify is_draft=false and published_at is set
   - **Feature: fanfic-management, Property 8: Publication State Transition**

8. **Property Test: Rich Text Content Preservation**
   - Generate random HTML content with various formatting
   - Save and retrieve content
   - Verify HTML structure is preserved
   - **Feature: fanfic-management, Property 10: Rich Text Content Preservation**

9. **Property Test: Cascade Deletion Integrity**
   - Generate random fanfics with chapters, comments, tags
   - Delete fanfics
   - Verify all associated data is removed
   - **Feature: fanfic-management, Property 11: Cascade Deletion Integrity**

10. **Property Test: Search Result Filtering**
    - Generate random mix of draft and published fanfics
    - Perform tag searches
    - Verify only published fanfics in results
    - **Feature: fanfic-management, Property 15: Search Result Filtering**

### Integration Tests

1. **End-to-End Fanfic Creation Flow**
   - Create fanfic with cover and tags
   - Add chapters with rich text content
   - Publish fanfic
   - Verify visibility in public listings

2. **End-to-End Tag Search Flow**
   - Create multiple fanfics with various tags
   - Search by different tag combinations
   - Verify correct results returned

3. **End-to-End Draft Workflow**
   - Create draft fanfic
   - Edit multiple times
   - Publish
   - Unpublish
   - Verify state transitions

### Testing Tools

- **Backend**: Go testing package with `testing/quick` for property-based testing
- **Frontend**: Jest for unit tests, Playwright for E2E tests
- **API Testing**: Postman/Newman for API endpoint testing
- **Database**: Test database with fixtures for integration tests

