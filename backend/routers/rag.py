from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_current_user, User
from utils.pdf_loader import load_paper_from_bytes
from utils.chunker import prepare_chunks
from utils.vector_store import SupabaseVectorStore
from utils.rag import InMemoryRAG # We will modify this class or create a new one to use VectorStore
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])
vector_store = SupabaseVectorStore()

# We need to adapt the RAG logic to use vector store
# Let's import the embedder from utils.embeddings
from utils.embeddings import embedder 
from utils.supabase_client import supabase

# DEBUG: Check chunks in database (NO AUTH for testing)
@router.get("/debug/chunks/{workspace_id}")
async def debug_chunks(workspace_id: str):
    """Debug endpoint to check if chunks exist for this workspace"""
    try:
        # Get rag_files for this workspace (ignore user_id for now)
        files_res = supabase.table("rag_files").select("id, filename, title, user_id, workspace_id").eq("workspace_id", workspace_id).execute()
        files = files_res.data
        
        # Get chunk count for each file
        result = {"workspace_id": workspace_id, "files": []}
        total_chunks = 0
        
        for f in files:
            chunks_res = supabase.table("rag_chunks").select("id").eq("file_id", f["id"]).execute()
            chunk_count = len(chunks_res.data)
            total_chunks += chunk_count
            result["files"].append({
                "file_id": f["id"],
                "filename": f.get("filename") or f.get("title"),
                "user_id": f.get("user_id"),
                "chunk_count": chunk_count
            })
        
        result["total_chunks"] = total_chunks
        result["total_files"] = len(files)
        
        # Also test direct query for chunks without embedding filter
        if files:
            sample_file_id = files[0]["id"]
            direct_chunks = supabase.table("rag_chunks").select("id, chunk_text").eq("file_id", sample_file_id).limit(2).execute()
            result["sample_chunk_texts"] = [c["chunk_text"][:100] for c in direct_chunks.data] if direct_chunks.data else []
        
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

# DEBUG: Test RPC directly
@router.get("/debug/test-rpc/{workspace_id}")
async def test_rpc(workspace_id: str):
    """Test the match_rag_chunks RPC directly"""
    try:
        # Get a sample file to find user_id
        files_res = supabase.table("rag_files").select("id, user_id").eq("workspace_id", workspace_id).limit(1).execute()
        if not files_res.data:
            return {"error": "No files found for workspace"}
        
        file_id = files_res.data[0]["id"]
        user_id = files_res.data[0]["user_id"]
        
        # Get a sample chunk to extract its embedding
        chunk_res = supabase.table("rag_chunks").select("id, embedding, chunk_text").eq("file_id", file_id).limit(1).execute()
        if not chunk_res.data:
            return {"error": "No chunks found for file"}
        
        sample_chunk = chunk_res.data[0]
        sample_embedding = sample_chunk.get("embedding")
        
        # Check embedding dimension
        if sample_embedding:
            embedding_dim = len(sample_embedding) if isinstance(sample_embedding, list) else "unknown"
        else:
            embedding_dim = "None"
        
        # Now test the RPC with this embedding (should match itself!)
        params = {
            "query_embedding": sample_embedding,
            "match_threshold": 0.0,  # Very low threshold
            "match_count": 5,
            "filter_user_id": user_id,
            "filter_workspace_id": workspace_id
        }
        
        try:
            rpc_result = supabase.rpc("match_rag_chunks", params).execute()
            rpc_data = rpc_result.data
        except Exception as rpc_err:
            return {"error": f"RPC call failed: {str(rpc_err)}", "embedding_dim": embedding_dim}
        
        return {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "file_id": file_id,
            "sample_chunk_text": sample_chunk["chunk_text"][:100],
            "embedding_dimension": embedding_dim,
            "rpc_result_count": len(rpc_data) if rpc_data else 0,
            "rpc_results": rpc_data[:2] if rpc_data else []
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

class ChatRequest(BaseModel):
    workspace_id: str
    question: str

class UploadResponse(BaseModel):
    document_id: str
    message: str

@router.post("/upload", response_model=UploadResponse)
def upload_document(
    workspace_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Upload PDF -> Extract -> Chunk -> Embed -> Store in Supabase
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = file.file.read()
        full_text, abstract = load_paper_from_bytes(content)
        
        chunks = prepare_chunks(full_text, abstract)
        
        # Generate embeddings locally
        texts = [chunk["text"] for chunk in chunks]
        embeddings = embedder.encode(texts).tolist()
        
        # Store in Supabase
        doc_id = vector_store.add_document(
            user_id=user.id,
            workspace_id=workspace_id,
            filename=file.filename,
            file_url=f"uploaded/{file.filename}", # Placeholder URL
            chunks=chunks,
            embeddings=embeddings
        )
        
        return UploadResponse(document_id=doc_id, message="Document processed and indexed")
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user)
):
    """
    Chat with documents in a workspace using RAG
    """
    try:
        print(f"DEBUG: Processing chat request for workspace {request.workspace_id}")
        
        # 1. Embed Question with Boosting (Matches utils/rag.py logic)
        retrieval_query = (
            "Main contribution, key idea, novelty, and core method of the paper. "
            f"Question: {request.question}"
        )
        query_embedding = embedder.encode(retrieval_query).tolist()
        print("DEBUG: Embedding complete")
        
        # 2. Retrieve Similar Chunks (Scoped to User)
        similar_chunks = vector_store.similarity_search(
            user_id=user.id,
            query_embedding=query_embedding,
            top_k=5,
            workspace_id=request.workspace_id,
            match_threshold=0.1  # Lowered for better vague query handling
        )
        print(f"DEBUG: Retrieved {len(similar_chunks)} chunks")
        
        if not similar_chunks:
             return {"answer": "No relevant documents found in this workspace.", "sources": []}
        
        # 3. Context Construction (Prioritize Abstract)
        # Parse metadata to find abstract
        context_parts = []
        abstract_chunk = None
        
        # Check for abstract in retrieved chunks
        for chunk in similar_chunks:
            meta = chunk.get("metadata", {})
            if meta.get("type") == "abstract":
                abstract_chunk = chunk
                break
        
        # If abstract found and prioritized
        if abstract_chunk:
            context_parts.append(f"=== ABSTRACT (MOST IMPORTANT) ===\n{abstract_chunk['chunk_text']}\n")
            
        # Add other chunks
        for i, chunk in enumerate(similar_chunks, 1):
            meta = chunk.get("metadata", {})
            if meta.get("type") != "abstract": # Avoid duplicate abstract
                chunk_type = meta.get("type", "body")
                context_parts.append(f"[Section {i} - {chunk_type}]:\n{chunk['chunk_text']}\n")

        context_text = "\n".join(context_parts)
        
        # 4. Generate Answer (Strict System Prompt)
        from utils.gemini_client import generate_response
        
        system_prompt = (
            "You are a research assistant. "
            "Answer questions using ONLY the provided paper content. "
            "You may synthesize information across sections to infer: "
            "the problem being addressed, the main contribution, and the intended application domain. "
            "If something is truly not present or cannot be reasonably inferred, "
            "say you do not know. Do not hallucinate."
        )
        
        user_prompt = f"Paper Content:\n{context_text}\n\nQuestion: {request.question}\n\nAnswer based ONLY on the content above:"
        
        response_text = generate_response(system_prompt, user_prompt)
        
        print("DEBUG: Gemini response received")
        
        return {
            "answer": response_text,
            "sources": [c['chunk_text'][:200] + "..." for c in similar_chunks[:3]]
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
