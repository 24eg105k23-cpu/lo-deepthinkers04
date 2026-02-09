"""
PDF Loader Utility
Downloads and extracts clean text from arXiv PDFs
"""
import re
import requests
import tempfile
from pathlib import Path
from pypdf import PdfReader
from io import BytesIO


def download_pdf(arxiv_url: str) -> Path:
    """
    Download PDF from arXiv URL
    
    Args:
        arxiv_url: URL like https://arxiv.org/pdf/2103.14030.pdf
    
    Returns:
        Path to downloaded PDF
    """
    response = requests.get(arxiv_url, timeout=30)
    response.raise_for_status()
    
    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.write(response.content)
    temp_file.close()
    
    return Path(temp_file.name)


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract all text from PDF
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        Extracted text
    """
    reader = PdfReader(pdf_path)
    
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    
    return "\n\n".join(text_parts)


def extract_abstract(full_text: str) -> str | None:
    """
    Extract abstract from paper text
    
    Args:
        full_text: Full paper text
    
    Returns:
        Abstract text or None if not found
    """
    # Common abstract patterns
    patterns = [
        r"Abstract\s*[:\-]?\s*\n(.+?)(?:\n\n|\nIntroduction|\n1\s+Introduction)",
        r"ABSTRACT\s*[:\-]?\s*\n(.+?)(?:\n\n|\nINTRODUCTION|\n1\s+INTRODUCTION)",
        r"\\begin{abstract}(.+?)\\end{abstract}",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, full_text, re.DOTALL | re.IGNORECASE)
        if match:
            abstract = match.group(1).strip()
            # Clean up LaTeX artifacts
            abstract = re.sub(r'\\[a-zA-Z]+{([^}]*)}', r'\1', abstract)
            abstract = re.sub(r'\\[a-zA-Z]+\s*', '', abstract)
            return abstract
    
    return None


def load_paper(arxiv_url: str) -> tuple[str, str | None]:
    """
    Download PDF and extract text + abstract
    
    Args:
        arxiv_url: arXiv PDF URL
    
    Returns:
        Tuple of (full_text, abstract)
    """
    pdf_path = download_pdf(arxiv_url)
    
    try:
        full_text = extract_text_from_pdf(pdf_path)
        abstract = extract_abstract(full_text)
        return full_text, abstract
    finally:
        # Clean up temp file
        pdf_path.unlink(missing_ok=True)


def load_paper_from_bytes(content: bytes) -> tuple[str, str | None]:
    """
    Load paper from bytes (e.g. uploaded file)
    """
    reader = PdfReader(BytesIO(content))
    
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    
    full_text = "\n\n".join(text_parts)
    abstract = extract_abstract(full_text)
    
    return full_text, abstract
