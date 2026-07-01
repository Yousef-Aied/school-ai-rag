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

    context = ""

    if vs:
        context = retrieve_context(
            vs,
            query=f"""
            Student Level: {student_data.get('level')}
            Predicted Score: {student_data.get('score')}
            Study Hours: {student_data.get('study_hours')}
            Attendance: {student_data.get('attendance')}

            Retrieve study strategies, learning techniques,
            revision methods, and educational recommendations
            appropriate for this student's overall performance.
            """,
            k=5
        ) or ""
    
    # prompt 
    prompt = f"""
    You are an AI study planner acting like a real teacher.

    Student Information:
    - Level: {student_data.get("level")}
    - Predicted Score: {student_data.get("score")}
    - Study Hours: {student_data.get("study_hours")}
    - Attendance: {student_data.get("attendance")}

    Your task:
    Create a 5-day study plan that feels like a real school study schedule.

    IMPORTANT STYLE RULES:
    - Do NOT give overly specific numeric tasks (like "solve 10 problems")
    - Do NOT list exact formulas or detailed subtopics
    - Instead, refer to lessons in a natural way:
    ✔ "Review lesson 1 and 2"
    ✔ "Focus on weak parts of the chapter"
    ✔ "Revise previous exercises"
    ✔ "Study the important concepts from the unit"
    - Make the plan feel realistic and human-like

    SUBJECT RULES:
    - Cover: Mathematics, Physics, Chemistry, English
    - Distribute subjects across the days
    - Each day should include 2–3 subjects (not all 4 every day)

    PERSONALIZATION:
    - Weak → more revision + repeating lessons
    - Medium → mix of revision + practice
    - Strong → deeper understanding + challenging parts

    TASK STYLE:
    - Use phrases like:
    - "Review"
    - "Revise"
    - "Focus on"
    - "Practice key exercises"
    - "Study important parts"
    - Avoid robotic instructions

    OUTPUT RULES:
    - Return ONLY valid JSON
    - No explanations
    - No markdown

    FORMAT:
    [
    {{
        "day": "Day 1",
        "topics": ["Algebra", "Newton's Laws"],
        "tasks": [
        "Review lesson 1 and 2 in Algebra",
        "Focus on understanding the main ideas in Newton's Laws"
        ]
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
    
    return {
    "plan": plan
    }


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