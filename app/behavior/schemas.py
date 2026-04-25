from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BehaviorInput(BaseModel):
    student_id: Optional[int] = None
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
    preset: Optional[Dict[str, Any]] = None

class ClusterStatsResponse(BaseModel):
    counts: Dict[str, int]
    total: int