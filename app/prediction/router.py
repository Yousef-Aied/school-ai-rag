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
from pydantic import field_validator
from app.common.validators import validate_text

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


class PredictionInput(BaseModel):

    age: int = Field(..., ge=5, le=25)

    gender: Gender

    school_type: SchoolType

    study_hours: float = Field(..., ge=0, le=10)

    attendance_percentage: float = Field(..., ge=0, le=100)

    internet_access: InternetAccess

    travel_time: TravelTime

    extra_activities: ExtraActivities

    study_method: StudyMethod

    @field_validator(
        "gender",
        "school_type",
        "internet_access",
        "travel_time",
        "extra_activities",
        "study_method",
        mode="before",
    )
    @classmethod
    def validate_strings(cls, value):
        return validate_text(value)
    
@router.post("/performance")
def predict_performance(payload: PredictionInput):
    return predict(payload.dict())

@router.post("/explain")
def explain(payload: PredictionInput):
    return explain_prediction(payload.dict())