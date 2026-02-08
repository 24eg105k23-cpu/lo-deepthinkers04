import os
import groq

# Get API key from environment
api_key = os.environ.get("GROQ_API_KEY")

if not api_key:
    print("WARNING: GROQ_API_KEY not found. Summarization will not work.")
    client = None
else:
    client = groq.Groq(api_key=api_key)

MODEL_CONFIG = {
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.5,
    "max_tokens": 1024,
    "top_p": 1,
    "stop": None,
    "stream": False,
}
