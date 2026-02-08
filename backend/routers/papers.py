import logging
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import uuid
from fastapi import APIRouter
from pydantic import BaseModel
from utils.summarize import summarize_paper

logger = logging.getLogger("uvicorn")

class SummarizePayload(BaseModel):
    title: str
    abstract: str

router = APIRouter(prefix="/papers", tags=["Papers"])

@router.post("/summarize")
async def summarize(payload: SummarizePayload):
    summary = summarize_paper(payload.title, payload.abstract)
    return {"summary": summary}

@router.get("/search")
def search_papers(query: str):
    print(f"DEBUG: Handling search request for: {query}")
    base_url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": 12,
    }
    query_string = urllib.parse.urlencode(params)
    full_url = f"{base_url}?{query_string}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        req = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req, timeout=30.0) as response:
            if response.status != 200:
                logger.error(f"Error fetching from arXiv: {response.status}")
                return {"papers": []}
            
            response_text = response.read().decode('utf-8')
            logger.info(f"arXiv response status: {response.status}")
            
    except Exception as e:
        logger.error(f"Error fetching from arXiv: {e}")
        return {"papers": []}

    try:
        root = ET.fromstring(response_text)
    except ET.ParseError as e:
        logger.error(f"XML Parse Error: {e}")
        return {"papers": []}

    ns = {"atom": "http://www.w3.org/2005/Atom"}

    papers = []

    for entry in root.findall("atom:entry", ns):
        papers.append({
            "id": str(uuid.uuid4()),
            "title": entry.find("atom:title", ns).text.strip(),
            "authors": [
                a.find("atom:name", ns).text
                for a in entry.findall("atom:author", ns)
            ],
            "abstract": entry.find("atom:summary", ns).text.strip(),
            "date": entry.find("atom:published", ns).text[:4],
            "source": "arXiv",
            "citations": None,
            "tags": [],
            "imported": False,
            "link": entry.find("atom:id", ns).text,
        })

    return {"papers": papers}
