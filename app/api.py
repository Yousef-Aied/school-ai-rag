# API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path

from app.rag.loader import load_pdfs
from app.rag.splitter import split_docs
from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq

from app.quiz.router import router as quiz_router

from app.behavior.router import router as behavior_router

from typing import Optional



# (Loader → Splitter → Indexer → Retriever → API)
app = FastAPI(title="School AI RAG API")

# CORS so that React can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent  # project root
PDF_DIR = BASE_DIR / "data" / "pdfs"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

vectorstore = None  # cache in memory


def build_index_if_needed():
    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    # If there are files inside vectorstore, consider it ready.
    if any(VECTORSTORE_DIR.iterdir()):
        return build_or_load_vectorstore(chunks=None, persist_dir=str(VECTORSTORE_DIR))

    docs = load_pdfs(str(PDF_DIR))
    chunks = split_docs(docs)
    return build_or_load_vectorstore(chunks=chunks, persist_dir=str(VECTORSTORE_DIR))


@app.on_event("startup")
def on_startup():
    global vectorstore
    vectorstore = build_index_if_needed()


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    grade: Optional[int] = None
    subject: Optional[str] = "auto"


class ChatResponse(BaseModel):
    answer: str


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # vectorstore is ready from startup
    context = retrieve_context(vectorstore, query=req.message, k=4, grade=req.grade, subject=req.subject)

    answer = ask_groq(req.message, context)
    return {"answer": answer}


# Quiz API is under /api/quiz
app.include_router(quiz_router)



# Behavior API is under /api/behavior
app.include_router(behavior_router)