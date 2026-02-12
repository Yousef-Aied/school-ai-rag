from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BehaviorInput(BaseModel):
    StudyHours: float
    Attendance: float
    Resources: float
    Extracurricular: float
    Motivation: float
    Internet: float
    Age: float
    OnlineCourses: float
    Discussions: float
    AssignmentCompletion: float
    ExamScore: float
    EduTech: float
    StressLevel: float
    FinalGrade: float

class BehaviorPredictResponse(BaseModel):
    cluster: int
    label: str

class ClusterStatsResponse(BaseModel):
    counts: Dict[str, int]
    total: int