"""
RAG Utility
In-memory embeddings + retrieval + Gemini 2.5 Flash
"""
import os
import logging
import numpy as np
from typing import List
from utils.embeddings import embedder
from utils.gemini_client import generate_response

logger = logging.getLogger(__name__)

class InMemoryRAG:
    """
    RAG with Gemini Embeddings (768 dim) + Gemini 2.5 Flash
    """
    
    def __init__(self):
        self.chunk_map = {} # id -> chunk
        self.embeddings = None
        self.ids = []
    
    def index_chunks(self, chunks: List[dict]):
        """
        Embed and store chunks in memory
        Args:
            chunks: List of chunk dicts. Must have 'id', 'text', 'metadata', 'embedding' (optional)
        """
        if not chunks:
            return

        self.chunk_map = {c['id']: c for c in chunks}
        self.ids = list(self.chunk_map.keys())
        
        # Check if embeddings are already provided (from DB) or need to be generated
        # For now, assume we receive them populated or we'd need to generate them.
        # But this in-memory RAG seems to be designed to take DB chunks which already have embeddings.
        # If 'embedding' key is missing or None, we might skip or re-embed.
        
        # Filter chunks that have embeddings
        valid_chunks = [c for c in chunks if c.get('embedding')]
        
        if valid_chunks:
            # Parse embeddings if they are strings (from DB JSON/vector)
            # Assuming DB returns list of floats or numpy array
            arrays = []
            for c in valid_chunks:
                emb = c['embedding']
                if isinstance(emb, str):
                    # handle string representation if necessary, though DB driver usually converts
                    import json
                    try:
                         emb = json.loads(emb)
                    except:
                        pass # might be raw string format "[...]"
                arrays.append(emb)
            self.embeddings = np.array(arrays)
            # Re-align ids to valid chunks
            self.ids = [c['id'] for c in valid_chunks]
        else:
             self.embeddings = None
             self.ids = []

    def retrieve(self, query: str, top_k: int = 5) -> List[dict]:
        """
        Retrieve top-k most similar chunks
        """
        if not self.ids or self.embeddings is None:
            return []
        
        if embedder is None:
            logger.error("Embedder not initialized")
            return []

        try:
            # Embed query
            # SentenceTransformer encode([text]) returns (1, D) array
            query_embedding = embedder.encode([query], convert_to_numpy=True)[0]
            
            # Compute cosine similarity
            # norm(a) * norm(b)
            # embeddings are likely already normalized by the model but let's be safe
            norm_query = np.linalg.norm(query_embedding)
            norm_embeddings = np.linalg.norm(self.embeddings, axis=1)
            
            similarities = np.dot(self.embeddings, query_embedding) / (norm_embeddings * norm_query)
            
            # Get top-k
            # argsort returns indices of *sorted* elements. [::-1] reverses to descending.
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                chunk_id = self.ids[idx]
                chunk = self.chunk_map[chunk_id]
                results.append({
                    **chunk,
                    "similarity": float(similarities[idx])
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Retrieval error: {e}")
            return []
    
    def answer_question(self, question: str) -> dict:
        """
        Answer question using RAG
        """
        # Retrieve relevant chunks
        retrieved = self.retrieve(question, top_k=5)
        
        if not retrieved:
            return {
                "answer": "I couldn't find any relevant information in the uploaded documents to answer your question.",
                "sources": []
            }
        
        # Build context
        context_parts = []
        for i, chunk in enumerate(retrieved, 1):
             text = chunk.get('chunk_text') or chunk.get('text', '')
             context_parts.append(f"[Source {i}]: {text}")
        
        context = "\n\n".join(context_parts)
        
        system_prompt = (
            "You are a helpful research assistant. Answer the user's question based ONLY on the provided context. "
            "If the answer is not in the context, say so. "
            "Cite the sources using [Source X] notation where appropriate."
        )
        
        user_prompt = f"Context:\n{context}\n\nQuestion: {question}"
        
        # Generate response
        response_text = generate_response(system_prompt, user_prompt)
        
        return {
            "answer": response_text,
            "sources": [c.get('chunk_text') or c.get('text', '') for c in retrieved[:3]]
        }
