# Frontend Tests

## Overview

This directory contains unit tests for the frontend components of the Interactive Fanfic Platform.

## Running Tests

Since the frontend uses vanilla JavaScript without a build system, tests are implemented as HTML files that can be run directly in a browser.

### Fanfic Detail Page Tests

To run the fanfic detail page tests:

1. Open `fanfic-detail.test.html` in a web browser
2. The tests will run automatically and display results
3. Green checkmarks (✓) indicate passing tests
4. Red X marks (✗) indicate failing tests

### Questions Modal Tests

To run the questions modal tests:

1. Open `questions-modal.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover validation, answer submission, and pre-filled answers

### Chapter Reader Tests

To run the chapter reader tests:

1. Open `chapter-reader.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover placeholder substitution, non-interactive mode, and pending questions notification

### Authentication Forms Tests

To run the authentication forms tests:

1. Open `auth-forms.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover form validation, error display, and successful login flow

### Dashboard Tests

To run the dashboard tests:

1. Open `dashboard.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover fanfic filtering, metadata updates, and comment grouping

### Header Structure Tests

To run the header structure tests:

1. Open `header-structure.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover header element presence, correct ordering, accessibility attributes, and semantic HTML

### Auth Area Component Tests

To run the auth area component tests:

1. Open `auth-area.test.html` in a web browser
2. The tests will run automatically and display results
3. Tests cover authentication state display, login/register buttons, user avatar, and dropdown menu toggle

For visual testing of the auth area component:

1. Open `auth-area-visual.html` in a web browser
2. Use the control buttons to simulate login/logout
3. Verify the auth area updates correctly based on authentication state

### Test Coverage

**fanfic-detail.test.html** covers:
- Display of all fanfic elements (cover, title, synopsis, category, disclaimer)
- Interactive mode option visibility based on questions availability
- Chapter list ordering and display
- Data integrity validation

**questions-modal.test.html** covers:
- Display of all questions in the modal
- Validation with missing answers
- Answer submission with all fields filled
- Pre-filled answers for editing
- Edge cases (empty questions, special characters, long answers)

**chapter-reader.test.html** covers:
- Placeholder substitution in interactive mode
- Non-interactive mode displaying original text
- Pending questions notification display and actions
- Chapter navigation (previous/next buttons)
- Mode indicator badges
- Edge cases (empty content, special characters, various placeholder formats)

**auth-forms.test.html** covers:
- Email validation (valid and invalid formats)
- Password validation (minimum length requirements)
- Username validation (minimum length requirements)
- Field-level error display and clearing
- Form-level error messages
- Successful login flow
- Successful registration flow
- Edge cases (whitespace trimming, special characters, long inputs)

**dashboard.test.html** covers:
- Fanfic filtering by author ID
- Metadata updates (title, category, synopsis, disclaimer)
- Comment grouping by chapter
- Chapter management (create, update, delete)
- Question management (create, update, delete, placeholder validation)
- Fanfic deletion
- Comment deletion
- Edge cases (empty lists, long titles, special characters)

**header-structure.test.html** covers:
- Presence of all main header elements (logo, search bar, categories button, notification bell, auth area)
- Correct ordering of header elements (Requirements 1.1, 1.2, 1.3, 1.4)
- Accessibility attributes (aria-label, aria-expanded, alt text)
- Semantic HTML usage (header, anchor, input, button tags)
- Auth area structure for both authenticated and non-authenticated states

**auth-area.test.html** covers:
- Display of login/register buttons when not authenticated (Requirements 1.5, 3.1)
- Display of user avatar when authenticated (Requirements 1.6, 3.4)
- User dropdown menu toggle behavior (Requirement 3.5)
- Auth state consistency (exactly one state visible at a time)
- Default avatar generation for users without custom avatars
- Dropdown menu profile options (Meu Perfil, Minhas Fanfics, Configurações, Sair)

## Test Structure

Tests use a simple custom test framework with the following structure:

```javascript
runner.describe('Test Suite Name', () => {
    runner.it('should do something', async () => {
        // Test code
        expect(actual).toBe(expected);
    });
});
```

## Assertions

Available assertion methods:
- `expect(value).toBe(expected)` - Strict equality
- `expect(value).toEqual(expected)` - Deep equality
- `expect(value).toBeTruthy()` - Truthy check
- `expect(value).toBeFalsy()` - Falsy check
- `expect(value).toContain(substring)` - String contains
- `expect(value).toBeGreaterThan(number)` - Numeric comparison
- `expect(value).toHaveLength(expected)` - Array/string length check

## Future Improvements

For a production application, consider:
- Setting up Jest or Vitest for automated testing
- Adding integration tests with a test server
- Implementing E2E tests with Playwright or Cypress
- Adding code coverage reporting
