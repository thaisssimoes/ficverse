# Ficverse — Interactive Fanfic Platform

A fanfic publishing platform with a personalization layer: authors can mark spots in the story where the reader is asked a question (their own name, a friend's name, a favorite color), and the platform substitutes those answers into the text as the reader goes through the chapters.

> **Working title.** `ficverse` is a placeholder repo name — the product brand is still being chosen. The original codename is "Lollipopfics".

## Project Structure

```
.
├── backend/           # Go backend with RESTful API
│   ├── config/       # Configuration management
│   ├── database/     # Database connection and migrations
│   ├── models/       # Data models
│   ├── routes/       # HTTP routes
│   └── main.go       # Application entry point
│
└── react/            # React + Vite frontend
    └── src/
```

## Backend Setup

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14 or higher

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials and JWT secret.

5. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE fanfic_platform;
   ```

6. Run the application (migrations will run automatically):
   ```bash
   go run main.go
   ```

The backend will start on `http://localhost:8080`.

## Frontend Setup

The frontend is a React + Vite app.

```bash
cd react
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Database Schema

The application uses the following tables:

- **users**: User accounts
- **fanfics**: Published fanfics
- **chapters**: Fanfic chapters
- **questions**: Interactive questions
- **answers**: User answers to questions
- **comments**: Comments on fanfics and chapters
- **pending_questions**: Tracks pending questions for users

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Fanfics
- `GET /api/fanfics` - List all fanfics
- `GET /api/fanfics/:id` - Get fanfic details
- `POST /api/fanfics` - Create fanfic (authenticated)
- `PUT /api/fanfics/:id` - Update fanfic (authenticated)
- `DELETE /api/fanfics/:id` - Delete fanfic (authenticated)

### Chapters
- `GET /api/fanfics/:id/chapters` - List chapters
- `GET /api/chapters/:id` - Get chapter
- `POST /api/fanfics/:id/chapters` - Create chapter (authenticated)
- `PUT /api/chapters/:id` - Update chapter (authenticated)
- `DELETE /api/chapters/:id` - Delete chapter (authenticated)

### Personalization (interactive substitution)
- `GET /api/fanfics/:id/questions` - List the substitution questions defined by the author
- `POST /api/fanfics/:id/questions` - Create question (authenticated)
- `GET /api/fanfics/:id/answers` - Get the reader's saved answers (authenticated)
- `POST /api/fanfics/:id/answers` - Save the reader's answers (authenticated)

### Comments
- `GET /api/fanfics/:id/comments` - Get fanfic comments
- `POST /api/fanfics/:id/comments` - Create comment (authenticated)
- `DELETE /api/comments/:id` - Delete comment (authenticated)

## Development

This project is being developed incrementally following the task list in `.kiro/specs/interactive-fanfic-platform/tasks.md`.

## License

MIT
