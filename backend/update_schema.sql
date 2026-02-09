-- Add metadata columns to rag_files
alter table public.rag_files 
add column if not exists title text,
add column if not exists authors text[],
add column if not exists abstract text,
add column if not exists date text,
add column if not exists source text,
add column if not exists link text;
