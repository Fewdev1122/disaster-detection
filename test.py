from supabase import create_client
from dotenv import load_dotenv
import os

# โหลด env
load_dotenv()

# อ่านค่าจาก env
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print("URL:", url)   # debug
print("KEY:", key[:10])  # debug

supabase = create_client(url, key)

response = supabase.table("rescue_units").select("*").execute()

print(response.data)