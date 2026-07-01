from fastapi import APIRouter, HTTPException
from app.agent.schemas import StudyPlanResponse
from app.agent.service import generate_study_plan
from app.rag.indexer import build_or_load_vectorstore
from app.prediction.service import predict
from pydantic import BaseModel
from app.agent.schemas import StudyPlanInput
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

        data = res.json()

        return {

            "student_id": data["studentId"],

            "name": data["studentName"],

            "level": data["prediction"]["level"],

            "score": data["prediction"]["predictedScore"],

            "study_hours": data["metrics"]["studyHours"],

            "attendance": data["metrics"]["attendance"],

            "subjects": [
                "math",
                "physics",
                "chemistry"
            ]

        }

    except Exception as e:

        print(e)

        return None


@router.post("/study-plan")
def study_plan(payload: StudyPlanInput):

    student = get_student_data(payload.student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return generate_study_plan(payload.student_id, student)