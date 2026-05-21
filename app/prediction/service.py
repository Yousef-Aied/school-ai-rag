import joblib
import pandas as pd
from pathlib import Path
from app.llm.groq_client import ask_groq
from app.llm.groq_client import ask_groq_json


reg_model = None
cls_model = None

def load_models():
    global reg_model, cls_model

    if reg_model is not None and cls_model is not None:
        return

    try:
        print("Loading models...")

        BASE_DIR = Path(__file__).resolve().parent.parent
        MODEL_DIR = BASE_DIR / "models"

        reg_model = joblib.load(MODEL_DIR / "rf_regressor.pkl")
        cls_model = joblib.load(MODEL_DIR / "rf_classifier.pkl")

        print("Models loaded")

    except Exception as e:
        print("Failed loading models:", e)
        reg_model = None
        cls_model = None
        
        
        
def preprocess_input(data: dict):
    if reg_model is None or cls_model is None:
        raise Exception("Models not loaded")

    df = pd.DataFrame([data])

    df = pd.get_dummies(df)

    df_reg = df.reindex(columns=reg_model.feature_names_in_, fill_value=0)
    df_cls = df.reindex(columns=cls_model.feature_names_in_, fill_value=0)

    return df_reg, df_cls

# prediction function
def predict(data: dict):
    load_models()

    if reg_model is None or cls_model is None:
        return {"error": "Models not loaded"}

    df_reg, df_cls = preprocess_input(data)

    score = reg_model.predict(df_reg)[0]
    level_raw = cls_model.predict(df_cls)[0]

    label_map = {
        0: "Weak",
        1: "Medium",
        2: "Strong"
    }

    level = label_map.get(int(level_raw), "Unknown")

    return {
        "predicted_score": round(float(score), 2),
        "level": level
    }
    
    

# If level is Weak:
# - Focus on basic improvements

# If level is Medium:
# - Focus on consistency and improvement

# If level is Strong:
# - Suggest advanced strategies and challenges
def generate_insights_with_llm(data: dict, score: float, level: str):
    prompt = f"""
    You are a smart educational AI assistant.

    Student profile:
    - Age: {data['age']}
    - Study hours: {data['study_hours']}
    - Attendance: {data['attendance_percentage']}
    - Study method: {data['study_method']}
    - Internet access: {data['internet_access']}

    Prediction:
    - Score: {round(score,2)}
    - Level: {level}

    Task:
    Generate 3 personalized insights.

    Rules:
    - Keep each insight SHORT (1–2 sentences)
    - Make it actionable (give advice, not just description)
    - Speak directly to the student (use "you")
    - Avoid generic phrases like "the student"

    Return ONLY valid JSON list:
    [
    {{"title": "...", "text": "..."}},
    ...
    ]
    """

    response = ask_groq_json(prompt, context="")

    try:
        import json
        insights = json.loads(response)
    except Exception as e:
        print("JSON ERROR:", e)
        print("RAW RESPONSE:", response)

        insights = [
            {"title": "AI Insight", "text": "Failed to parse insights"}
        ]

    return insights



# explanation function
def explain_prediction(data: dict):
    load_models()

    if reg_model is None or cls_model is None:
        return {"error": "Models not loaded"}

    df_reg, df_cls = preprocess_input(data)

    score = reg_model.predict(df_reg)[0]
    level_raw = cls_model.predict(df_cls)[0]

    label_map = {
        0: "Weak",
        1: "Medium",
        2: "Strong"
    }

    level = label_map.get(int(level_raw), "Unknown")
    
    # if/else => LLM
    insights = generate_insights_with_llm(data, score, level)

    return {
        "predicted_score": round(float(score), 2),
        "level": level,
        "insights": insights
    }
    
    
    
