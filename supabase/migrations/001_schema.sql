-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search

-- Collections table
CREATE TABLE collections (
    id TEXT PRIMARY KEY, -- kebab-case name
    manifest JSONB NOT NULL,
    ipfs_hash TEXT NOT NULL,
    author_address TEXT NOT NULL,
    version TEXT NOT NULL,
    doc_count INTEGER NOT NULL DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+$'),
    CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 5)
);

-- Index for browsing
CREATE INDEX idx_collections_quality ON collections(quality_score DESC, rating_count DESC);
CREATE INDEX idx_collections_author ON collections(author_address);
CREATE INDEX idx_collections_updated ON collections(updated_at DESC);

-- Full-text search on manifest
CREATE INDEX idx_collections_manifest_search ON collections USING GIN (manifest);

-- Collection versions history
CREATE TABLE collection_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    ipfs_hash TEXT NOT NULL,
    manifest JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, version)
);

CREATE INDEX idx_versions_collection ON collection_versions(collection_id);

-- Docs metadata (extracted from frontmatter)
CREATE TABLE docs (
    id TEXT PRIMARY KEY, -- collectionId/filename
    collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT,
    category TEXT,
    tags TEXT[],
    content_hash TEXT, -- Hash of content for integrity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, filename)
);

CREATE INDEX idx_docs_collection ON docs(collection_id);
CREATE INDEX idx_docs_category ON docs(category);
CREATE INDEX idx_docs_tags ON docs USING GIN(tags);

-- Full-text search on docs
ALTER TABLE docs ADD COLUMN search_vector TSVECTOR;

CREATE INDEX idx_docs_search ON docs USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_doc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_doc_search
    BEFORE INSERT OR UPDATE ON docs
    FOR EACH ROW EXECUTE FUNCTION update_doc_search_vector();

-- Ratings/Attestations (Phase 1 - off-chain, Phase 2 - synced from chain)
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
    rater_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT, -- Optional text review
    tx_hash TEXT, -- On-chain tx hash (Phase 2)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, rater_address)
);

CREATE INDEX idx_ratings_collection ON ratings(collection_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_address);

-- Function to update collection quality score
CREATE OR REPLACE FUNCTION update_collection_quality_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE collections
    SET 
        quality_score = (SELECT AVG(rating)::DECIMAL(3,2) FROM ratings WHERE collection_id = NEW.collection_id),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE collection_id = NEW.collection_id)
    WHERE id = NEW.collection_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quality_score
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_collection_quality_score();

-- Categories reference table
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    doc_count INTEGER DEFAULT 0,
    collection_count INTEGER DEFAULT 0
);

-- Insert default categories
INSERT INTO categories (id, name, description) VALUES
    ('security', 'Security', 'Security patterns and best practices'),
    ('patterns', 'Patterns', 'Design patterns and architectural guides'),
    ('api', 'API Documentation', 'API references and integration guides'),
    ('framework', 'Frameworks', 'Framework-specific documentation'),
    ('debugging', 'Debugging', 'Debugging solutions and troubleshooting');

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_docs_updated_at BEFORE UPDATE ON docs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all
CREATE POLICY "Allow read access to collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow read access to docs" ON docs FOR SELECT USING (true);
CREATE POLICY "Allow read access to ratings" ON ratings FOR SELECT USING (true);

-- Only service role can write (workers/backend)
CREATE POLICY "Service role can write collections" ON collections 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can write docs" ON docs 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can write ratings" ON ratings 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
