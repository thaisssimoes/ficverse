# Implementation Plan: Fanfic Management System

## Overview

Este plano implementa o sistema completo de gerenciamento de fanfics, incluindo CRUD operations, upload de capas, editor de texto rico, sistema de rascunhos, publicação, avisos de conteúdo, sistema de tags e busca. A implementação será feita de forma incremental, começando pelo backend (Go) e depois frontend (JavaScript).

## Tasks

- [x] 1. Extend database schema and models
  - Add new fields to fanfics table (is_draft, is_adult_content, trigger_warnings, published_at)
  - Add is_draft field to chapters table
  - Create tags table with type field (fandom, warning, pairing)
  - Create fanfic_tags junction table for many-to-many relationship
  - Update Fanfic model in Go to include new fields and Tags relationship
  - Update Chapter model to include is_draft field
  - Create Tag model with Fanfics relationship
  - Run database migrations
  - _Requirements: 1.5, 7.1, 7.2, 8.5, 9.2, 10.1-10.3, 13.2_

- [x] 2. Implement Tag Service (Backend)
  - [x] 2.1 Create tag repository with CRUD operations
    - Implement CreateTag, GetOrCreateTag, GetTagsByType, SearchTags
    - Implement AddTagsToFanfic, RemoveTagFromFanfic, GetFanficTags
    - Implement SearchFanficsByTags with AND logic
    - _Requirements: 10.4, 10.6, 10.7, 11.1-11.4_

  - [ ]* 2.2 Write property test for tag limit enforcement
    - **Property 25: Tag Limit Enforcement**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 2.3 Write property test for tag search conjunction
    - **Property 31: Multi-Tag Search Conjunction**
    - **Validates: Requirements 11.4**

  - [ ]* 2.4 Write unit tests for tag service
    - Test create tag
    - Test get or create existing tag
    - Test add tags to fanfic
    - Test remove tag from fanfic
    - Test search by tags
    - _Requirements: 10.4, 10.6, 10.7, 11.1-11.4_

- [x] 3. Extend Fanfic Service for draft and publication
  - [x] 3.1 Update CreateFanfic to set is_draft=true by default
    - Modify service to initialize new fanfics in draft mode
    - _Requirements: 1.1, 1.5, 7.1_

  - [x] 3.2 Implement PublishFanfic method
    - Validate required fields (title, synopsis)
    - Set is_draft=false and published_at=current time
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 3.3 Implement UnpublishFanfic method
    - Set is_draft=true
    - _Requirements: 8.6_

  - [x] 3.4 Update GetFanfic to support includeUnpublished parameter
    - Filter by is_draft based on user authorization
    - _Requirements: 7.3, 8.2_

  - [x] 3.5 Update ListPublishedFanfics to filter by is_draft=false
    - Exclude draft fanfics from public listings
    - _Requirements: 7.3, 8.2_

  - [x] 3.6 Add methods for adult content and trigger warnings
    - UpdateAdultContentFlag, UpdateTriggerWarnings
    - _Requirements: 9.2, 13.2_

  - [ ]* 3.7 Write property test for default draft mode
    - **Property 1: Default Draft Mode on Creation**
    - **Validates: Requirements 1.1, 1.5, 7.1**

  - [ ]* 3.8 Write property test for draft isolation
    - **Property 16: Draft Isolation from Public View**
    - **Validates: Requirements 7.3**

  - [ ]* 3.9 Write property test for publication state transition
    - **Property 19: Publication State Transition**
    - **Validates: Requirements 8.1, 8.5**

  - [ ]* 3.10 Write property test for publication validation
    - **Property 22: Publication Validation**
    - **Validates: Requirements 8.4**

  - [ ]* 3.11 Write unit tests for publication workflow
    - Test publish draft fanfic
    - Test unpublish published fanfic
    - Test publish without required fields (should fail)
    - _Requirements: 8.1, 8.4, 8.5, 8.6_

