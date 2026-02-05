# Setup Guide - Interactive Fanfic Platform

This guide will help you set up the development environment for the Interactive Fanfic Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Go 1.21+**: [Download Go](https://golang.org/dl/)
- **PostgreSQL 14+**: [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git**: [Download Git](https://git-scm.com/downloads)

## Quick Start with Docker (Recommended)

If you have Docker installed, you can quickly start a PostgreSQL database:

```bash
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432` with:
- Database: `fanfic_platform`
- Username: `postgres`
- Password: `postgres`

## Manual Setup

### 1. Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE fanfic_platform;
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and update the database connection string if needed:
   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/fanfic_platform?sslmode=disable
   JWT_SECRET=your-secret-key-change-in-production
   PORT=8080
   ```

4. Install dependencies (already done):
   ```bash
   go mod download
   ```

5. Run the backend:
   ```bash
   go run main.go
   ```

   Or build and run:
   ```bash
   make build
   ./fanfic-platform.exe
   ```

The backend will:
- Connect to PostgreSQL
- Run database migrations automatically
- Start the API server on `http://localhost:8080`

### 3. Frontend Setup

The frontend is a static web application. You can serve it using any web server.

**Option 1: Python HTTP Server**
```bash
cd frontend
python -m http.server 3000
```

**Option 2: Node.js http-server**
```bash
cd frontend
npx http-server -p 3000
```

**Option 3: VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `frontend/index.html`
- Select "Open with Live Server"

The frontend will be available at `http://localhost:3000` (or the port you specified).

## Verify Installation

1. **Check Backend Health**:
   ```bash
   curl http://localhost:8080/health
   ```
   
   Expected response:
   ```json
   {"status":"ok"}
   ```

2. **Check Database Connection**:
   - The backend logs should show successful database connection
   - Tables should be created automatically

3. **Check Frontend**:
   - Open `http://localhost:3000` in your browser
   - You should see the homepage

## Project Structure

```
.
├── backend/              # Go backend
│   ├── config/          # Configuration
│   ├── database/        # Database connection & migrations
│   ├── models/          # Data models
│   ├── routes/          # HTTP routes
│   ├── main.go          # Entry point
│   └── .env             # Environment variables
│
├── frontend/            # Web frontend
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript
│   └── *.html          # HTML pages
│
└── docker-compose.yml   # Docker setup for PostgreSQL
```

## Development Workflow

1. **Start PostgreSQL** (if using Docker):
   ```bash
   docker-compose up -d
   ```

2. **Start Backend**:
   ```bash
   cd backend
   go run main.go
   ```

3. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   python -m http.server 3000
   ```

4. **Make Changes**:
   - Backend changes require restarting the Go server
   - Frontend changes are reflected immediately (just refresh the browser)

## Troubleshooting

### Database Connection Issues

If you see "failed to connect to database":
- Verify PostgreSQL is running
- Check the `DATABASE_URL` in `.env`
- Ensure the database `fanfic_platform` exists

### Port Already in Use

If port 8080 or 3000 is already in use:
- Change `PORT` in backend `.env`
- Use a different port for the frontend server

### Go Module Issues

If you see module-related errors:
```bash
cd backend
go mod tidy
go mod download
```

## Next Steps

Once the setup is complete, you can:
1. Review the task list in `.kiro/specs/interactive-fanfic-platform/tasks.md`
2. Start implementing features according to the tasks
3. Run tests as you develop

## Additional Resources

- [Go Documentation](https://golang.org/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [GORM Documentation](https://gorm.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
