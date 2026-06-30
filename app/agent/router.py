from fastapi import APIRouter
from app.agent.schemas import StudyPlanResponse
from app.agent.service import generate_study_plan
from app.rag.indexer import build_or_load_vectorstore
from app.prediction.service import predict
import requests

router = APIRouter(prefix="/api/agent", tags=["Agent"])


DOTNET_API = "https://school-ai-backend-2qd1.onrender.com"

def get_student_data(student_id):
    try:
        res = requests.get(
            f"{DOTNET_API}/api/student/dashboard",
            params={"studentId": student_id},
            timeout=10
        )

        res.raise_for_status()

        return res.json()

    except Exception as e:
        print("DOTNET ERROR:", e)
        return None

@router.get("/study-plan", response_model=StudyPlanResponse)
def study_plan(student_id: int):

    data = get_student_data(student_id)

    if not data:
        return {
            "plan": [
                {
                    "day": "Day 1",
                    "topics": ["Error"],
                    "tasks": ["Failed to load student data"]
                }
            ]
        }

    student_data = {
        "level": data["prediction"]["level"],
        "score": data["prediction"]["predictedScore"],
        "study_hours": data["metrics"]["studyHours"],
        "attendance": data["metrics"]["attendance"],
        "exam_score": data["metrics"]["examScore"]
    }

    print("FETCHING STUDENT:", student_id)
    data = get_student_data(student_id)
    print("DATA FROM DOTNET:", data)
    
    return generate_study_plan(student_id, student_data)