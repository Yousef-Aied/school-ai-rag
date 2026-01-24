import time
import uuid
from fastapi import APIRouter, HTTPException
from typing import Any, Dict, List
from app.quiz.schemas import (
    GenerateQuizRequest, GenerateQuizResponse, QuizQuestionPublic,
    SubmitQuizRequest, SubmitQuizResponse, ReviewItem
)
from app.quiz.store import load_store, save_store
from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from pathlib import Path
from app.llm.groq_client import ask_groq_json

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# use the same vectorstore
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # project root
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

_vectorstore = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        if not VECTORSTORE_DIR.exists():
            raise RuntimeError("vectorstore folder not found. Build index first.")
        _vectorstore = build_or_load_vectorstore(chunks=None, persist_dir=str(VECTORSTORE_DIR))
    return _vectorstore

def generate_mcq_json(question: str, context: str, n: int) -> List[Dict[str, Any]]:
    import json

    instruction = (
        f"Create EXACTLY {n} multiple-choice questions from the context.\n"
        "Return STRICT JSON only.\n"
        "Output must be a JSON array of length exactly n.\n"
        "Each item MUST have:\n"
        '- "question_text": string\n'
        '- "choices": array of 4 strings\n'
        '- "correct_index": integer 0-3\n'
        "Do not include any other keys.\n"
    )

    def try_parse(raw: str):
        s = raw.strip()

        # remove code fences if any
        if s.startswith("```"):
            s = s.replace("```json", "").replace("```", "").strip()

        data = json.loads(s)
        if not isinstance(data, list) or len(data) != n:
            raise ValueError("JSON must be an array of length n")
        for item in data:
            if not isinstance(item, dict):
                raise ValueError("Each item must be an object")
            if "question_text" not in item or "choices" not in item or "correct_index" not in item:
                raise ValueError("Missing keys")
            if not isinstance(item["choices"], list) or len(item["choices"]) != 4:
                raise ValueError("choices must be array of 4")
            ci = int(item["correct_index"])
            if ci < 0 or ci > 3:
                raise ValueError("correct_index must be 0-3")
        return data

    # 1st attempt
    raw1 = ask_groq_json(instruction + f"\nTopic: {question}", context)
    try:
        return try_parse(raw1)
    except Exception:
        # 2nd attempt: stronger instruction
        raw2 = ask_groq_json(
            instruction
            + "\nIMPORTANT: Return ONLY JSON. Start with '[' and end with ']'. "
            "No text before or after.\n"
            + f"Topic: {question}",
            context,
        )
        try:
            return try_parse(raw2)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Quiz JSON parse failed after retry: {e}\nRaw1:\n{raw1}\n\nRaw2:\n{raw2}",
            )


@router.post("/generate", response_model=GenerateQuizResponse)
def generate_quiz(payload: GenerateQuizRequest):
    vs = get_vectorstore()

    topic = payload.topic or "the study material"
    # retrieve context from RAG: either from topic or from "last topic"
    context = retrieve_context(vs, topic, k=6)

    items = generate_mcq_json(topic, context, payload.n_questions)

    quiz_id = f"qz_{uuid.uuid4().hex[:10]}"
    store = load_store()

    # store internally with correct_index (not for the front end).
    questions_internal = []
    questions_public = []

    for i, it in enumerate(items):
        qid = f"q_{uuid.uuid4().hex[:8]}"
        q_text = str(it.get("question_text", "")).strip()
        choices = it.get("choices", [])
        correct = int(it.get("correct_index", 0))

        if not q_text or not isinstance(choices, list) or len(choices) != 4:
            raise HTTPException(status_code=500, detail="Invalid question format from LLM")

        questions_internal.append({
            "question_id": qid,
            "question_text": q_text,
            "choices": choices,
            "correct_index": correct,
        })

        questions_public.append(QuizQuestionPublic(
            question_id=qid,
            question_text=q_text,
            choices=choices
        ))

    store["quizzes"][quiz_id] = {
        "quiz_id": quiz_id,
        "student_id": payload.student_id,
        "conversation_id": payload.conversation_id,
        "created_at": int(time.time()),
        "topic": topic,
        "questions": questions_internal
    }
    save_store(store)

    return GenerateQuizResponse(
        quiz_id=quiz_id,
        student_id=payload.student_id,
        conversation_id=payload.conversation_id,
        questions=questions_public
    )

@router.post("/submit", response_model=SubmitQuizResponse)
def submit_quiz(payload: SubmitQuizRequest):
    store = load_store()
    quiz = store["quizzes"].get(payload.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if quiz["student_id"] != payload.student_id:
        raise HTTPException(status_code=403, detail="This quiz does not belong to this student")

    questions = quiz["questions"]
    qmap = {q["question_id"]: q for q in questions}

    answered = 0
    score = 0
    review: List[ReviewItem] = []

    for ans in payload.answers:
        q = qmap.get(ans.question_id)
        if not q:
            continue
        answered += 1
        is_correct = (ans.selected_index == q["correct_index"])
        if is_correct:
            score += 1
        review.append(ReviewItem(
            question_id=ans.question_id,
            is_correct=is_correct,
            correct_index=q["correct_index"]
        ))

    max_score = len(questions)
    completion_rate = (answered / max_score) if max_score else 0.0

    attempt = {
        "attempt_id": f"att_{uuid.uuid4().hex[:10]}",
        "quiz_id": payload.quiz_id,
        "student_id": payload.student_id,
        "conversation_id": quiz.get("conversation_id"),
        "score": score,
        "max_score": max_score,
        "completion_rate": completion_rate,
        "answers": [a.model_dump() for a in payload.answers],
        "created_at": int(time.time()),
    }
    store["attempts"].append(attempt)
    save_store(store)

    return SubmitQuizResponse(
        quiz_id=payload.quiz_id,
        student_id=payload.student_id,
        score=score,
        max_score=max_score,
        completion_rate=completion_rate,
        review=review
    )

@router.get("/{quiz_id}")
def get_quiz(quiz_id: str):
    store = load_store()
    quiz = store["quizzes"].get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # prepare public view (without correct answers)
    # Return only public questions without correct_index
    questions_public = [
        {
            "question_id": q["question_id"],
            "question_text": q["question_text"],
            "choices": q["choices"],
        }
        for q in quiz["questions"]
    ]
    return {
        "quiz_id": quiz_id,
        "student_id": quiz["student_id"],
        "conversation_id": quiz.get("conversation_id"),
        "questions": questions_public,
    }