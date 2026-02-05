# Interactive Fanfic Platform

A plataforma de fanfics interativas permite aos usuários publicar e ler histórias de fãs com um recurso único de personalização através de perguntas interativas.

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
└── frontend/         # Web frontend
    ├── css/          # Stylesheets
    ├── js/           # JavaScript files
    └── *.html        # HTML pages
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

The frontend is a static web application that can be served using any web server.

### Development

You can use a simple HTTP server to serve the frontend:

```bash
cd frontend
python -m http.server 3000
```

Or use any other static file server of your choice.

The frontend will be available at `http://localhost:3000`.

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

### Interactive Mode
- `GET /api/fanfics/:id/questions` - List questions
- `POST /api/fanfics/:id/questions` - Create question (authenticated)
- `GET /api/fanfics/:id/answers` - Get user answers (authenticated)
- `POST /api/fanfics/:id/answers` - Save answers (authenticated)

### Comments
- `GET /api/fanfics/:id/comments` - Get fanfic comments
- `POST /api/fanfics/:id/comments` - Create comment (authenticated)
- `DELETE /api/comments/:id` - Delete comment (authenticated)

## Development

This project is being developed incrementally following the task list in `.kiro/specs/interactive-fanfic-platform/tasks.md`.

## License

MIT
