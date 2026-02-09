import logging
from typing import List, Dict, Any
from utils.supabase_client import supabase
import math

logger = logging.getLogger(__name__)

class SupabaseVectorStore:
    def __init__(self):
        self.client = supabase

    def add_document(self, user_id: str, workspace_id: str, filename: str, file_url: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]],
                     title: str = None, authors: List[str] = None, abstract: str = None, date: str = None, source: str = None, link: str = None):
        """
        Store document metadata and chunks with embeddings in Supabase.
        Uses a transaction-like approach (though Supabase HTTP API isn't strictly transactional).
        """
        try:
            print(f"DEBUG [add_document]: Starting for user {user_id}, workspace {workspace_id}, {len(chunks)} chunks")
            # 1. Insert Document Metadata
            doc_data = {
                "user_id": user_id,
                "workspace_id": workspace_id,
                "filename": filename,
                "file_url": file_url,
                "title": title or filename,
                "authors": authors,
                "abstract": abstract,
                "date": date,
                "source": source,
                "link": link,
                "metadata": {"chunk_count": len(chunks)}
            }
            
            # Use 'rag_files' table
            doc_res = self.client.table("rag_files").insert(doc_data).execute()
            
            if not doc_res.data:
                raise Exception("Failed to insert document")
                
            file_id = doc_res.data[0]["id"]
            print(f"DEBUG [add_document]: File created with ID: {file_id}")
            logger.info(f"File created: {file_id}")

            # 2. Prepare Chunks for Insertion
            chunk_rows = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_rows.append({
                    "file_id": file_id,
                    "chunk_index": i,
                    "chunk_text": chunk["text"],
                    "embedding": embedding,
                    "metadata": {"type": chunk.get("type", "body")}
                })

            # 3. Insert Chunks (Batching if necessary)
            # Use 'rag_chunks' table
            batch_size = 50
            for i in range(0, len(chunk_rows), batch_size):
                batch = chunk_rows[i:i + batch_size]
                result = self.client.table("rag_chunks").insert(batch).execute()
                print(f"DEBUG [add_document]: Inserted batch {i//batch_size + 1}, {len(batch)} chunks")
                
            print(f"DEBUG [add_document]: SUCCESS! Inserted total {len(chunk_rows)} chunks for file {file_id}")
            logger.info(f"Inserted {len(chunk_rows)} chunks for file {file_id}")
            return file_id

        except Exception as e:
            logger.error(f"Vector store error: {str(e)}")
            raise e

    def similarity_search(self, user_id: str, query_embedding: List[float], top_k: int = 5, match_threshold: float = 0.5, workspace_id: str = None) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using pgvector match_rag_chunks function.
        """
        try:
            print(f"DEBUG [similarity_search]: Searching for user={user_id}, workspace={workspace_id}, threshold={match_threshold}")
            params = {
                "query_embedding": query_embedding,
                "match_threshold": match_threshold,
                "match_count": top_k,
                "filter_user_id": user_id,
                "filter_workspace_id": workspace_id # Added workspace filtering
            }
            print(f"DEBUG [similarity_search]: RPC params prepared")
            # RPC call to match_rag_chunks
            response = self.client.rpc("match_rag_chunks", params).execute()
            print(f"DEBUG [similarity_search]: RPC returned {len(response.data)} chunks")
            if response.data:
                print(f"DEBUG [similarity_search]: First chunk similarity: {response.data[0].get('similarity', 'N/A')}")
            return response.data
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return []
