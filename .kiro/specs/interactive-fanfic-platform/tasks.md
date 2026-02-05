# Implementation Plan: Interactive Fanfic Platform

## Overview

Este plano de implementação divide o desenvolvimento da plataforma de fanfics interativas em tarefas incrementais. O backend será implementado em Go com uma API RESTful, e o frontend será uma aplicação web moderna e responsiva. As tarefas são organizadas para permitir validação incremental através de testes unitários e property-based tests.

## Tasks

- [x] 1. Setup project structure and dependencies
  - Create Go module for backend with necessary dependencies (Gin/Chi, GORM, JWT, bcrypt)
  - Create frontend project structure with HTML/CSS/JS
  - Setup PostgreSQL database schema
  - Configure development environment
  - _Requirements: 10.2, 12.1_

- [x] 2. Implement database models and migrations
  - [x] 2.1 Create database schema for all entities
    - Define tables for User, Fanfic, Chapter, Question, Answer, Comment, PendingQuestion
    - Create foreign key relationships
    - Add indexes for performance
    - _Requirements: 12.1_
  
  - [x] 2.2 Write property test for unique ID generation
    - **Property 5: Fanfic creation persists all data (unique ID part)**
    - **Validates: Requirements 2.2**
  
  - [x] 2.3 Implement database connection and migration logic
    - Setup connection pooling
    - Create migration runner
    - _Requirements: 12.1_

- [x] 3. Implement authentication system
  - [x] 3.1 Create User model and repository
    - Implement user CRUD operations
    - Add password hashing with bcrypt
    - _Requirements: 1.3_
  
  - [x] 3.2 Implement authentication service
    - Registration logic with validation
    - Login with JWT token generation
    - Token validation middleware
    - Logout functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.3 Write property tests for authentication
    - **Property 1: Valid credentials create sessions**
    - **Validates: Requirements 1.1**
  
  - [x] 3.4 Write property test for invalid credentials
    - **Property 2: Invalid credentials are rejected**
    - **Validates: Requirements 1.2**
  
  - [x] 3.5 Write property test for registration
    - **Property 3: Registration creates unique users**
    - **Validates: Requirements 1.3**
  
  - [x] 3.6 Write property test for logout
    - **Property 4: Logout terminates sessions**
    - **Validates: Requirements 1.4**
  
  - [x] 3.7 Write unit tests for edge cases
    - Test duplicate email registration
    - Test password validation
    - Test token expiration

- [x] 4. Implement fanfic publication system
  - [x] 4.1 Create Fanfic model and repository
    - Implement fanfic CRUD operations
    - Add cover image upload handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Implement fanfic service
    - Create fanfic with validation
    - Update fanfic metadata
    - Delete fanfic
    - List fanfics by category
    - _Requirements: 2.1, 2.4, 2.5, 2.6_
  
  - [x] 4.3 Write property test for fanfic creation
    - **Property 5: Fanfic creation persists all data**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.6**
  
  - [x] 4.4 Write property test for image validation
    - **Property 7: Image validation rejects invalid formats**
    - **Validates: Requirements 2.3**
  
  - [x] 4.5 Write unit tests for fanfic operations
    - Test fanfic creation with all fields
    - Test image format validation
    - Test category assignment

- [x] 5. Implement chapter management
  - [x] 5.1 Create Chapter model and repository
    - Implement chapter CRUD operations
    - Add ordering logic
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.2 Implement chapter service
    - Create chapter with ordering
    - Update chapter content
    - Delete chapter with reordering
    - Reorder chapters
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [x] 5.3 Write property test for chapter ordering
    - **Property 8: Chapter ordering is maintained**
    - **Validates: Requirements 3.1, 3.4, 6.3**
  
  - [x] 5.4 Write property test for chapter updates
    - **Property 9: Chapter updates preserve identity**
    - **Validates: Requirements 3.2**
  
  - [x] 5.5 Write property test for chapter deletion
    - **Property 10: Chapter deletion adjusts ordering**
    - **Validates: Requirements 3.3**
  
  - [x] 5.6 Write property test for reordering
    - **Property 11: Chapter reordering updates sequence**
    - **Validates: Requirements 3.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement interactive mode system
  - [x] 7.1 Create Question and Answer models
    - Implement question CRUD operations
    - Implement answer storage and retrieval
    - _Requirements: 4.1, 4.2, 7.2_
  
  - [x] 7.2 Implement interactive service
    - Create and manage questions
    - Save and retrieve answers
    - Placeholder substitution logic
    - Pending questions tracking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.3_
  
  - [x] 7.3 Write property test for question persistence
    - **Property 12: Questions are persisted with placeholders**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 7.4 Write property test for pending questions
    - **Property 13: New questions create pending status**
    - **Validates: Requirements 4.3, 9.1**
  
  - [x] 7.5 Write property test for question deletion
    - **Property 14: Question deletion removes data**
    - **Validates: Requirements 4.4**
  
  - [x] 7.6 Write property test for placeholder validation
    - **Property 15: Placeholder validation**
    - **Validates: Requirements 4.5**
  
  - [x] 7.7 Write property test for placeholder substitution
    - **Property 23: Placeholder substitution in interactive mode**
    - **Validates: Requirements 7.3, 8.3**
  
  - [x] 7.8 Write property test for non-interactive mode
    - **Property 25: Non-interactive mode shows original text**
    - **Validates: Requirements 7.5**

