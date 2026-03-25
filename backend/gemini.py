# pip install -q -U google-genai
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

try:
    response = client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents="Explain how AI works in a few words"
    )
    print("Response from Gemini:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
