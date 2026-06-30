from app.prediction.service import predict
from app.analyze.store import get_profile
from app.llm.groq_client import ask_groq_json
from app.rag.retriever import retrieve_context

def generate_study_plan(student_id: int, student_data: dict, vectorstore=None):

    # prediction
    prediction = predict(student_data)
    score = prediction["predicted_score"]
    level = prediction["level"]

    # profile
    profile = get_profile(student_id)

    # RAG context
    rag_context = ""
    if vectorstore:
        rag_context = retrieve_context(
            vectorstore,
            query="recommended lessons for weak student",
            k=3
        )

    # prompt
    prompt = f"""
    You are an AI Study Planner.

    Student Info:
    - Score: {score}
    - Level: {level}
    - Understanding: {profile.get("understanding_level") if profile else "medium"}

    Study Material:
    {rag_context}

    Task:
    Create a 3-day study plan.

    Rules:
    - Use the study material above when possible
    - Mention lesson names if available
    - Each day has 3 tasks
    - Include practice

    Return ONLY JSON:
    {{
      "plan": {{
        "day1": ["...", "..."],
        "day2": ["...", "..."],
        "day3": ["...", "..."]
      }}
    }}
    """

    response = ask_groq_json(prompt, context="")

    import json
    try:
        return json.loads(response)
    except:
        return {"plan": {"day1": ["Error generating plan"]}}