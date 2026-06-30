from fastapi import APIRouter
from app.agent.service import generate_study_plan
from app.rag.indexer import build_or_load_vectorstore
from app.prediction.service import predict

router = APIRouter(prefix="/api/agent", tags=["Agent"])


@router.get("/study-plan")
def study_plan(student_id: int):

    student_data = {
        "age": 15,
        "gender": "male",
        "school_type": "public",
        "study_hours": 3,
        "attendance_percentage": 80,
        "internet_access": "yes",
        "travel_time": 20,
        "extra_activities": "no",
        "study_method": "self"
    }

    prediction = predict(student_data)

    student_data["level"] = prediction["level"]
    student_data["score"] = prediction["predicted_score"]

    return generate_study_plan(student_id, student_data)