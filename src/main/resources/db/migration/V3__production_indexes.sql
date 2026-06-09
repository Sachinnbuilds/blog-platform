-- Full-text search index on posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(title, '') || ' ' ||
            coalesce(summary, '') || ' ' ||
            coalesce(content, '')
        )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search_vector
    ON posts USING gin(search_vector);

-- Index for trending feed (sorted by likes, comment_count, view_count)
CREATE INDEX IF NOT EXISTS idx_posts_trending
    ON posts(status, likes DESC, comment_count DESC, view_count DESC)
    WHERE status = 'PUBLISHED';

-- Index for tag-based feed
CREATE INDEX IF NOT EXISTS idx_posts_status_author
    ON posts(status, user_id, created_at DESC);

-- Index for slug lookups (already unique but add a plain index for fast reads)
CREATE INDEX IF NOT EXISTS idx_posts_slug
    ON posts(slug);

-- Index for tag name lookups (case-insensitive searches)
CREATE INDEX IF NOT EXISTS idx_tags_name_lower
    ON tags(lower(name));
