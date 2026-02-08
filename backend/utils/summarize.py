from utils.groq_client import client, MODEL_CONFIG

def summarize_paper(title: str, abstract: str):
    prompt = f"""
Summarize the following research paper in 5 concise bullet points.
Focus on: problem, method, key results, significance, limitations.

Title: {title}
Abstract: {abstract}
"""
    if not client:
        return "GROQ_API_KEY not set. Please add it to .env to use this feature."
        
    try:
        resp = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            **MODEL_CONFIG
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"Error generating summary: {e}")
        return "Failed to generate summary. Please check your API key and try again."