- [x] 4. Extend Chapter Service for draft mode
  - [x] 4.1 Update CreateChapter to support is_draft flag
    - Allow setting draft status on chapter creation
    - _Requirements: 7.2_

  - [x] 4.2 Implement PublishChapter method
    - Set is_draft=false
    - _Requirements: 8.3_

  - [x] 4.3 Update GetChapter to filter by draft status and authorization
    - Hide draft chapters from non-authors
    - _Requirements: 7.4_

  - [ ]* 4.4 Write property test for chapter draft visibility
    - **Property 17: Draft Chapter Visibility Control**
    - **Validates: Requirements 7.4**

  - [ ]* 4.5 Write unit tests for chapter draft workflow
    - Test create draft chapter
    - Test publish chapter
    - Test visibility based on user role
    - _Requirements: 7.2, 7.4, 8.3_

- [x] 5. Implement Tag API endpoints
  - [x] 5.1 Create tag handler with routes
    - POST /api/tags - Create new tag
    - GET /api/tags?type={type} - List tags by type
    - GET /api/tags/search?q={query}&type={type} - Search tags
    - POST /api/fanfics/:id/tags - Add tags to fanfic
    - DELETE /api/fanfics/:id/tags/:tagId - Remove tag from fanfic
    - GET /api/fanfics/:id/tags - Get fanfic tags
    - GET /api/fanfics/search/tags?tagIds={ids} - Search fanfics by tags
    - _Requirements: 10.4, 10.6, 10.7, 11.1-11.4_

  - [ ]* 5.2 Write integration tests for tag endpoints
    - Test add tags to fanfic (within limit)
    - Test add tags exceeding limit (should fail)
    - Test search by single tag
    - Test search by multiple tags
    - _Requirements: 10.1-10.4, 11.1-11.4_

- [x] 6. Extend Fanfic API endpoints
  - [x] 6.1 Update POST /api/fanfics to support new fields
    - Add is_draft, is_adult_content, trigger_warnings to request
    - _Requirements: 1.1, 9.2, 13.2_

  - [x] 6.2 Update PUT /api/fanfics/:id to support new fields
    - Allow updating is_adult_content, trigger_warnings
    - _Requirements: 9.2, 13.2_

  - [x] 6.3 Add POST /api/fanfics/:id/publish endpoint
    - Publish draft fanfic
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 6.4 Add POST /api/fanfics/:id/unpublish endpoint
    - Unpublish published fanfic
    - _Requirements: 8.6_

  - [x] 6.5 Update GET /api/fanfics to filter by is_draft
    - Exclude drafts from public listings
    - _Requirements: 7.3, 8.2_

  - [x] 6.6 Update GET /api/fanfics/author/:id to include draft parameter
    - Allow author to see their drafts
    - _Requirements: 7.5_

  - [ ]* 6.7 Write integration tests for publication endpoints
    - Test publish draft fanfic
    - Test unpublish fanfic
    - Test draft visibility in listings
    - _Requirements: 7.3, 8.1, 8.2, 8.6_

- [x] 7. Checkpoint - Backend Core Complete
  - Ensure all backend tests pass
  - Verify database migrations applied correctly
  - Test API endpoints with Postman/curl
  - Ask user if questions arise

- [x] 8. Integrate rich text editor (Frontend)
  - [x] 8.1 Add Quill.js library to project
    - Include Quill CSS and JS files
    - _Requirements: 6.1-6.7_

  - [x] 8.2 Create RichTextEditor component
    - Initialize Quill with toolbar (bold, italic, underline, strikethrough, lists, headings)
    - Implement getContent() and setContent() methods
    - _Requirements: 6.4-6.7_

  - [x] 8.3 Apply rich text editor to synopsis field
    - Replace textarea with Quill editor
    - _Requirements: 6.2_

  - [x] 8.4 Apply rich text editor to disclaimer field
    - Replace textarea with Quill editor
    - _Requirements: 6.3_

  - [x] 8.5 Apply rich text editor to chapter content field
    - Replace textarea with Quill editor
    - _Requirements: 6.1_

  - [ ]* 8.6 Write property test for HTML preservation
    - **Property 15: Rich Text HTML Preservation**
    - **Validates: Requirements 6.8, 6.9**

  - [ ]* 8.7 Write unit tests for rich text editor
    - Test content setting and getting
    - Test HTML formatting preservation
    - _Requirements: 6.8, 6.9_

