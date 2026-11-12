-- =====================================================================
-- Migration 002: structured project / achievement metadata for posts
-- Safe to run on an existing FusionV database. Existing posts keep their
-- content and type; every new column is nullable.
--
--   psql -U postgres -d fusionv -f database/migrations/002_structured_posts.sql
--
-- If you run the backend with DDL_AUTO=update (local development),
-- Hibernate creates these columns/tables automatically and this file is
-- not required. With DDL_AUTO=validate, apply this migration first.
-- =====================================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS title           VARCHAR(150);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repo_url        VARCHAR(300);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS project_url     VARCHAR(300);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization    VARCHAR(150);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_url VARCHAR(300);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date      DATE;

CREATE TABLE IF NOT EXISTS post_technologies (
    post_id     BIGINT      NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    technology  VARCHAR(50) NOT NULL,
    PRIMARY KEY (post_id, technology)
);
