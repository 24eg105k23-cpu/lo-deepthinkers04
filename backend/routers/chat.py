from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user, User

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/process-paper/{paper_id}")
async def process_paper(paper_id: str, user: User = Depends(get_current_user)):
    """
    Endpoint to 'process' a paper. 
    Currently, papers are processed immediately upon addition (embedding).
    This endpoint serves as a confirmation or hook for future extended processing (e.g. detailed summary).
    """
    # Verify paper exists if needed, or just return success
    return {"message": "Paper processed successfully", "paper_id": paper_id}
