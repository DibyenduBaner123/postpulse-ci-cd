-- ====================================================================
-- PostPulse Schema Definition (Flyway Migration V1)
-- Engine: PostgreSQL 16
-- ====================================================================

-- 1. Users & Roles
CREATE TABLE roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL REFERENCES roles(id),
    department VARCHAR(100) DEFAULT 'General',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Teams & Team Memberships
CREATE TABLE teams (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_user UNIQUE (team_id, user_id)
);

-- 3. Social Platforms & Connected Accounts (Encrypted Credentials)
CREATE TABLE social_platforms (
    id VARCHAR(32) PRIMARY KEY, -- 'twitter', 'instagram', 'facebook', 'linkedin', 'youtube'
    name VARCHAR(50) NOT NULL,
    color VARCHAR(16) NOT NULL,
    character_limit INT NOT NULL,
    max_media_count INT NOT NULL,
    media_required BOOLEAN DEFAULT FALSE,
    max_hashtags INT DEFAULT 30,
    supports_links BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE connected_accounts (
    id VARCHAR(64) PRIMARY KEY,
    platform_id VARCHAR(32) NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    handle VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    encrypted_credential_blob TEXT NOT NULL, -- AES-256-GCM cipher
    auth_status VARCHAR(32) DEFAULT 'CONNECTED',
    followers_count INT DEFAULT 0,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conn_accounts_platform ON connected_accounts(platform_id);

-- 4. Posts & Scheduled Posts
CREATE TABLE posts (
    id VARCHAR(64) PRIMARY KEY,
    content TEXT NOT NULL,
    status VARCHAR(32) NOT NULL, -- DRAFT, SCHEDULED, PUBLISHED, FAILED, CANCELLED
    author_id VARCHAR(64) NOT NULL REFERENCES users(id),
    author_name VARCHAR(100) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    published_time TIMESTAMP WITH TIME ZONE,
    publish_result_json JSONB,
    analytics_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_time ON posts(scheduled_time);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Post to Platform junction table
CREATE TABLE post_platforms (
    post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    platform_id VARCHAR(32) NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, platform_id)
);

-- 5. Drafts
CREATE TABLE drafts (
    id VARCHAR(64) PRIMARY KEY,
    content TEXT,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drafts_author ON drafts(author_id);
CREATE INDEX idx_drafts_updated_at ON drafts(updated_at DESC);

CREATE TABLE draft_platforms (
    draft_id VARCHAR(64) NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    platform_id VARCHAR(32) NOT NULL REFERENCES social_platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (draft_id, platform_id)
);

-- 6. Media Assets
CREATE TABLE media_assets (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) REFERENCES posts(id) ON DELETE CASCADE,
    draft_id VARCHAR(64) REFERENCES drafts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(16) NOT NULL, -- image, video, gif
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Refresh Tokens
CREATE TABLE refresh_tokens (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 8. Audit Logs (Immutable Security Forensic Trail)
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT,
    correlation_id VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45) NOT NULL
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- 9. Notifications
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
