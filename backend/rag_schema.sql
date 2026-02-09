-- RAG Files Table (Uploaded PDFs)
create table if not exists rag_files (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    workspace_id uuid not null, -- Links to workspaces table
    filename text not null,
    file_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

-- RLS
alter table rag_files enable row level security;
create policy "Users can only access their own rag_files"
    on rag_files for all
    using (auth.uid() = user_id);

-- RAG Chunks Table (Vectors)
create table if not exists rag_chunks (
    id uuid primary key default gen_random_uuid(),
    file_id uuid references rag_files(id) on delete cascade not null,
    chunk_index int not null,
    chunk_text text not null,
    embedding vector(384),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Chunks
alter table rag_chunks enable row level security;
create policy "Users can access chunks of their own files"
    on rag_chunks for all
    using (
        exists (
            select 1 from rag_files
            where rag_files.id = rag_chunks.file_id
            and rag_files.user_id = auth.uid()
        )
    );

-- Index
create index on rag_chunks using hnsw (embedding vector_cosine_ops);

-- RPC Function
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
