import os
import time
import logging
import traceback
from google import genai
from dotenv import load_dotenv

# Setup logger
logger = logging.getLogger(__name__)

def generate_response(system_prompt: str, user_prompt: str):
    """
    Generate response using Gemini 2.5 Flash with retry logic
    """
    try:
        load_dotenv()
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables")
            
        c = genai.Client(api_key=api_key)
        
        combined_prompt = f"{system_prompt}\n\nUser Question: {user_prompt}"
        
        # Retry with exponential backoff for rate limits
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Using the model name requested by user
                response = c.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=combined_prompt,
                )
                logger.debug(f"Response received: {response.text[:100]}...")
                return response.text
            except Exception as e:
                error_str = str(e)
                # Check for rate limit errors (429 or ResourceExhausted)
                is_rate_limit = "429" in error_str or "ResourceExhausted" in error_str
                
                if is_rate_limit and attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 1s, 2s, 4s
                    logger.warning(f"Rate limit hit ({attempt+1}/{max_retries}). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                raise e
                
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        logger.error(traceback.format_exc())
        return "I encountered an error while processing your request. Please try again later."
