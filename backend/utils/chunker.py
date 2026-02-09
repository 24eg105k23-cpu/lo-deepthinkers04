"""
Text Chunking Utility
Chunks text intelligently with minimal filtering
"""
import re
from typing import List


BAD_SECTIONS = [
    "references",
    "bibliography"
]


def clean_text(text: str) -> str:
    """
    Light cleaning ONLY.
    Do NOT delete content aggressively.
    """
    lines = text.splitlines()
    cleaned = []

    for line in lines:
        l = line.lower().strip()

        # Drop empty lines
        if not l:
            continue

        # Drop pure boilerplate lines ONLY
        if (
            "all rights reserved" in l
            or "this paper is submitted to" in l
        ):
            continue

        cleaned.append(line)

    return "\n".join(cleaned)


def extract_abstract(text: str) -> str | None:
    """
    Extract abstract safely with multiple patterns.
    """
    # Try multiple patterns
    patterns = [
        # Standard "Abstract" header
        r"abstract\s*(.+?)(\n\s*\n|introduction|\n1\s)",
        # LaTeX style
        r"\\begin{abstract}(.+?)\\end{abstract}",
        # All caps
        r"ABSTRACT\s*(.+?)(\n\s*\n|INTRODUCTION|\n1\s)",
        # With colon/dash
        r"abstract\s*[:\-—]\s*(.+?)(\n\s*\n|introduction|\n1\s)",
        # Numbered section
        r"abstract\s*\n(.+?)(\n\s*\n|\n1\.|introduction)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            abstract = match.group(1).strip()
            # Clean up and validate
            if len(abstract) > 50:  # Must be substantial
                return abstract[:2000]  # Cap at reasonable length
    
    return None


def remove_references(text: str) -> str:
    """
    Remove references ONLY after section header.
    """
    for sec in BAD_SECTIONS:
        pattern = rf"\n{sec}\n"
        split = re.split(pattern, text, flags=re.IGNORECASE)
        if len(split) > 1:
            return split[0]
    return text


def chunk_text(
    text: str,
    chunk_size: int = 1200,
    overlap: int = 200
) -> List[str]:
    """
    Chunk by characters, not lines.
    """
    text = remove_references(text)
    text = clean_text(text)

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()

        # KEEP chunks unless they are very small
        if len(chunk) > 200:
            chunks.append(chunk)

        start = end - overlap

    return chunks


def prepare_chunks(full_text: str, abstract: str | None = None) -> List[dict]:
    """
    Chunk text and prepare with metadata
    
    Args:
        full_text: Full paper text
        abstract: Abstract text (injected separately)
    
    Returns:
        List of chunk dicts with text and metadata
    """
    chunks = chunk_text(full_text, chunk_size=1000, overlap=175)
    
    chunk_dicts = []
    
    # Add abstract as first chunk if available
    if abstract:
        chunk_dicts.append({
            "text": abstract,
            "type": "abstract",
            "index": 0
        })
    
    # Add regular chunks
    for i, chunk in enumerate(chunks, start=1):
        chunk_dicts.append({
            "text": chunk,
            "type": "body",
            "index": i
        })
    
    return chunk_dicts
