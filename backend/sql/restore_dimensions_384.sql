-- Restore migration to revert vector dimensions to 384 (all-MiniLM-L6-v2)
-- This is necessary because the code expects 384 dimensions.

-- 1. Drop the function first to avoid dependency issues
drop function if exists match_rag_chunks;

-- 2. Clear existing chunks (they are 768-dim and cannot be resized)
delete from rag_chunks;

-- 3. Alter the column type back to 384 dimensions
alter table rag_chunks 
alter column embedding type vector(384);

-- 4. Re-create the search index
drop index if exists rag_chunks_embedding_idx;
create index on rag_chunks using hnsw (embedding vector_cosine_ops);

-- 5. Re-create the match_rag_chunks function with 384-dim input
create or replace function match_rag_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_workspace_id uuid
)
returns table (
  id uuid,
  file_id uuid,
  chunk_text text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    rag_chunks.id,
    rag_chunks.file_id,
    rag_chunks.chunk_text,
    1 - (rag_chunks.embedding <=> query_embedding) as similarity,
    rag_chunks.metadata
  from rag_chunks
  join rag_files on rag_files.id = rag_chunks.file_id
  where 1 - (rag_chunks.embedding <=> query_embedding) > match_threshold
  and rag_files.user_id = filter_user_id
  and rag_files.workspace_id = filter_workspace_id
  order by rag_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
