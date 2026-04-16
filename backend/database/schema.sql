-- PostgreSQL Database Schema for Interactive Fanfic Platform
-- This file is for reference; migrations are handled by GORM AutoMigrate

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Fanfics table
CREATE TABLE IF NOT EXISTS fanfics (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    synopsis TEXT NOT NULL,
    disclaimer TEXT,
    category VARCHAR(100) NOT NULL,
    cover_url VARCHAR(500),
    interactive_mode BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT TRUE,
    is_adult_content BOOLEAN DEFAULT FALSE,
    trigger_warnings TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fanfics_author_id ON fanfics(author_id);
CREATE INDEX idx_fanfics_category ON fanfics(category);
CREATE INDEX idx_fanfics_created_at ON fanfics(created_at);
CREATE INDEX idx_fanfics_is_draft ON fanfics(is_draft);
CREATE INDEX idx_fanfics_published_at ON fanfics(published_at);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    is_draft BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chapters_fanfic_id ON chapters(fanfic_id);
CREATE INDEX idx_chapters_order ON chapters("order");

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    placeholder VARCHAR(255) NOT NULL,
    variable_type VARCHAR(50) NOT NULL DEFAULT 'custom',
    standard_key VARCHAR(100),
    default_answer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_fanfic_id ON questions(fanfic_id);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    placeholder VARCHAR(255) NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_user_fanfic ON answers(user_id, fanfic_id);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_fanfic_id ON comments(fanfic_id);
CREATE INDEX idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Pending Questions table
CREATE TABLE IF NOT EXISTS pending_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_questions_user_fanfic_question ON pending_questions(user_id, fanfic_id, question_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fandom', 'warning', 'pairing')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_name ON tags(name);

-- Fanfic Tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS fanfic_tags (
    id SERIAL PRIMARY KEY,
    fanfic_id INTEGER NOT NULL REFERENCES fanfics(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fanfic_id, tag_id)
);

CREATE INDEX idx_fanfic_tags_fanfic ON fanfic_tags(fanfic_id);
CREATE INDEX idx_fanfic_tags_tag ON fanfic_tags(tag_id);
