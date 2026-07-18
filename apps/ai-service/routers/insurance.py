"""Insurance Pool Analytics Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class RiskContributionRequest(BaseModel):
    orderAmount: float
    orderType: str
    merchantTrustScore: Optional[float] = 75
    customerTrustScore: Optional[float] = 75

@router.post("/contribution")
def calculate_contribution(req: RiskContributionRequest):
    """Calculate insurance contribution for a transaction"""
    base_rate = 0.005  # 0.5%
    # Adjust based on risk
    if req.merchantTrustScore < 60 or req.customerTrustScore < 60:
        base_rate = 0.008
    if req.orderType in ["medicine", "logistics"]:
        base_rate = 0.007

    contribution = req.orderAmount * base_rate
    return {
        "orderAmount": req.orderAmount,
        "rate": base_rate,
        "contribution": round(contribution, 2),
        "coverageAmount": round(contribution * 200, 2),  # 200x coverage
    }

@router.get("/pool-health")
def pool_health():
    """Get insurance pool health metrics"""
    return {
        "status": "healthy",
        "recommendedLossRatio": 0.3,
        "warningThreshold": 0.5,
        "criticalThreshold": 0.8,
    }
