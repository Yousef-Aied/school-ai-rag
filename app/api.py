# API
from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional

# RAG + LLM BASE_API
from app.rag.loader import load_pdfs
from app.rag.splitter import split_docs
from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq
from app.prediction.service import load_models

# Routers
from app.quiz.router import router as quiz_router

# Analyze Chat
from app.analyze.router import router as analyze_router
from app.analyze.service import analyze_chat
from app.analyze.store import get_profile, save_profile
from app.analyze.chat_memory import get_conversation, save_message

from app.analyze.store import get_profile

# Prediction service
from app.prediction.router import router as prediction_router

import requests


# -----------------------------
# STYLE BUILDER (clean)
# -----------------------------
def build_style_hint(profile: dict | None, student_name: str | None = None) -> str:
    hint = ""

    if student_name:
        hint += f"Say hello to {student_name}.\n"

    if not profile:
        return hint + "Explain step by step."

    level = profile.get("understanding_level", "medium")
    style = profile.get("learning_style", "step_by_step")
    needs_examples = profile.get("needs_examples", True)

    if level == "low":
        hint += "Explain very simply.\n"
    elif level == "high":
        hint += "Use advanced explanation.\n"
    else:
        hint += "Explain step by step.\n"

    if needs_examples:
        hint += "Give examples.\n"

    if style == "visual":
        hint += "Use analogies and simple visuals.\n"

    return hint


# -----------------------------
# APP
# -----------------------------

app = FastAPI(title="School AI RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://school-ai-rag-production.up.railway.app",
        "https://school-ai-frontend.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

vectorstore = None


def build_index_if_needed():
    try:
        VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

        # If there is an existing index
        if any(VECTORSTORE_DIR.iterdir()):
            return build_or_load_vectorstore(
                chunks=None, persist_dir=str(VECTORSTORE_DIR)
            )

        # If there are no PDFs → don't build
        if not PDF_DIR.exists() or not any(PDF_DIR.iterdir()):
            print("No PDFs found → skipping RAG")
            return None

        docs = load_pdfs(str(PDF_DIR))
        chunks = split_docs(docs)

        return build_or_load_vectorstore(
            chunks=chunks, persist_dir=str(VECTORSTORE_DIR)
        )

    except Exception as e:
        print("RAG build failed:", e)
        return None


@app.get("/")
def root():
    return {"status": "NEW VERSION WORKING"}


# @app.on_event("startup")
# def on_startup():
#     global vectorstore
#     vectorstore = build_index_if_needed()


# @app.on_event("startup")
# def startup():
#     global vectorstore

#     try:
#         vectorstore = build_index_if_needed()
#     except Exception as e:
#         print("Vectorstore init failed:", e)
#         vectorstore = None

#     # Download the model once
#     load_models()


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

    student_level: Optional[str] = "Medium"
    predicted_score: Optional[float] = 70


class ChatResponse(BaseModel):
    answer: str


# Weak → Simple explanation
# Medium → Step-by-step
# Strong → Advanced + deeper
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    global vectorstore

    if vectorstore is None:
        print("Building vectorstore lazily...")
        vectorstore = build_index_if_needed()

    if vectorstore:
        context = retrieve_context(
            vectorstore, query=req.message, k=4, grade=req.grade, subject=req.subject
        )
    else:
        context = ""

    # 1 get previous history
    history = get_conversation(req.conversation_id)

    # 2 add current message
    current_msg = {"role": "user", "content": req.message}
    messages = history + [current_msg]

    # 3. save message
    save_message(req.conversation_id, current_msg)

    # 1 analyze current message
    analysis = analyze_chat(messages)

    # 2 save profile
    if req.student_id:
        save_profile(
            req.student_id,
            {
                "student_id": req.student_id,
                "conversation_id": req.conversation_id,
                **analysis,
            },
        )

    # 3 load profile
    profile = get_profile(req.student_id) if req.student_id else None
    print("PROFILE:", profile)

    # student_level = req.student_level or "Medium"

    level_map = {"low": "Weak", "medium": "Medium", "high": "Strong"}

    valid_levels = {"low", "medium", "high"}

    understanding = None
    if profile:
        profile_level = profile.get("understanding_level")
        if isinstance(profile_level, str):
            profile_level = profile_level.lower()
        if profile_level in valid_levels:
            understanding = profile_level

    request_level = None
    if req.student_level:
        request_level = str(req.student_level).strip().lower()
        if request_level not in valid_levels:
            request_level = None

    student_level_key = understanding or request_level or "medium"
    student_level = level_map.get(student_level_key, "Medium")

    student_score = req.predicted_score or 70
    base_style = build_style_hint(profile, req.student_name)

    agent_style = f"""
    Student Level: {student_level}
    Score: {student_score}

    Rules:
    - Weak → explain very simply + examples
    - Medium → explain step by step
    - Strong → deeper explanation + challenges
    """

    style_hint = f"""
    Student Profile:
    - Understanding: {profile.get("understanding_level") if profile else "medium"}
    - Learning Style: {profile.get("learning_style") if profile else "step_by_step"}
    - Needs Examples: {profile.get("needs_examples") if profile else True}
    - Engagement: {profile.get("engagement") if profile else "medium"}

    Instructions:
    {base_style}

    {agent_style}
    """

    answer = ask_groq(req.message, context, style_hint=style_hint)

    return {"answer": answer}


# -----------------------------
# BUILD RAG MANUALLY (for testing)
# -----------------------------
@app.post("/api/build-rag")
def build_rag(force: bool = False):
    global vectorstore

    if vectorstore is not None and not force:
        return {"status": "Already built"}

    try:
        print("Building vectorstore manually...")

        vectorstore = build_index_if_needed()

        if vectorstore is None:
            return {"status": "No PDFs found or build failed"}

        return {"status": "RAG built successfully"}

    except Exception as e:
        print("Build failed:", e)
        return {"status": "error", "message": str(e)}


# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(quiz_router)
app.include_router(analyze_router)
app.include_router(prediction_router)
