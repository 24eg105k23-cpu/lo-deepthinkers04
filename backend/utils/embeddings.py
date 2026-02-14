from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Initialize model lazily to prevent startup timeouts
class LazyEmbedder:
    def __init__(self):
        self._model = None

    @property
    def model(self):
        if self._model is None:
            logger.info("Loading embedding model...")
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Embedding model loaded.")
        return self._model

    def encode(self, *args, **kwargs):
        return self.model.encode(*args, **kwargs)

embedder = LazyEmbedder()
