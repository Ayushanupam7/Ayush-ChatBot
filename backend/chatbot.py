import datetime
import os
import re
import sys
from typing import List, Dict, Optional

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure local imports work regardless of start directory
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Local imports
try:
    from dictionary import responses
    from kling_image import generate_kling_image
except ImportError:
    # Fallback for different package structures
    from .dictionary import responses
    from .kling_image import generate_kling_image

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploads folder
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 🔑 All API Keys from .env
OPENAI_API_KEY      = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY        = os.getenv("GROQ_API_KEY")

# ─────────────────────────────────────────
# ✅ Initialize all available clients
# ─────────────────────────────────────────

# 1. Groq (recommended - most free)
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq ready")
    except Exception as e:
        print(f"❌ Groq: {e}")

# 2. OpenAI
openai_client = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("✅ OpenAI ready")
    except Exception as e:
        print(f"❌ OpenAI: {e}")

# 3. Gemini (new SDK)
gemini_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini ready")
    except Exception as e:
        print(f"❌ Gemini: {e}")

# 4. OpenRouter (uses OpenAI-compatible API)
openrouter_client = None
if OPENROUTER_API_KEY:
    try:
        from openai import OpenAI
        openrouter_client = OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        print("✅ OpenRouter ready")
    except Exception as e:
        print(f"❌ OpenRouter: {e}")

# ─────────────────────────────────────────
# 📚 Dictionary responses (always checked first)
# ─────────────────────────────────────────
# (Moved to imports at top)

def get_system_prompt(mode: str) -> str:
    base = "You are a helpful, friendly chatbot created by Ayush."
    if mode == "detailed":
        return f"{base} Provide a very detailed, comprehensive, and well-explained answer."
    else:
        return f"{base} Keep answers concise, short, and to the point."

class UserInput(BaseModel):
    message: str
    mode: str = "short"  # "short" or "detailed"
    history: Optional[List[Dict[str, str]]] = []

# ─────────────────────────────────────────
# 🤖 Individual AI callers
# ─────────────────────────────────────────

def ask_groq(question: str, system_prompt: str, history: list) -> str:
    msgs = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": question}]
    result = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=msgs,
        max_tokens=1000,
    )
    return result.choices[0].message.content.strip()

def ask_openai(question: str, system_prompt: str, history: list) -> str:
    msgs = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": question}]
    result = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=msgs,
        max_tokens=1000,
    )
    return result.choices[0].message.content.strip()

def ask_gemini(question: str, system_prompt: str, history: list) -> str:
    import time
    contents = f"System: {system_prompt}\n\n"
    for msg in history:
        role = "User" if msg.get("role") == "user" else "Assistant"
        contents += f"{role}: {msg.get('content')}\n\n"
    contents += f"User: {question}"
    
    for attempt in range(2):
        try:
            result = gemini_client.models.generate_content(
                model="gemini-1.5-flash", 
                contents=contents,
            )
            return result.text.strip()
        except Exception as e:
            if "429" in str(e) and attempt == 0:
                print("DEBUG: Gemini Rate Limit hit, retrying in 2s...")
                time.sleep(2)
                continue
            raise e

def ask_openrouter(question: str, system_prompt: str, history: list) -> str:
    msgs = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": question}]
    result = openrouter_client.chat.completions.create(
        model="mistralai/mistral-7b-instruct:free",  # free model on OpenRouter
        messages=msgs,
        max_tokens=1000,
    )
    return result.choices[0].message.content.strip()

# ─────────────────────────────────────────
# 🧠 Main logic: Dictionary → AI fallback chain
# ─────────────────────────────────────────

# Priority order: Groq → OpenAI → Gemini → OpenRouter
AI_PROVIDERS = [
    ("Groq",        groq_client,        ask_groq),
    ("OpenAI",      openai_client,      ask_openai),
    ("Gemini",      gemini_client,      ask_gemini),
    ("OpenRouter",  openrouter_client,  ask_openrouter),
]

def getResponseBot(userQuestion: str, mode: str, history: list, image: str = None) -> tuple:
    userQuestionLower = userQuestion.lower().strip()

    # 1. Dictionary Matching
    dictionary_matches = []
    matched_keys = []
    sorted_keys = sorted(responses.keys(), key=len, reverse=True)
    
    # Track the portion of the string that was matched by dictionary
    remaining_question = userQuestionLower
    
    for key in sorted_keys:
        if any(key in mk for mk in matched_keys):
            continue
            
        if re.search(rf'\b{re.escape(key)}\b', remaining_question):
            dictionary_matches.append(responses[key])
            matched_keys.append(key)
            # Remove the matched keyword to see what's left for the AI
            remaining_question = re.sub(rf'\b{re.escape(key)}\b', '', remaining_question).strip()

    # Determine if we should also ask the AI
    # If the remaining question has significant content (e.g., "what is python")
    should_ask_ai = len(remaining_question.split()) >= 2 or ("what" in remaining_question or "who" in remaining_question or "how" in remaining_question)
    
    system_prompt = get_system_prompt(mode)
    ai_answer = None
    ai_provider = None

    if should_ask_ai or not dictionary_matches:
        # Try each AI provider in order
        providers_to_try = AI_PROVIDERS
        print(f"DEBUG: Input Mode: {mode}")
        if mode.lower() == "gemini":
            providers_to_try = [p for p in AI_PROVIDERS if p[0] == "Gemini"] + [p for p in AI_PROVIDERS if p[0] != "Gemini"]

        for name, client, caller in providers_to_try:
            if not client: continue
            try:
                # Ask the FULL question for better context, or just the remaining? 
                # Let's ask the full question so AI knows the context
                ai_answer = caller(userQuestion, system_prompt, history)
                if ai_answer:
                    ai_provider = name
                    print(f"DEBUG: Selected Provider: {ai_provider}")
                    break
            except Exception as e:
                print(f"DEBUG: Provider {name} failed: {e}")
                continue

    # Combine results
    if dictionary_matches and ai_answer:
        # Combine dictionary snippets first, then the AI answer
        combined = " ".join(dictionary_matches) + "\n\n" + ai_answer
        return combined, f"Hybrid ({ai_provider})"
    elif dictionary_matches:
        return " ".join(dictionary_matches), "Dictionary"
    elif ai_answer:
        return ai_answer, ai_provider
    
    return "Sorry, I couldn't find an answer for that. 😊", "System"


# ─────────────────────────────────────────
# 🎨 Image Generation Logic
# ─────────────────────────────────────────
# (Import moved to top)

class ImageInput(BaseModel):
    prompt: str

@app.post("/api/generate-image")
def generate_image(input_data: ImageInput):
    if not input_data.prompt.strip():
        return {"error": "Prompt cannot be empty! 😊"}
    
    result = generate_kling_image(input_data.prompt)
    return result

@app.post("/api/chat")
def chat(user: UserInput):
    if not user.message.strip():
        return {"response": "Please type a message! 😊", "provider": "System"}
    ans, prov = getResponseBot(user.message, user.mode, user.history)
    return {"response": ans, "provider": prov}


@app.get("/api/greet")
def greet(name: str = "User"):
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        g = "Good Morning"
    elif 12 <= hour < 17:
        g = "Good Afternoon"
    elif 17 <= hour < 21:
        g = "Good Evening"
    else:
        g = "Good Night"
    return {"response": f"{g}, {name}! 👋 How can I help you today?"}