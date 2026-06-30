from pydantic import BaseModel
from typing import List, Dict


class StudyPlanResponse(BaseModel):
    plan: Dict[str, List[str]]
    focus_areas: List[str]
    tips: List[str]