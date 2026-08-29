import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Client | None = None

if url and key:
    try:
        supabase = create_client(url, key)
        print("Successfully connected to Supabase.")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
else:
    print("[WARNING] SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")
