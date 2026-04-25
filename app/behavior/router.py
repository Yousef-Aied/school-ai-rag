from fastapi import APIRouter
from app.behavior.schemas import BehaviorInput, BehaviorPredictResponse
from app.behavior.service import predict_cluster

router = APIRouter(prefix="/api/behavior", tags=["behavior"])

@router.post("/predict", response_model=BehaviorPredictResponse)
def predict(req: BehaviorInput):
    cluster, label = predict_cluster(req.model_dump())
    return {"cluster": cluster, "label": label}


@router.post("/profile")
def get_student_behavior_profile(req: BehaviorInput):
    # 1. Model Recall (K-Means)
    cluster, label = predict_cluster(req.model_dump())
    
    # 2. Defining presets based on our understanding of the data in the notebook
    presets = {
        0: {"style": "Visual & Advanced", "quiz_level": "hard", "plan": "Focus on infographics and deep analysis"},
        1: {"style": "Simple & Supportive", "quiz_level": "easy", "plan": "Focus on core concepts and motivational tasks"},
        2: {"style": "Interactive", "quiz_level": "medium", "plan": "Focus on discussions and group activities"},
        3: {"style": "Balanced/Steady", "quiz_level": "medium", "plan": "Standard structured learning path"},
    }
    
    # 3. Return the complete result
    return {
        "cluster": cluster,
        "label": label,
        "preset": presets.get(cluster, presets[3])
    }
# from fastapi import APIRouter, HTTPException
# from app.behavior.schemas import BehaviorInput, BehaviorPredictResponse
# from app.behavior.service import predict_cluster

# router = APIRouter(prefix="/api/behavior", tags=["Behavior"])

# @router.post("/predict", response_model=BehaviorPredictResponse)
# def predict(req: BehaviorInput):
#     try:
#         return predict_cluster(req.model_dump())
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))