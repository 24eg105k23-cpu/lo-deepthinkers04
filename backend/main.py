from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import papers, chat, rag
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers.router)
app.include_router(chat.router)
app.include_router(rag.router)
from routers import workspaces
app.include_router(workspaces.router)

@app.get("/")
def read_root():
    print("DEBUG: Root endpoint accessed", flush=True)
    return {"message": "Welcome to the API"}
