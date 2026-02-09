from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Initialize model once
try:
    logger.info("Loading embedding model...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Embedding model loaded.")
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    raise e
