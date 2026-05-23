import joblib
import requests
import pandas as pd
from pathlib import Path
from app.llm.groq_client import ask_groq
from app.llm.groq_client import ask_groq_json

# drive
# rf_regressor.pkl = https://drive.google.com/file/d/1EqNp1gTeWRX8LPyq7MJ7m-tP4rhh8i0w/view?usp=sharing
# rf_classifier.pkl = https://drive.google.com/file/d/1_GCQYjE7VN6VFBfpcli91L_b_Nc7k907/view?usp=sharing

# huggingface
# rf_regressor.pkl ="https://huggingface.co/YousefAlshaer/school-ai-models/resolve/main/rf_regressor.pkl"
# rf_classifier.pkl = "https://huggingface.co/YousefAlshaer/school-ai-models/resolve/main/rf_classifier.pkl"
# -----------------------------------
# GLOBALS r = requests.get(url, stream=True, timeout=60)
# -----------------------------------
reg_model = None
cls_model = None

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"



# -----------------------------------
# DOWNLOAD
# -----------------------------------
def download_file(url, path):

    if path.exists() and path.stat().st_size > 1000000:
        print(f"{path.name} already exists")
        return

    print(f"Downloading {path.name}...")

    r = requests.get(url, stream=True, timeout=60)

    if r.status_code != 200:
        raise Exception(f"Download failed: {r.status_code}")

    with open(path, "wb") as f:
        for chunk in r.iter_content(8192):
            f.write(chunk)

    print(f"Downloaded: {path.stat().st_size} bytes")


# -----------------------------------
# LOAD MODELS (FIXED)
# -----------------------------------
def load_models():
    global reg_model, cls_model

    if reg_model is not None and cls_model is not None:
        return

    print("Loading models...")

    MODEL_DIR.mkdir(exist_ok=True)

    reg_path = MODEL_DIR / "rf_regressor.pkl"
    cls_path = MODEL_DIR / "rf_classifier.pkl"

    if not reg_path.exists():
        download_file("https://huggingface.co/YousefAlshaer/school-ai-models/resolve/main/rf_regressor.pkl", reg_path)

    if not cls_path.exists():
        download_file("https://huggingface.co/YousefAlshaer/school-ai-models/resolve/main/rf_classifier.pkl", cls_path)

    reg_model = joblib.load(reg_path)
    cls_model = joblib.load(cls_path)

    print("Models loaded once")

# -----------------------------------
# PREPROCESS
# -----------------------------------
def preprocess_input(data: dict):
    if reg_model is None or cls_model is None:
        raise Exception("Models not loaded")

    df = pd.DataFrame([data])

    df = pd.get_dummies(df)

    df_reg = df.reindex(columns=reg_model.feature_names_in_, fill_value=0)
    df_cls = df.reindex(columns=cls_model.feature_names_in_, fill_value=0)

    return df_reg, df_cls


# -----------------------------------
# PREDICT
# -----------------------------------
def predict(data: dict):
    load_models()
    if reg_model is None or cls_model is None:
        return {"error": "Models not loaded"}

    df_reg, df_cls = preprocess_input(data)

    score = reg_model.predict(df_reg)[0]
    level_raw = cls_model.predict(df_cls)[0]

    label_map = {0: "Weak", 1: "Medium", 2: "Strong"}

    level = label_map.get(int(level_raw), "Unknown")

    return {"predicted_score": round(float(score), 2), "level": level}


# -----------------------------------
# INSIGHTS
# -----------------------------------

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

        insights = [{"title": "AI Insight", "text": "Failed to parse insights"}]

    return insights


# -----------------------------------
# EXPLAIN
# -----------------------------------
def explain_prediction(data: dict):
    load_models()
    if reg_model is None or cls_model is None:
        return {"error": "Models not loaded"}

    df_reg, df_cls = preprocess_input(data)

    score = reg_model.predict(df_reg)[0]
    level_raw = cls_model.predict(df_cls)[0]

    label_map = {0: "Weak", 1: "Medium", 2: "Strong"}

    level = label_map.get(int(level_raw), "Unknown")

    # if/else => LLM
    insights = generate_insights_with_llm(data, score, level)

    return {
        "predicted_score": round(float(score), 2),
        "level": level,
        "insights": insights,
    }
