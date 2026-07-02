from enum import Enum


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class SchoolType(str, Enum):
    public = "public"
    private = "private"


class InternetAccess(str, Enum):
    yes = "yes"
    no = "no"


class ExtraActivities(str, Enum):
    yes = "yes"
    no = "no"


class StudyMethod(str, Enum):
    notes = "notes"
    textbook = "textbook"
    group_study = "group study"


class TravelTime(str, Enum):
    less_15 = "<15 min"
    min_15_30 = "15-30 min"
    min_30_60 = "30-60 min"
    more_60 = ">60 min"


class StudentLevel(str, Enum):
    weak = "Weak"
    medium = "Medium"
    strong = "Strong"
    

class UnderstandingLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class EngagementLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class LearningStyle(str, Enum):
    step_by_step = "step_by_step"
    direct = "direct"
    visual = "visual"