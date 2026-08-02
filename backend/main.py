from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import shutil
import requests
from rag.pipeline import process_document, retrieve_context

app = FastAPI(title="AI DOC API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to AI DOC API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger RAG pipeline extraction
    try:
        process_document(file_path)
    except Exception as e:
        print(f"Error processing document: {e}")
        
    return {"filename": file.filename, "message": "File uploaded successfully"}

from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

@app.post("/chat")
def chat(request: ChatRequest):
    user_msg = request.message
    
    # RAG Retrieval
    context = retrieve_context(user_msg)
    
    if context:
        prompt = f"Based on the following document context, answer the user's question.\n\nContext:\n{context}\n\nQuestion: {user_msg}"
    else:
        prompt = user_msg

    bot_msg = None

    # 1. Try Gemini API directly with provided API Key
    try:
        print("Calling official Gemini API (gemini-2.5-flash)...")
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response and response.text:
            bot_msg = response.text
            print("Successfully received response from Gemini API!")
    except Exception as e:
        print(f"Gemini API Error: {e}, falling back to serverless endpoints...")

    # 2. Fallback Chain if Gemini API fails or reaches quota
    if not bot_msg:
        candidates = [
            {"url": "https://ultimate-ai-worker.haruyhari930.workers.dev/v1/chat/completions", "model": "openai-fast"},
            {"url": "https://ultimate-ai-worker.haruyhari930.workers.dev/v1/chat/completions", "model": "llama-4-maverick"},
            {"url": "https://curly-hill-3303.aegonat29.workers.dev/v1/chat/completions", "model": "ERNIE-Bot"}
        ]
        
        for candidate in candidates:
            url = candidate["url"]
            model = candidate["model"]
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are AI DOC, an expert document intelligence assistant. Use the provided document context to give clear, helpful answers to the user."},
                    {"role": "user", "content": prompt}
                ]
            }
            try:
                print(f"Trying fallback model: {model}...")
                response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=12)
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content")
                    if content:
                        bot_msg = content
                        print(f"Success with fallback model {model}!")
                        break
            except Exception as e:
                print(f"Fallback candidate {model} error: {e}")
                continue

    if not bot_msg:
        bot_msg = "Sorry, I couldn't generate a response. Please check your connection and try again."
        
    return {"response": bot_msg}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
