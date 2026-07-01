from fastapi import APIRouter
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

        return res.json()

    except Exception as e:
        print("DOTNET ERROR:", e)
        return None


@router.post("/study-plan")
def study_plan(payload: StudyPlanInput):
    return generate_study_plan(1, payload.dict())