-- Add HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS "articles_embedding_idx" ON "articles" 
USING hnsw (embedding vector_cosine_ops);