- [x] 8. Implement comment system
  - [x] 8.1 Create Comment model and repository
    - Implement comment CRUD operations
    - Add chronological ordering
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 8.2 Implement comment service
    - Create comments on fanfics and chapters
    - Delete comments with authorization
    - List comments with ordering
    - _Requirements: 13.1, 13.2, 13.4, 13.6_
  
  - [x] 8.3 Write property test for comment storage
    - **Property 33: Comments are stored with metadata**
    - **Validates: Requirements 13.1, 13.2**
  
  - [x] 8.4 Write property test for comment ordering
    - **Property 34: Comments are ordered chronologically**
    - **Validates: Requirements 13.3**
  
  - [x] 8.5 Write property test for comment authorization
    - **Property 37: Comment deletion authorization**
    - **Validates: Requirements 13.6**

- [x] 9. Implement API endpoints
  - [x] 9.1 Create HTTP router and middleware
    - Setup Gin/Chi router
    - Implement authentication middleware
    - Add error handling middleware
    - _Requirements: 10.1, 10.5_
  
  - [x] 9.2 Implement authentication endpoints
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 9.3 Implement fanfic endpoints
    - GET /api/fanfics (list by category)
    - GET /api/fanfics/:id
    - POST /api/fanfics
    - PUT /api/fanfics/:id
    - DELETE /api/fanfics/:id
    - GET /api/users/:id/fanfics
    - _Requirements: 2.1, 2.5, 5.1, 14.1_
  
  - [x] 9.4 Implement chapter endpoints
    - GET /api/fanfics/:id/chapters
    - GET /api/chapters/:id
    - POST /api/fanfics/:id/chapters
    - PUT /api/chapters/:id
    - DELETE /api/chapters/:id
    - PUT /api/fanfics/:id/chapters/reorder
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [x] 9.5 Implement interactive mode endpoints
    - GET /api/fanfics/:id/questions
    - POST /api/fanfics/:id/questions
    - PUT /api/questions/:id
    - DELETE /api/questions/:id
    - GET /api/fanfics/:id/answers
    - POST /api/fanfics/:id/answers
    - PUT /api/fanfics/:id/answers
    - GET /api/fanfics/:id/pending-questions
    - _Requirements: 4.1, 4.2, 4.4, 7.2, 8.2, 9.4_
  
  - [x] 9.6 Implement comment endpoints
    - GET /api/fanfics/:id/comments
    - GET /api/chapters/:id/comments
    - POST /api/fanfics/:id/comments
    - POST /api/chapters/:id/comments
    - DELETE /api/comments/:id
    - _Requirements: 13.1, 13.2, 13.4_
  
  - [x] 9.7 Write property test for input validation
    - **Property 28: Input validation rejects invalid data**
    - **Validates: Requirements 10.3**
  
  - [x] 9.8 Write property test for error responses
    - **Property 29: Error responses include status codes**
    - **Validates: Requirements 10.4**
  
  - [x] 9.9 Write property test for authentication middleware
    - **Property 30: Protected endpoints require authentication**
    - **Validates: Requirements 10.5**

- [x] 10. Checkpoint - Ensure backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 11. Implement frontend structure
  - [x] 11.1 Create HTML structure and CSS framework
    - Setup base HTML templates
    - Create CSS with color palette (pastel + intense tones)
    - Implement responsive grid system
    - _Requirements: 11.1, 11.2_
  
  - [x] 11.2 Create API client module
    - Implement fetch wrapper with error handling
    - Add authentication token management
    - Create API methods for all endpoints
    - _Requirements: 10.1_

