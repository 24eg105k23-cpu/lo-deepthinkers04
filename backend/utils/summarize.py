from utils.gemini_client import generate_response

def summarize_paper(title: str, abstract: str):
    system_prompt = "You are a research assistant. Summarize the research paper in 5 concise bullet points. Focus on: problem, method, key results, significance, limitations."
    
    user_prompt = f"""
Title: {title}
Abstract: {abstract}
"""
    try:
        return generate_response(system_prompt, user_prompt)
    except Exception as e:
        print(f"Error generating summary: {e}")
        return "Failed to generate summary. Please check your API key and try again."
