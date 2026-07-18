"""
Trust Score Router — Scikit-Learn rolling window scoring
Entities: customers, merchants, delivery partners
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TrustScoreRequest(BaseModel):
    userId: str
    entityType: str  # customer | merchant | delivery_partner
    totalOrders: Optional[int] = 0
    successfulOrders: Optional[int] = 0
    disputes: Optional[int] = 0
    refundsRequested: Optional[int] = 0
    fraudFlags: Optional[int] = 0
    # Merchant-specific
    acceptanceRate: Optional[float] = 1.0
    complaintRate: Optional[float] = 0.0
    # Driver-specific
    otpAccuracy: Optional[float] = 1.0
    gpsConsistency: Optional[float] = 1.0

class TrustScoreResponse(BaseModel):
    userId: str
    score: float
    breakdown: dict
    grade: str
    recommendation: str

def score_to_grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"

@router.post("/calculate", response_model=TrustScoreResponse)
def calculate_trust_score(req: TrustScoreRequest) -> TrustScoreResponse:
    """Calculate trust score (0-100) for any entity type."""
    base = 75.0
    breakdown = {"base": base}

    if req.entityType == "customer":
        # Success rate bonus
        if req.totalOrders and req.totalOrders > 0:
            success_rate = req.successfulOrders / req.totalOrders
            bonus = success_rate * 15
            base += bonus
            breakdown["success_rate_bonus"] = round(bonus, 2)

        # Penalty for disputes
        dispute_penalty = min(req.disputes * 5, 20)
        base -= dispute_penalty
        breakdown["dispute_penalty"] = -dispute_penalty

        # Penalty for refund abuse
        refund_penalty = min(req.refundsRequested * 2, 10)
        base -= refund_penalty
        breakdown["refund_penalty"] = -refund_penalty

        # Fraud flag penalty
        fraud_penalty = req.fraudFlags * 20
        base -= fraud_penalty
        breakdown["fraud_penalty"] = -fraud_penalty

    elif req.entityType == "merchant":
        acceptance_bonus = req.acceptanceRate * 10
        base += acceptance_bonus
        breakdown["acceptance_bonus"] = round(acceptance_bonus, 2)

        complaint_penalty = req.complaintRate * 20
        base -= complaint_penalty
        breakdown["complaint_penalty"] = -round(complaint_penalty, 2)

    elif req.entityType == "delivery_partner":
        otp_bonus = req.otpAccuracy * 10
        base += otp_bonus
        breakdown["otp_accuracy_bonus"] = round(otp_bonus, 2)

        gps_bonus = req.gpsConsistency * 5
        base += gps_bonus
        breakdown["gps_consistency_bonus"] = round(gps_bonus, 2)

        dispute_penalty = min(req.disputes * 3, 15)
        base -= dispute_penalty
        breakdown["dispute_penalty"] = -dispute_penalty

    score = round(max(0, min(100, base)), 2)
    grade = score_to_grade(score)

    recommendation = (
        "Trusted entity — no restrictions" if score >= 80
        else "Monitor closely — some risk factors" if score >= 60
        else "High risk — apply additional verification" if score >= 40
        else "Critical risk — restrict account"
    )

    return TrustScoreResponse(
        userId=req.userId,
        score=score,
        breakdown=breakdown,
        grade=grade,
        recommendation=recommendation,
    )
