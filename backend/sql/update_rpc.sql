-- Drop the old function to be safe (optional but good if signature changes confusingly)
drop function if exists match_rag_chunks;

-- Re-create the function with filter_workspace_id
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
