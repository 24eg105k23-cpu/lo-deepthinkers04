import os
import time
import logging
import traceback

from google import genai
from dotenv import load_dotenv

# Setup logger
logger = logging.getLogger("gemini_client")
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler("gemini_debug.log")
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.addHandler(console_handler)

# Load .env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)

# Get API key
api_key = os.environ.get("GEMINI_API_KEY")

# Global client instance
client = None

def get_client():
    global client
    if client:
        return client

    if not api_key:
        logger.error("GEMINI_API_KEY not found")
        raise ValueError("GEMINI_API_KEY not found")

    client = genai.Client(api_key=api_key)
    logger.info("Initialized google-genai client")
    return client

def generate_response(system_prompt: str, user_prompt: str, temperature: float = 0.5):
    """
    Generate a response using Google Gemini API (google-genai SDK).
    """
    c = get_client()
    combined_prompt = f"{system_prompt}\n\n{user_prompt}"
    logger.debug(f"Prompt length: {len(combined_prompt)}")

    # Retry with exponential backoff for rate limits
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = c.models.generate_content(
                model="gemini-2.5-flash",
                contents=combined_prompt,
            )
            logger.debug(f"Response received: {response.text[:100]}...")
            return response.text
        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "ResourceExhausted" in error_str or "TooManyRequests" in error_str

            if is_rate_limit and attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # 5s, 10s
                logger.warning(f"Rate limited (attempt {attempt+1}/{max_retries}). Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue

            logger.error(f"Gemini generation error: {error_str}")
            logger.error(traceback.format_exc())
            raise e
