"""
RAG Utility
In-memory embeddings + retrieval + Groq LLM
"""
import os
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq


class InMemoryRAG:
    """
    Simple in-memory RAG with sentence-transformers + Groq
    """
    
    def __init__(self):
        self.embedder = None
        self.llm = None
        self.chunks = []
        self.embeddings = None
    
    def _ensure_initialized(self):
        """Lazy load models on first use"""
        if self.embedder is None:
            print("Loading embedding model...")
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        if self.llm is None:
            groq_api_key = os.environ.get("GROQ_API_KEY")
            if not groq_api_key:
                raise ValueError("GROQ_API_KEY not set in environment")
            self.llm = ChatGroq(
                temperature=0,
                model_name="llama-3.3-70b-versatile",
                groq_api_key=groq_api_key
            )
    
    def index_chunks(self, chunks: List[dict]):
        """
        Embed and store chunks
        
        Args:
            chunks: List of chunk dicts with 'text' and metadata
        """
        self._ensure_initialized()
        
        self.chunks = chunks
        
        # Generate embeddings
        texts = [chunk["text"] for chunk in chunks]
        self.embeddings = self.embedder.encode(texts, convert_to_numpy=True)
    
    def retrieve(self, query: str, top_k: int = 5) -> List[dict]:
        """
        Retrieve top-k most similar chunks
        
        Args:
            query: User question
            top_k: Number of chunks to retrieve
        
        Returns:
            Top-k chunks with similarity scores
        """
        self._ensure_initialized()
        
        if not self.chunks or self.embeddings is None:
            return []
        
        # Smart query boosting - nudge toward contribution/abstract content
        retrieval_query = (
            "Main contribution, key idea, novelty, and core method of the paper. "
            f"Question: {query}"
        )
        
        # Embed boosted query
        query_embedding = self.embedder.encode(retrieval_query, convert_to_numpy=True)
        
        # Compute cosine similarity
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                **self.chunks[idx],
                "similarity": float(similarities[idx])
            })
        
        return results
    
    def ensure_abstract(self, retrieved_chunks: List[dict]) -> List[dict]:
        """
        Ensure abstract is always included
        
        Args:
            retrieved_chunks: Retrieved chunks
        
        Returns:
            Chunks with abstract guaranteed
        """
        # Check if abstract already in results
        has_abstract = any(c.get("type") == "abstract" for c in retrieved_chunks)
        
        if not has_abstract:
            # Find abstract in all chunks
            abstract_chunk = next(
                (c for c in self.chunks if c.get("type") == "abstract"),
                None
            )
            
            if abstract_chunk:
                # Inject abstract at beginning
                return [abstract_chunk] + retrieved_chunks
        
        return retrieved_chunks
    
    def answer_question(self, question: str) -> dict:
        """
        Answer question using RAG
        
        Args:
            question: User question
        
        Returns:
            Dict with answer and sources
        """
        # Retrieve relevant chunks
        retrieved = self.retrieve(question, top_k=4)
        
        # DEBUG: Show what was retrieved
        print(f"\n=== RETRIEVED {len(retrieved)} CHUNKS ===")
        for i, chunk in enumerate(retrieved, 1):
            print(f"\nChunk {i} (type={chunk.get('type')}, similarity={chunk.get('similarity', 0):.3f}):")
            print(chunk['text'][:300] + "..." if len(chunk['text']) > 300 else chunk['text'])
        
        # Ensure abstract is included
        retrieved = self.ensure_abstract(retrieved)
        print(f"\n=== AFTER ABSTRACT INJECTION: {len(retrieved)} CHUNKS ===")
        
        if not retrieved:
            return {
                "answer": "I don't have access to the paper content yet.",
                "sources": []
            }
        
        # Build context with ABSTRACT FIRST (most important)
        context_parts = []
        
        # Find and prioritize abstract
        abstract_chunk = next((c for c in retrieved if c.get("type") == "abstract"), None)
        
        if abstract_chunk:
            context_parts.append(f"=== ABSTRACT (MOST IMPORTANT) ===\n{abstract_chunk['text']}\n")
        
        # Add other chunks
        for i, chunk in enumerate(retrieved, 1):
            if chunk.get("type") != "abstract":  # Don't duplicate abstract
                chunk_type = chunk.get("type", "body")
                context_parts.append(f"[Section {i} - {chunk_type}]:\n{chunk['text']}\n")
        
        context = "\n".join(context_parts)
        
        # Construct prompt
        system_prompt = (
            "You are a research paper assistant. "
            "Answer ONLY using the provided paper content below. "
            "If the information is not in the provided content, say you don't know. "
            "Do NOT hallucinate or make up information."
        )
        
        user_prompt = f"""Paper Content:
{context}

Question: {question}

Answer based ONLY on the content above:"""
        
        # Call LLM
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = self.llm.invoke(messages)
        
        return {
            "answer": response.content,
            "sources": [chunk["text"][:200] + "..." for chunk in retrieved[:3]]
        }
