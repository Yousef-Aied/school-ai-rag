from pydantic import BaseModel
from typing import List, Dict


class DayPlan(BaseModel):
    day: str
    topics: List[str]
    tasks: List[str]


class StudyPlanResponse(BaseModel):
    plan: List[DayPlan]
    
class StudyPlanInput(BaseModel):
    level: str
    score: float
    study_hours: float
    attendance: float