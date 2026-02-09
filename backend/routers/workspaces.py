from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Any
from dependencies import get_current_user, User
from utils.supabase_client import supabase
from utils.pdf_loader import load_paper
from utils.chunker import prepare_chunks
from utils.embeddings import embedder
from utils.vector_store import SupabaseVectorStore
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])
vector_store = SupabaseVectorStore()

class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class PaperPayload(BaseModel):
    id: str
    title: str
    authors: List[str]
    abstract: str
    date: str
    source: str
    link: str
    # Other optional fields...


class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: str
    user_id: str
    created_at: str
    # paper_count: int = 0  # Optional, can add logic later

@router.get("/")
def get_workspaces(user: User = Depends(get_current_user)):
    """
    List all workspaces for the current user.
    """
    try:
        response = supabase.table("workspaces").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_workspace(workspace: WorkspaceCreate, user: User = Depends(get_current_user)):
    """
    Create a new workspace.
    """
    try:
        data = {
            "user_id": user.id,
            "name": workspace.name,
            "description": workspace.description
        }
        res = supabase.table("workspaces").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create workspace")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workspace_id}")
def get_workspace_details(workspace_id: str, user: User = Depends(get_current_user)):
    """
    Get details of a specific workspace.
    """
    try:
        res = supabase.table("workspaces").select("*").eq("id", workspace_id).eq("user_id", user.id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workspace_id}/papers")
def get_workspace_papers(workspace_id: str, user: User = Depends(get_current_user)):
    """
    Get papers associated with a workspace.
    Fetching from 'rag_files' table as that's where we store them.
    """
    try:
        # Check workspace access first
        res = supabase.table("workspaces").select("id").eq("id", workspace_id).eq("user_id", user.id).execute()
        if not res.data:
             raise HTTPException(status_code=404, detail="Workspace not found")

        # Fetch papers
        papers_res = supabase.table("rag_files").select("*").eq("workspace_id", workspace_id).order("created_at", desc=True).execute()
        return papers_res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workspace_id}/papers")
async def add_paper_to_workspace(
    workspace_id: str, 
    paper: PaperPayload, 
    user: User = Depends(get_current_user)
):
    """
    Add a paper from search results (arXiv URL expected).
    Downloads PDF, extracts text, embeds, and stores in RAG system.
    """
    try:
        print(f"DEBUG [add_paper]: Starting for workspace {workspace_id}, paper: {paper.title}")
        # 1. Validate Workspace Access
        ws_res = supabase.table("workspaces").select("id").eq("id", workspace_id).eq("user_id", user.id).execute()
        if not ws_res.data:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # 2. Get PDF URL
        # Convert /abs/ to /pdf/ if needed
        pdf_url = paper.link
        if "arxiv.org/abs/" in pdf_url:
            pdf_url = pdf_url.replace("/abs/", "/pdf/")
        
        if not pdf_url.endswith(".pdf"):
            pdf_url += ".pdf"
        
        # Ensure https
        pdf_url = pdf_url.replace("http://", "https://")
        
        print(f"DEBUG [add_paper]: Downloading from {pdf_url}")
        logger.info(f"Downloading paper from: {pdf_url}")
        
        # 3. Load & Chunk
        # load_paper handles download and extraction
        full_text, abstract = load_paper(pdf_url)
        print(f"DEBUG [add_paper]: Extracted {len(full_text)} chars, abstract: {len(abstract) if abstract else 0} chars")
        
        if not full_text:
             raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

        chunks = prepare_chunks(full_text, abstract)
        print(f"DEBUG [add_paper]: Created {len(chunks)} chunks")
        
        # 4. Embed
        texts = [c["text"] for c in chunks]
        embeddings = embedder.encode(texts).tolist()
        print(f"DEBUG [add_paper]: Generated {len(embeddings)} embeddings")
        
        # 5. Store in Vector Store (rag_files)
        # We reuse the paper details provided or from extraction
        filename = paper.title or "Untitled Paper"
        
        print(f"DEBUG [add_paper]: Calling vector_store.add_document...")
        doc_id = vector_store.add_document(
            user_id=user.id,
            workspace_id=workspace_id,
            filename=filename,
            file_url=pdf_url,
            chunks=chunks,
            embeddings=embeddings,
            title=paper.title,
            authors=paper.authors,
            abstract=paper.abstract,
            date=paper.date,
            source=paper.source,
            link=paper.link
        )
        print( f"DEBUG [add_paper]: SUCCESS! Document ID: {doc_id}")
        
        return {"id": doc_id, "message": "Paper added successfully"}

    except Exception as e:
        logger.error(f"Error adding paper: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add paper: {str(e)}")


@router.delete("/{workspace_id}/papers/{paper_id}")
def delete_paper(workspace_id: str, paper_id: str, user: User = Depends(get_current_user)):
    """
    Delete a paper from the workspace.
    """
    try:
        # Verify ownership/access via RLS or explicit check
        # We delete from rag_files. rag_chunks should cascade.
        # Check if exists and belongs to user
        
        res = supabase.table("rag_files").delete().eq("id", paper_id).eq("workspace_id", workspace_id).eq("user_id", user.id).execute()
        
        # res.data might be empty if delete failed/not found?
        # Supabase delete returns deleted rows if authorized.
        
        if not res.data:
             # Maybe not found or not owned
             # Try checking if it exists?
             pass
             
        return {"message": "Paper deleted"}
        
    except Exception as e:
         logger.error(f"Error deleting paper: {e}")
         raise HTTPException(status_code=500, detail=str(e))

