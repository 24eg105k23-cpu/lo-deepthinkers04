"""
Test script to validate RAG pipeline
"""
from utils.pdf_loader import load_paper
from utils.chunker import prepare_chunks
from utils.rag import InMemoryRAG

# Test with a real arXiv paper
test_url = "https://arxiv.org/pdf/1706.03762.pdf"  # Attention is All You Need

print("🔄 Loading paper...")
full_text, abstract = load_paper(test_url)

print(f"\n✅ Extracted {len(full_text)} characters")
print(f"✅ Abstract found: {abstract is not None}")

if abstract:
    print(f"\n📄 Abstract (first 200 chars):\n{abstract[:200]}...")

print("\n🔄 Chunking text...")
chunks = prepare_chunks(full_text, abstract)
print(f"✅ Created {len(chunks)} chunks")
print(f"✅ Abstract chunk: {chunks[0]['type'] if chunks else 'None'}")

print("\n🔄 Initializing RAG...")
rag = InMemoryRAG()
rag.index_chunks(chunks)

print("\n🔄 Testing query...")
result = rag.answer_question("What is the main contribution of this paper?")

print("\n✅ ANSWER:")
print(result["answer"])

print("\n📚 SOURCES (top 3):")
for i, source in enumerate(result["sources"][:3], 1):
    print(f"\n{i}. {source}")
