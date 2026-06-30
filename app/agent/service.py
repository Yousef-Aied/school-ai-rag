from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq_json
from pathlib import Path

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

    vs = get_vectorstore()

    context = retrieve_context(
        vs,
        query="math study plan for weak student",
        k=5
    )
    
    # prompt
    prompt = f"""
    You are an AI study planner.

    Study material:
    {context}

    Student:
    - Level: {student_data.get("level")}
    - Score: {student_data.get("score")}

    Task:
    Create a structured 5-day study plan.

    Rules:
    - Return ONLY valid JSON
    - No explanation
    - No text outside JSON

    Format:
    {{
    "plan": [
        {{
        "day": "Day 1",
        "topics": ["topic1", "topic2"],
        "tasks": ["task1", "task2"]
        }}
    ]
    }}
    """

    response = ask_groq_json(prompt, context="")

    import json
    try:
        return json.loads(response)
    except Exception as e:
        print("PLAN ERROR:", e)
        return {
            "plan": [
                {
                    "day": "Day 1",
                    "topics": ["Retry"],
                    "tasks": ["Failed to generate plan"]
                }
            ]
        }