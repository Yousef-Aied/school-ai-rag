from fastapi import APIRouter
from pydantic import BaseModel
from app.prediction.service import predict
from app.prediction.service import predict, explain_prediction

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


class PredictionInput(BaseModel):
    age: int
    gender: str
    school_type: str
    study_hours: float
    attendance_percentage: float
    internet_access: str
    travel_time: float
    extra_activities: str
    study_method: str


@router.post("/performance")
def predict_performance(payload: PredictionInput):
    return predict(payload.dict())

@router.post("/explain")
def explain(payload: PredictionInput):
    return explain_prediction(payload.dict())