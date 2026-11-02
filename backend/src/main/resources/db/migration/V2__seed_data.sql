-- ====================================================================
-- PostPulse Initial Seed Data (Flyway Migration V2)
-- ====================================================================

-- 1. Insert RBAC Roles
INSERT INTO roles (id, name, description) VALUES
('ADMIN', 'Administrator', 'Full administrative authority across all modules, users, security audit logs, and Kafka replay.'),
('MANAGER', 'Campaign Manager', 'Can manage social handles, schedule content, invite operators, and review telemetry.'),
('EDITOR', 'Content Editor', 'Can write, edit, schedule, save drafts, and publish cross-platform content.'),
('VIEWER', 'Audience Viewer', 'Read-only visibility for dashboards, performance metrics, and content calendars.');

-- 2. Insert Social Platform Definitions
INSERT INTO social_platforms (id, name, color, character_limit, max_media_count, media_required, max_hashtags, supports_links) VALUES
('twitter', 'X (Twitter)', '#0f1419', 280, 4, FALSE, 5, TRUE),
('instagram', 'Instagram', '#E1306C', 2200, 10, TRUE, 30, FALSE),
('facebook', 'Facebook', '#1877F2', 63206, 10, FALSE, 15, TRUE),
('linkedin', 'LinkedIn', '#0A66C2', 3000, 9, FALSE, 10, TRUE),
('youtube', 'YouTube', '#FF0000', 5000, 5, FALSE, 15, TRUE);

-- 3. Insert Seed Users (Default password: 'Pulse123!')
-- BCrypt hash for Pulse123! is $2a$12$e8Yx2mX/3p2Wl5pX5iK5k.sXm8FwOaI2u6r5e8A9C2w3t4y5z6
INSERT INTO users (id, name, email, password_hash, role, department, avatar_url) VALUES
('usr_admin', 'Alex Rivera', 'admin@postpulse.io', '$2a$12$aM.HXnrOdhjubbylhwL2leO.qN4DuEOg3HH/jFJgaHPjzZGnQ8F7.', 'ADMIN', 'Executive Operations', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'),
('usr_manager', 'Sarah Chen', 'manager@postpulse.io', '$2a$12$aM.HXnrOdhjubbylhwL2leO.qN4DuEOg3HH/jFJgaHPjzZGnQ8F7.', 'MANAGER', 'Brand Marketing', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'),
('usr_editor', 'Marcus Vance', 'editor@postpulse.io', '$2a$12$aM.HXnrOdhjubbylhwL2leO.qN4DuEOg3HH/jFJgaHPjzZGnQ8F7.', 'EDITOR', 'Content Creation', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'),
('usr_viewer', 'Elena Rostova', 'viewer@postpulse.io', '$2a$12$aM.HXnrOdhjubbylhwL2leO.qN4DuEOg3HH/jFJgaHPjzZGnQ8F7.', 'VIEWER', 'Client Relations', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80');

-- 4. Seed Connected Accounts with encrypted credentials
INSERT INTO connected_accounts (id, platform_id, account_name, handle, avatar_url, encrypted_credential_blob, auth_status, followers_count) VALUES
('acc_x', 'twitter', 'PostPulse Official', '@postpulse_hq', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80', 'a7f391b4c810:982bfe1872a9103c8471b029:583920194819', 'CONNECTED', 48200),
('acc_ig', 'instagram', 'PostPulse App', '@postpulse.app', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=100&h=100&q=80', 'b81920ac3918:182947192837491028374910:192837491029', 'CONNECTED', 89400),
('acc_li', 'linkedin', 'PostPulse Technologies', 'company/postpulse', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=100&h=100&q=80', 'c91827461928:491827364519283746192837:384719283746', 'CONNECTED', 34100);

-- 5. Seed Initial Published Post
INSERT INTO posts (id, content, status, author_id, author_name, published_time, analytics_json) VALUES
('post_101', 'We are thrilled to unveil PostPulse 3.0! Effortless multi-channel orchestration with automated scheduling, real-time analytics, and enterprise RBAC.', 'PUBLISHED', 'usr_manager', 'Sarah Chen', CURRENT_TIMESTAMP - INTERVAL '3 days', '{"likes": 1420, "shares": 312, "comments": 89, "clicks": 2840, "impressions": 48500}');

INSERT INTO post_platforms (post_id, platform_id) VALUES
('post_101', 'twitter'),
('post_101', 'linkedin');
