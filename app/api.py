# API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional

# Importing RAG and LLM jobs
from app.rag.loader import load_pdfs
from app.rag.splitter import split_docs
from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq


# Importing different Routers 
# Quiz API
from app.quiz.router import router as quiz_router
# Behavior API
from app.behavior.router import router as behavior_router
from app.behavior.schemas import BehaviorInput
from app.behavior.service import predict_cluster

# Analyze API
from app.analyze.router import router as analyze_router

# Import function to retrieve student file from repository
from app.analyze.store import get_profile



# Style Builder Function
def build_style_hint(profile: dict | None, behavior_label: str | None = None, student_name: str | None = None) -> str:
    behavior_hint = ""
    if student_name:
        # Mentioning the name is mandatory at the beginning of the conversation
        behavior_hint += f"CRITICAL: You MUST start your response by saying hello to '{student_name}'.\n"
    
    is_at_risk = False
    if behavior_label:
        behavior_hint += f"Note: This student is classified as '{behavior_label}'. "
        if "Visual" in behavior_label:
            behavior_hint += "Use lists and structure.\n"
        elif "At-Risk" in behavior_label:
            is_at_risk = True # Stumbling off with K-Means
            behavior_hint += "Be very encouraging.\n"

    # Bringing emotions from the chat or setting a default value
    stress = int(profile.get("stress_level", 50)) if profile else 50
    mot = int(profile.get("motivation", 50)) if profile else 50

    psych_hint = ""
    
    # Edit here: If At-Risk or tense, simplify the explanation.
    if is_at_risk or stress >= 70 or mot <= 35:
        psych_hint = "- Explain in very simple steps. The student seems struggling.\n"
    elif mot >= 70 and stress <= 40:
        psych_hint = "- The student is motivated. Use advanced terminology and challenges.\n"
    else:
        psych_hint = "- Explain normally with step-by-step structure.\n"

    return behavior_hint + psych_hint
    
    
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
    student_id: Optional[int] = None # Analyze
    student_name: Optional[str] = None
    behavior_label: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = "auto"
    
    behavior: Optional[BehaviorInput] = None 


class ChatResponse(BaseModel):
    answer: str

# Endpoint to become adaptive
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # 1. Fetch the context from the Vector Store
    context = retrieve_context(vectorstore, query=req.message, k=4, grade=req.grade, subject=req.subject)

    # 2. Retrieve the psychological file (from JSON)
    profile = get_profile(req.student_id) if req.student_id else None
    
    # 3. Extracting the behavior_label (linking with K-Means)
    behavior_label = req.behavior_label
    
    # Fallbacks if behavior_label is not provided in the request
    if not behavior_label:
        if req.behavior:
            _, behavior_label = predict_cluster(req.behavior.model_dump())
        elif profile and profile.get("behavior_label"):
            behavior_label = profile.get("behavior_label")

    # 4. Build style hint
    style_hint = build_style_hint(profile, behavior_label, req.student_name)

    print(f"\n[DEBUG] Student ID: {req.student_id}")
    print(f"[DEBUG] Student Name: {req.student_name}")
    print(f"[DEBUG] Behavior Label: {behavior_label}")
    print(f"[DEBUG] Generated Style Hint:\n{style_hint}\n" + "="*30)
    # ---------------------------------
   
    #5. Groq question
    answer = ask_groq(req.message, context, style_hint=style_hint)
    
    return {"answer": answer}


# Quiz API is under /api/quiz
app.include_router(quiz_router)

# Behavior API is under /api/behavior
app.include_router(behavior_router)

# Analyze API is under /api/analyze
app.include_router(analyze_router)


