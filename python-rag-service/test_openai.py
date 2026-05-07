import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

try:
    response = client.embeddings.create(
        input="This is a test to verify the API key and connectivity.",
        model="text-embedding-3-small"
    )
    print("API Key is working! Embedding generated successfully.")
    print(f"Dimension: {len(response.data[0].embedding)}")
except Exception as e:
    print(f"ERROR: API Key or Connectivity issue: {e}")
