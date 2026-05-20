# API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional

# RAG + LLM
# from app.rag.loader import load_pdfs
# from app.rag.splitter import split_docs
# from app.rag.indexer import build_or_load_vectorstore
# from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq

# Routers
from app.quiz.router import router as quiz_router
from app.analyze.router import router as analyze_router

from app.analyze.store import get_profile

# Prediction service
# from app.prediction.router import router as prediction_router

import requests


# -----------------------------
# STYLE BUILDER (clean)
# -----------------------------
def build_style_hint(profile: dict | None, student_name: str | None = None) -> str:
    hint = ""

    if student_name:
        hint += f"Say hello to {student_name}.\n"

    stress = int(profile.get("stress_level", 50)) if profile else 50
    mot = int(profile.get("motivation", 50)) if profile else 50

    if stress >= 70 or mot <= 35:
        hint += "Explain very simply.\n"
    elif mot >= 70:
        hint += "Use advanced explanation.\n"
    else:
        hint += "Explain step by step.\n"

    return hint


# -----------------------------
# APP
# -----------------------------
app = FastAPI(title="School AI RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

vectorstore = None


# def build_index_if_needed():
#     VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

#     if any(VECTORSTORE_DIR.iterdir()):
#         return build_or_load_vectorstore(chunks=None, persist_dir=str(VECTORSTORE_DIR))

#     docs = load_pdfs(str(PDF_DIR))
#     chunks = split_docs(docs)
#     return build_or_load_vectorstore(chunks=chunks, persist_dir=str(VECTORSTORE_DIR))


# @app.on_event("startup")
# def on_startup():
#     global vectorstore
#     vectorstore = build_index_if_needed()

# @app.on_event("startup")
# def on_startup():
#     global vectorstore
#     try:
#         vectorstore = build_index_if_needed()
#     except Exception as e:
#         print("Vectorstore init failed:", e)
#         vectorstore = None
        
        
# -----------------------------
# CHAT context 
# -----------------------------
class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = "auto"


class ChatResponse(BaseModel):
    answer: str


# Weak → Simple explanation 
# Medium → Step-by-step
# Strong → Advanced + deeper
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # context = retrieve_context(
    #     vectorstore, query=req.message, k=4, grade=req.grade, subject=req.subject  #Top 4 Chunks
    # )
    context = ""


    profile = get_profile(req.student_id) if req.student_id else None

    # Bringing prediction from .NET
    student_level = "Medium"
    student_score = 70

    if req.student_id:
        try:
            res = requests.get(
                f"http://127.0.0.1:7265/api/student/prediction?studentId={req.student_id}"
            )

            if res.status_code == 200:
                data = res.json()
                student_level = data.get("level", "Medium")
                student_score = data.get("predictedScore", 70)

        except Exception as e:
            print("Prediction fetch error:", e)

    # to merge style
    base_style = build_style_hint(profile, req.student_name)

    agent_style = f"""
    Student Level: {student_level}
    Score: {student_score}

    Instructions:
    - If Weak → explain very simply with examples
    - If Medium → explain step by step
    - If Strong → give deeper explanation and challenges

    Also:
    - Be friendly
    - Adapt explanation to student's level
    """

    style_hint = base_style + "\n" + agent_style

    answer = ask_groq(req.message, context, style_hint=style_hint)

    return {"answer": answer}


# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(quiz_router)
app.include_router(analyze_router)
# app.include_router(prediction_router)
