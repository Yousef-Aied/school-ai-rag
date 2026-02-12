import joblib
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # project root
MODEL_PATH = ROOT / "app" / "behavior" / "models" / "student_cluster_model.pkl"
SCALER_PATH = ROOT / "app" / "behavior" / "models" / "student_scaler.pkl"

FEATURES = [
    "StudyHours","Attendance","Resources","Extracurricular","Motivation","Internet",
    "Age","OnlineCourses","Discussions","AssignmentCompletion","ExamScore","EduTech",
    "StressLevel","FinalGrade"
]

_model = None
_scaler = None

CLUSTER_LABELS = {
    0: "Cluster 0",
    1: "Cluster 1",
    2: "Cluster 2",
    3: "Cluster 3",
}

def load_assets():
    global _model, _scaler
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    if _scaler is None:
        _scaler = joblib.load(SCALER_PATH)
    return _model, _scaler


def predict_cluster(payload: dict) -> tuple[int, str]:
    model, scaler = load_assets()

    # نضمن نفس الأعمدة ونفس الترتيب
    df = pd.DataFrame([payload]).reindex(columns=FEATURES)

    # تحويل آمن للأرقام (لو في string رقمية تتحول، لو كلمة يطلع error واضح)
    df = df.apply(pd.to_numeric, errors="raise").astype(float)

    # Scaling
    X = scaler.transform(df)

    # Prediction
    cluster = int(model.predict(X)[0])

    # Label
    label = CLUSTER_LABELS.get(cluster, f"Cluster {cluster}")

    return cluster, label

#1
# import joblib
# import pandas as pd
# from pathlib import Path

# ROOT = Path(__file__).resolve().parents[2]  # project root
# MODEL_PATH = ROOT / "app" / "behavior" / "models" / "student_cluster_model.pkl"
# SCALER_PATH = ROOT / "app" / "behavior" / "models" / "student_scaler.pkl"

# FEATURES = [
#     "StudyHours","Attendance","Resources","Extracurricular","Motivation","Internet",
#     "Age","OnlineCourses","Discussions","AssignmentCompletion","ExamScore","EduTech",
#     "StressLevel","FinalGrade"
# ]

# _model = None
# _scaler = None

# CLUSTER_LABELS = {
#     0: "Cluster 0",
#     1: "Cluster 1",
#     2: "Cluster 2",
#     3: "Cluster 3",
# }

# def load_assets():
#     global _model, _scaler
#     if _model is None or _scaler is None:
#         _model = joblib.load(MODEL_PATH)
#         _scaler = joblib.load(SCALER_PATH)
#     return _model, _scaler

# def predict_cluster(payload: dict) -> tuple[int, str]:
#     model, scaler = load_assets()
#     df = pd.DataFrame([payload])[FEATURES]
#     X = scaler.transform(df)
#     cluster = int(model.predict(X)[0])
#     label = CLUSTER_LABELS.get(cluster, f"Cluster {cluster}")
#     return cluster, label




#2
# import joblib
# import pandas as pd
# from pathlib import Path
# from typing import Optional, Any, Dict

# BASE_DIR = Path(__file__).resolve().parent
# MODELS_DIR = BASE_DIR / "models"

# MODEL_PATH = MODELS_DIR / "student_cluster_model.pkl"
# SCALER_PATH = MODELS_DIR / "student_scaler.pkl"

# FEATURES = [
#     "StudyHours","Attendance","Resources","Extracurricular","Motivation","Internet",
#     "Age","OnlineCourses","Discussions","AssignmentCompletion","ExamScore",
#     "EduTech","StressLevel","FinalGrade"
# ]

# model: Optional[Any] = None
# scaler: Optional[Any] = None


# def load_behavior_artifacts() -> None:
#     global model, scaler
#     if model is None:
#         model = joblib.load(MODEL_PATH)
#     if scaler is None:
#         scaler = joblib.load(SCALER_PATH)


# def predict_cluster(payload: dict) -> Dict[str, Any]:
#     load_behavior_artifacts()

#     # تأكيد إنهم اتحمّلوا فعلاً (عشان runtime safety + يرضى Pylance)
#     assert scaler is not None, "Scaler failed to load"
#     assert model is not None, "Model failed to load"

#     df = pd.DataFrame([payload]).reindex(columns=FEATURES)
#     df = df.apply(pd.to_numeric, errors="raise").astype(float)

#     scaled = scaler.transform(df)
#     cluster = int(model.predict(scaled)[0])

#     LABELS = {0: "Needs support", 1: "Average", 2: "High performer"}
#     label = LABELS.get(cluster, "Unknown")

#     return {"cluster": cluster, "label": label}

