from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq_json
from pathlib import Path
import json
import re

_vectorstore = None 

BASE_DIR = Path(__file__).resolve().parent.parent.parent
VECTORSTORE_DIR = BASE_DIR / "vectorstore"


def get_vectorstore():
    global _vectorstore

    if _vectorstore is None:
        if not VECTORSTORE_DIR.exists():
            raise RuntimeError("vectorstore not found")

        _vectorstore = build_or_load_vectorstore(
            chunks=None,
            persist_dir=str(VECTORSTORE_DIR)
        )

    return _vectorstore

def generate_study_plan(student_id: int, student_data: dict):

    try:
        vs = get_vectorstore()
    except Exception as e:
        print("VECTORSTORE ERROR:", e)
        vs = None

    if vs:
        context = retrieve_context(
            vs,
            subject=student_data.get("subject", "math"),
            query=f"""
            {student_data.get('level')} student
            score {student_data.get('score')}
            math weaknesses study plan
            """,
            k=5
        )
    else:
        context = ""
    
    # prompt
    prompt = f"""
    You are an AI study planner.

    Study material:
    {context}

    Student:
    - Level: {student_data.get("level")}
    - Score: {student_data.get("score")}
    - Study Hours: {student_data.get("study_hours")}
    - Attendance: {student_data.get("attendance")}

    Task:
    Create a structured 5-day study plan.

    Rules:
    - Weak → basics + repetition
    - Medium → practice + understanding
    - Strong → advanced problems

    Return ONLY valid JSON.
    Do NOT include markdown.

    Format:
    [
    {{
        "day": "Day 1",
        "topics": ["Topic 1", "Topic 2"],
        "tasks": ["Task 1", "Task 2"]
    }}
    ]
    """
    response = ask_groq_json(prompt, context=context)

    plan = parse_plan(response)

    # retry
    if not plan:
        print("Retrying plan generation...")
        response2 = ask_groq_json(
            prompt + "\nIMPORTANT: Return ONLY JSON array.",
            context=context
        )
        plan = parse_plan(response2)

    # fallback
    if not plan:
        plan = [
            {
                "day": "Day 1",
                "topics": ["Retry"],
                "tasks": ["Failed to generate plan"]
            }
        ]
        
    print("STUDENT DATA:", student_data)
    print("CONTEXT:", context[:200] if context else "EMPTY")


def parse_plan(response: str):
    try:
        clean = re.sub(r"```json|```", "", response).strip()
        data = json.loads(clean)

        if not isinstance(data, list):
            raise ValueError("Plan must be a list")

        for day in data:
            if not all(k in day for k in ["day", "topics", "tasks"]):
                raise ValueError("Invalid structure")

        return data

    except Exception as e:
        print("PLAN PARSE ERROR:", e)
        print("RAW:", response)
        return None