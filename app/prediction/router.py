from fastapi import APIRouter
from app.prediction.service import predict
from app.prediction.service import predict, explain_prediction
from pydantic import BaseModel, Field

from app.common.enums import (
    Gender,
    SchoolType,
    InternetAccess,
    ExtraActivities,
    StudyMethod,
    TravelTime,
)

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


class PredictionInput(BaseModel):

    age: int = Field(..., ge=5, le=100)

    gender: Gender

    school_type: SchoolType

    study_hours: float = Field(..., ge=0, le=10)

    attendance_percentage: float = Field(..., ge=0, le=100)

    internet_access: InternetAccess

    travel_time: TravelTime

    extra_activities: ExtraActivities

    study_method: StudyMethod

@router.post("/performance")
def predict_performance(payload: PredictionInput):
    return predict(payload.dict())

@router.post("/explain")
def explain(payload: PredictionInput):
    return explain_prediction(payload.dict())