- [x] 9. Implement fanfic creation form with new features
  - [x] 9.1 Create/update fanfic form HTML
    - Add fields for adult content checkbox
    - Add textarea for trigger warnings
    - Add tag input sections (fandom, warning, pairing)
    - Add draft/publish buttons
    - _Requirements: 1.1, 9.1, 10.1-10.3, 13.1_

  - [x] 9.2 Create FanficForm JavaScript component
    - Initialize rich text editors
    - Handle cover upload
    - Handle tag addition/removal with limit validation
    - Implement saveDraft() method
    - Implement publish() method
    - _Requirements: 1.1, 4.1-4.7, 8.1, 8.4, 9.1, 10.1-10.7_

  - [x] 9.3 Add tag autocomplete functionality
    - Search existing tags as user types
    - Allow creating new tags
    - _Requirements: 10.7_

  - [x] 9.4 Add client-side validation
    - Validate required fields before publish
    - Validate tag limits (5 per type)
    - Validate cover image format and size
    - _Requirements: 4.1, 4.2, 8.4, 10.1-10.3_

  - [ ]* 9.5 Write unit tests for fanfic form
    - Test form initialization
    - Test save draft
    - Test publish with validation
    - Test tag addition with limit
    - _Requirements: 1.1, 8.1, 8.4, 10.1-10.3_

- [x] 10. Implement fanfic edit form
  - [x] 10.1 Create edit fanfic page
    - Load existing fanfic data
    - Populate form fields including tags
    - Load rich text content into editors
    - _Requirements: 2.1-2.4_

  - [x] 10.2 Implement update functionality
    - Update fanfic metadata
    - Update tags
    - Replace cover if new one uploaded
    - _Requirements: 2.1-2.6, 4.6_

  - [ ]* 10.3 Write property test for update preserves identity
    - **Property 4: Update Preserves Identity**
    - **Validates: Requirements 2.1**

  - [ ]* 10.4 Write unit tests for edit form
    - Test load existing data
    - Test update metadata
    - Test cover replacement
    - _Requirements: 2.1-2.6, 4.6_

- [x] 11. Implement fanfic deletion
  - [x] 11.1 Add delete button to fanfic management UI
    - Show confirmation modal
    - _Requirements: 3.1_

  - [x] 11.2 Implement delete functionality
    - Call DELETE /api/fanfics/:id endpoint
    - Handle success and error responses
    - _Requirements: 3.1-3.6_

  - [ ]* 11.3 Write property test for cascade deletion
    - **Property 7: Cascade Deletion Integrity**
    - **Validates: Requirements 3.1-3.4**

  - [ ]* 11.4 Write property test for cover cleanup
    - **Property 8: Cover Image File Cleanup**
    - **Validates: Requirements 3.5, 4.6**

  - [ ]* 11.5 Write unit tests for deletion
    - Test delete fanfic
    - Test authorization (non-author cannot delete)
    - Test cover file cleanup
    - _Requirements: 3.1-3.6_

- [x] 12. Implement content warning modal
  - [x] 12.1 Create ContentWarningModal component
    - Display adult content warning if is_adult_content=true
    - Display trigger warnings if present
    - Require explicit confirmation to proceed
    - _Requirements: 9.3, 9.4, 13.3, 13.6_

  - [x] 12.2 Integrate modal into fanfic detail page
    - Show modal before displaying fanfic content
    - Store user confirmation in session
    - _Requirements: 9.3, 13.3_

  - [ ]* 12.3 Write unit tests for warning modal
    - Test modal display with adult content
    - Test modal display with trigger warnings
    - Test confirmation flow
    - _Requirements: 9.3, 9.4, 13.3_

