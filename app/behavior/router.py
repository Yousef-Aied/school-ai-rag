from fastapi import APIRouter
from app.behavior.schemas import BehaviorInput, BehaviorPredictResponse
from app.behavior.service import predict_cluster

router = APIRouter(prefix="/api/behavior", tags=["behavior"])

@router.post("/predict", response_model=BehaviorPredictResponse)
def predict(req: BehaviorInput):
    cluster, label = predict_cluster(req.model_dump())
    return {"cluster": cluster, "label": label}

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