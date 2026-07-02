from pydantic import BaseModel, Field
from typing import List


class DayPlan(BaseModel):
    day: str
    topics: List[str]
    tasks: List[str]


class StudyPlanResponse(BaseModel):
    plan: List[DayPlan]


class StudyPlanInput(BaseModel):
    student_id: int = Field(
        ...,
        gt=0,
        description="Student ID must be greater than 0"
    )