- [x] 13. Implement tag search functionality
  - [x] 13.1 Create TagSearch component
    - Display tag filter UI
    - Allow selecting multiple tags
    - Show selected tags with remove option
    - _Requirements: 11.1-11.4_

  - [x] 13.2 Implement search by tags
    - Call search API with selected tag IDs
    - Display results with fanfic cards
    - Show "no results" message when appropriate
    - _Requirements: 11.1-11.6_

  - [x] 13.3 Add tag click navigation
    - Make tags in fanfic detail page clickable
    - Navigate to search results for clicked tag
    - _Requirements: 11.7_

  - [ ]* 13.4 Write property test for tag search filtering
    - **Property 30: Tag Search by Type**
    - **Validates: Requirements 11.1-11.3**

  - [ ]* 13.5 Write unit tests for tag search
    - Test search by single tag
    - Test search by multiple tags
    - Test no results scenario
    - _Requirements: 11.1-11.6_

- [x] 14. Implement category system
  - [x] 14.1 Create category constants
    - Define predefined categories: Romance, Aventura, Drama, Comédia, Ficção Científica, Fantasia, Terror, Mistério
    - _Requirements: 12.2_

  - [x] 14.2 Add category dropdown to fanfic form
    - Make category required field
    - _Requirements: 12.1_

  - [x] 14.3 Implement category filtering
    - Add category filter to homepage
    - Filter fanfics by selected category
    - _Requirements: 12.4, 12.5_

  - [ ]* 14.4 Write property test for category requirement
    - **Property 32: Category Requirement**
    - **Validates: Requirements 12.1**

  - [ ]* 14.5 Write unit tests for category system
    - Test category selection
    - Test category filtering
    - Test category grouping
    - _Requirements: 12.1, 12.3-12.5_

- [x] 15. Implement dashboard with draft/published view
  - [x] 15.1 Update dashboard to show draft status
    - Display badge indicating draft or published status
    - Filter by draft/published
    - _Requirements: 7.5_

  - [x] 15.2 Add publish/unpublish buttons to dashboard
    - Quick publish from dashboard
    - Quick unpublish from dashboard
    - _Requirements: 8.1, 8.6_

  - [ ]* 15.3 Write unit tests for dashboard
    - Test draft status display
    - Test publish from dashboard
    - Test unpublish from dashboard
    - _Requirements: 7.5, 8.1, 8.6_

- [x] 16. Update fanfic cards to show new metadata
  - [x] 16.1 Add adult content badge to fanfic cards
    - Display age rating icon if is_adult_content=true
    - _Requirements: 9.5_

  - [x] 16.2 Add trigger warning icon to fanfic cards
    - Display warning icon if trigger_warnings exist
    - _Requirements: 13.5_

  - [x] 16.3 Display tags on fanfic cards
    - Show tags grouped by type with distinct styling
    - _Requirements: 10.5, 10.8_

  - [x] 16.4 Display category prominently
    - Show category badge on cards
    - _Requirements: 12.6_

  - [ ]* 16.5 Write unit tests for fanfic card display
    - Test adult content badge display
    - Test trigger warning icon display
    - Test tag display with grouping
    - _Requirements: 9.5, 10.5, 13.5_

- [x] 17. Implement chapter management with draft mode
  - [x] 17.1 Add draft checkbox to chapter form
    - Allow marking chapter as draft
    - _Requirements: 7.2_

  - [x] 17.2 Add publish button to chapter management
    - Publish draft chapters
    - _Requirements: 8.3_

  - [x] 17.3 Update chapter list to show draft status
    - Display draft badge on chapters
    - Hide draft chapters from readers
    - _Requirements: 7.4_

  - [ ]* 17.4 Write unit tests for chapter draft workflow
    - Test create draft chapter
    - Test publish chapter
    - Test draft visibility
    - _Requirements: 7.2, 7.4, 8.3_

