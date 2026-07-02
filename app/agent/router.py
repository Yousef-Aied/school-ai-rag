from fastapi import APIRouter, HTTPException
from app.agent.service import generate_study_plan
from app.agent.schemas import StudyPlanInput
import requests
import logging

logger = logging.getLogger(__name__)

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
        logger.info("Dashboard response: %s", data)
        
        # Response Validation
        if "prediction" not in data or "metrics" not in data:
            logger.error(
                "Invalid response from .NET API: missing prediction or metrics"
            )
            return None
        
        prediction = data["prediction"]
        metrics = data["metrics"]
        if prediction is None or metrics is None:
            logger.error(
                "Invalid response from .NET API: prediction or metrics is null"
            )
            return None
        
        score = prediction.get("predictedScore")
        attendance = metrics.get("attendance")
        study_hours = metrics.get("studyHours")
        
        if score is None or attendance is None or study_hours is None:
            logger.error(
                "Missing required values in prediction/metrics"
            )
            return None
        
        # Business/Data Validation
        if not (0 <= score <= 100):
            logger.error("Invalid predicted score: %s", score)
            return None

        if not (0 <= attendance <= 100):
            logger.error("Invalid attendance: %s", attendance)
            return None

        if study_hours < 0:
            logger.error("Invalid study hours: %s", study_hours)
            return None
        return {

            "student_id": data["studentId"],

            "name": data["studentName"],

            "level": prediction["level"],

            "score": score,

            "study_hours": study_hours,

            "attendance": attendance,

            "subjects": [
                "math",
                "physics",
                "chemistry"
            ]

        }

    except Exception as e:
        logger.exception("Failed to fetch student data from .NET API")
        return None


@router.post("/study-plan")
def study_plan(payload: StudyPlanInput):

    student = get_student_data(payload.student_id)

    if student is None:
        logger.warning("Study plan requested for invalid student_id=%d", payload.student_id)

        raise HTTPException(
            status_code=404,
            detail="Student not found or invalid student data."
    )

    return generate_study_plan(payload.student_id, student)