- [x] 12. Implement homepage
  - [x] 12.1 Create homepage component
    - Fetch and display fanfics by category
    - Implement fanfic card with cover
    - Add hover effect for synopsis
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 12.2 Write unit tests for homepage
    - Test fanfic grouping by category
    - Test card rendering with cover
    - Test date ordering within categories

- [x] 13. Implement fanfic detail page
  - [x] 13.1 Create fanfic detail component
    - Display cover, synopsis, disclaimer
    - List chapters with titles and numbers
    - Show interactive mode options if available
    - _Requirements: 6.2, 6.3, 6.4, 2.7_
  
  - [x] 13.2 Write unit tests for detail page
    - Test all elements are displayed
    - Test interactive mode option visibility
    - Test chapter list ordering

- [x] 14. Implement interactive questions modal
  - [x] 14.1 Create questions modal component
    - Display all questions
    - Validate all answers are provided
    - Submit answers to backend
    - _Requirements: 7.1, 7.2_
  
  - [x] 14.2 Write unit tests for questions modal
    - Test validation with missing answers
    - Test answer submission
    - Test pre-filled answers for editing

- [x] 15. Implement chapter reader
  - [x] 15.1 Create chapter reader component
    - Fetch chapter content
    - Substitute placeholders in interactive mode
    - Display original text in non-interactive mode
    - Add navigation between chapters
    - _Requirements: 7.3, 7.5, 8.3_
  
  - [x] 15.2 Implement pending questions notification
    - Check for pending questions before reading
    - Display notification with options
    - _Requirements: 7.4, 9.2, 9.3_
  
  - [x] 15.3 Write unit tests for chapter reader
    - Test placeholder substitution
    - Test non-interactive mode
    - Test pending questions notification

- [x] 16. Implement authentication UI
  - [x] 16.1 Create login and registration forms
    - Build registration form with validation
    - Build login form
    - Handle authentication errors
    - Store JWT token
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 16.2 Write unit tests for auth forms
    - Test form validation
    - Test error display
    - Test successful login flow

- [x] 17. Implement author dashboard
  - [x] 17.1 Create dashboard layout
    - Display author's fanfics
    - Create tabs for editing, chapters, questions, comments
    - _Requirements: 14.1, 14.2_
  
  - [x] 17.2 Implement fanfic editor
    - Form for editing title, synopsis, cover, disclaimer, category
    - Cover upload with preview
    - _Requirements: 14.3, 14.5_
  
  - [x] 17.3 Implement chapter manager
    - List chapters with edit/delete options
    - Add new chapter form
    - Reorder chapters interface
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [x] 17.4 Implement questions manager
    - List questions with edit/delete options
    - Add new question form
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 17.5 Implement comments viewer
    - Display comments grouped by chapter
    - Add delete option for comments
    - _Requirements: 13.5, 13.6, 14.4_
  
  - [x] 17.6 Write unit tests for dashboard
    - Test fanfic filtering by author
    - Test metadata updates
    - Test comment grouping

- [x] 18. Implement comment UI
  - [x] 18.1 Create comment components
    - Comment list with chronological ordering
    - Comment form for submission
    - Delete button with authorization
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 18.2 Write unit tests for comments
    - Test comment submission
    - Test chronological ordering
    - Test delete authorization

- [x] 19. Implement answer management UI
  - [x] 19.1 Create answer editor
    - Display current answers
    - Allow editing individual answers
    - Save updates immediately
    - _Requirements: 8.1, 8.2_
  
  - [x] 19.2 Write unit tests for answer editor
    - Test answer display
    - Test answer updates
    - Test immediate persistence

- [x] 20. Add visual polish and interactions
  - [x] 20.1 Implement transitions and animations
    - Add smooth transitions between pages
    - Implement hover effects
    - Add loading states
    - _Requirements: 11.4, 11.5_
  
  - [x] 20.2 Implement responsive design
    - Test on mobile viewports
    - Adjust layouts for tablets
    - Ensure touch-friendly interactions
    - _Requirements: 11.1_

- [x] 21. Final checkpoint - Integration testing
  - Test complete user flows end-to-end
  - Verify all property tests pass
  - Ensure all unit tests pass
  - Ask the user if questions arise.

## Notes

- All tasks are now required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend implementation in Go with RESTful API
- Frontend uses modern web technologies with pastel + intense color palette
