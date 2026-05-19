import joblib
import pandas as pd
from app.llm.groq_client import ask_groq
from app.llm.groq_client import ask_groq_json


reg_model = joblib.load("app/models/rf_regressor.pkl")
cls_model = joblib.load("app/models/rf_classifier.pkl")


def preprocess_input(data: dict):
    df = pd.DataFrame([data])

    # encoding
    df = pd.get_dummies(df)

    df_reg = df.reindex(columns=reg_model.feature_names_in_, fill_value=0)
    df_cls = df.reindex(columns=cls_model.feature_names_in_, fill_value=0)

    return df_reg, df_cls

# prediction function
def predict(data: dict):
    df_reg, df_cls = preprocess_input(data)

    # prediction
    score = reg_model.predict(df_reg)[0]
    level_raw = cls_model.predict(df_cls)[0]

    # level
    label_map = {
        0: "Weak",
        1: "Medium",
        2: "Strong"
    }

    level = label_map.get(int(level_raw), "Unknown")

    print("AI SCORE:", score)
    print("AI LEVEL:", level)

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
    df_reg, df_cls = preprocess_input(data)

    # predictions
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