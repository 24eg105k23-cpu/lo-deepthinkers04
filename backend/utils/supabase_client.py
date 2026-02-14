import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

class LazySupabase:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_SERVICE_KEY")
            if not url or not key:
                # Log warning but don't crash startup
                print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase calls will fail.")
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")
            self._client = create_client(url, key)
        return self._client

    def __getattr__(self, name):
        return getattr(self._get_client(), name)

supabase = LazySupabase()