- [x] 18. Implement chapter deletion with reordering
  - [x] 18.1 Add delete button to chapter management
    - Show confirmation modal
    - _Requirements: 5.1_

  - [x] 18.2 Implement delete with reordering
    - Call DELETE /api/chapters/:id endpoint
    - Backend automatically reorders remaining chapters
    - Refresh chapter list after deletion
    - _Requirements: 5.1-5.3_

  - [ ]* 18.3 Write property test for chapter reordering
    - **Property 14: Chapter Reordering Consistency**
    - **Validates: Requirements 5.3**

  - [ ]* 18.4 Write unit tests for chapter deletion
    - Test delete chapter
    - Test reordering after deletion
    - Test authorization
    - _Requirements: 5.1-5.4_

- [x] 19. Add authorization checks to all operations
  - [x] 19.1 Verify authorization in all edit operations
    - Check user is fanfic author before allowing edit
    - _Requirements: 2.5_

  - [x] 19.2 Verify authorization in all delete operations
    - Check user is fanfic author before allowing delete
    - _Requirements: 3.6, 5.4_

  - [ ]* 19.3 Write property test for authorization enforcement
    - **Property 5: Authorization Enforcement**
    - **Validates: Requirements 2.5, 3.6, 5.4**

  - [ ]* 19.4 Write unit tests for authorization
    - Test edit as non-author (should fail)
    - Test delete as non-author (should fail)
    - _Requirements: 2.5, 3.6, 5.4_

- [x] 20. Checkpoint - Frontend Core Complete
  - Ensure all frontend tests pass
  - Test all forms and workflows manually
  - Verify rich text editor works correctly
  - Verify tag system works correctly
  - Ask user if questions arise

- [x] 21. Integration testing and bug fixes
  - [x] 21.1 Test complete fanfic creation workflow
    - Create fanfic with all fields
    - Add tags
    - Upload cover
    - Save as draft
    - Publish
    - _Requirements: 1.1-1.5, 4.1-4.7, 8.1-8.5, 9.1-9.6, 10.1-10.8_

  - [x] 21.2 Test complete fanfic edit workflow
    - Edit all fields
    - Add/remove tags
    - Replace cover
    - Update adult content flag
    - Update trigger warnings
    - _Requirements: 2.1-2.6, 4.6, 9.2, 10.4-10.7, 13.2_

  - [x] 21.3 Test complete fanfic deletion workflow
    - Delete fanfic with chapters and tags
    - Verify cascade deletion
    - Verify cover cleanup
    - _Requirements: 3.1-3.6_

  - [x] 21.4 Test complete tag search workflow
    - Search by single tag
    - Search by multiple tags
    - Verify only published fanfics returned
    - _Requirements: 11.1-11.7_

  - [x] 21.5 Test complete draft/publish workflow
    - Create draft
    - Edit draft
    - Publish
    - Verify visibility changes
    - Unpublish
    - _Requirements: 7.1-7.6, 8.1-8.6_

  - [x] 21.6 Test content warning workflow
    - Mark fanfic as adult content
    - Add trigger warnings
    - Verify warning modal displays
    - _Requirements: 9.1-9.6, 13.1-13.6_

  - [ ]* 21.7 Write end-to-end integration tests
    - Test complete user journey from creation to publication
    - Test search and discovery
    - Test content warnings
    - _Requirements: All_

- [x] 22. Final checkpoint and documentation
  - Ensure all tests pass (unit, property, integration)
  - Update API documentation
  - Update user documentation
  - Verify all requirements implemented
  - Ask user for final review

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend tasks (1-7) should be completed before frontend tasks (8-22)
- Rich text editor integration (task 8) is foundational for forms (tasks 9-10)
- Tag system (tasks 2, 5, 13) can be developed in parallel with draft/publish system (tasks 3-4, 6)

