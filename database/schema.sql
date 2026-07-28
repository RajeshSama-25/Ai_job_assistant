-- ==========================================
-- AI Job Assistant Database
-- PostgreSQL Schema
-- ==========================================

DROP TABLE IF EXISTS oauth_accounts CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE users (

    id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    role VARCHAR(30) DEFAULT 'user',

    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- PROFILE
-- ==========================================

CREATE TABLE profiles (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    phone VARCHAR(30),

    country VARCHAR(100),

    city VARCHAR(100),

    linkedin TEXT,

    github TEXT,

    portfolio TEXT,

    bio TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- RESUMES
-- ==========================================

CREATE TABLE resumes (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    file_name VARCHAR(255),

    file_path TEXT,

    ats_score INTEGER DEFAULT 0,

    ai_summary TEXT,

    extracted_text TEXT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- JOBS
-- ==========================================

CREATE TABLE jobs (

    id SERIAL PRIMARY KEY,

    company VARCHAR(200),

    job_title VARCHAR(200),

    location VARCHAR(200),

    work_mode VARCHAR(50),

    salary VARCHAR(100),

    description TEXT,

    apply_url TEXT,

    source VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- APPLICATIONS
-- ==========================================

CREATE TABLE applications (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,

    status VARCHAR(50) DEFAULT 'Applied',

    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    interview_date TIMESTAMP,

    notes TEXT,

    cover_letter TEXT

);

-- ==========================================
-- EMAILS
-- ==========================================

CREATE TABLE emails (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    gmail_message_id VARCHAR(100) UNIQUE,

    sender VARCHAR(255),

    subject TEXT,

    body TEXT,

    email_status VARCHAR(50),

    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- AI SETTINGS
-- ==========================================

CREATE TABLE ai_settings (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    auto_resume BOOLEAN DEFAULT TRUE,

    auto_cover_letter BOOLEAN DEFAULT TRUE,

    auto_job_match BOOLEAN DEFAULT TRUE,

    follow_up BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================
-- OAUTH ACCOUNTS
-- ==========================================

CREATE TABLE oauth_accounts (

    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    provider VARCHAR(50),

    provider_user_id VARCHAR(255),

    access_token TEXT,

    refresh_token TEXT,

    token_expiry TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, provider)

);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_jobs_title
ON jobs(job_title);

CREATE INDEX idx_jobs_company
ON jobs(company);

CREATE INDEX idx_applications_user
ON applications(user_id);

CREATE INDEX idx_resumes_user
ON resumes(user_id);

CREATE INDEX idx_emails_user
ON emails(user_id);