# 🤖 Ayush Chatbot - Multi-Modal AI Assistant

A powerful, full-stack chatbot featuring high-quality image generation, multiple AI model support, and a premium modern UI.

## ✨ Features
- **Multi-Model Support**: Switch between **Gemini 2.0 Flash**, **Groq**, and **OpenAI**.
- **Kling AI Image Generation**: Create high-quality images directly in the chat.
- **Quick @Mentions**: Override models on the fly (e.g., type `@gemini` or `@image`).
- **Voice Typing**: Built-in voice recognition for hands-free chatting.
- **Premium UI**: Modern dark/light mode, smooth animations, and responsive message layout.
- **Copy & Share**: Easy copy buttons for every message and bot response.

---

## 🛠️ Tech Stack
- **Frontend**: React (Context API, CSS Modules)
- **Backend**: FastAPI (Python)
- **AI Models**: 
  - Google Gemini (via `google-genai` SDK)
  - Groq (Llama 3)
  - Kling AI (Text-to-Image)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- Python (3.9+)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a **`.env`** file in the `backend/` directory:
```env
GROQ_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
KLING_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here (optional)
```

Run the server:
```bash
python -m uvicorn chatbot:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🏷️ How to Use @Mentions
You can force a specific model to respond by using its tag in your message:
- `@gemini`: Force response from the latest Gemini model.
- `@image`: Generate an image from your prompt.
- `@short`: Get a concise summary response.
- `@detailed`: Get a comprehensive, long-form answer.

---

## 📂 Project Structure
- `frontend/`: React application and custom components.
- `backend/`: FastAPI server and AI integration logic.
- `backend/uploads/`: Local storage for generated images.

---

## 📜 License
Created by **Ayush Anupam**.
