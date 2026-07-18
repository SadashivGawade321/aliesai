"""
AI Dispute Resolution Router — LangGraph-style decision tree
Provides explainable recommendations for disputed orders
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class DisputeRequest(BaseModel):
    orderId: str
    customerId: str
    merchantId: str
    disputeReason: str
    orderAmount: float
    otpVerified: Optional[bool] = False
    hasGpsProof: Optional[bool] = False
    deliveryPhotoExists: Optional[bool] = False
    customerTrustScore: Optional[float] = 75
    merchantTrustScore: Optional[float] = 75
    deliveryTrustScore: Optional[float] = 75
    fraudScore: Optional[float] = 0
    fraudRiskLevel: Optional[str] = "LOW"
    previousDisputes: Optional[int] = 0
    orderHistory: Optional[int] = 0

class DisputeDecision(BaseModel):
    recommendation: str  # REFUND | SETTLE | MANUAL_REVIEW
    confidence: float    # 0-1
    explanation: List[str]
    suggestedOutcome: str
    refundAmount: Optional[float] = None
    merchantAmount: Optional[float] = None

@router.post("/analyze", response_model=DisputeDecision)
def analyze_dispute(req: DisputeRequest) -> DisputeDecision:
    """
    AI-powered dispute analysis using a decision tree.
    Provides explainable recommendations with confidence scores.
    """
    explanation = []
    score_refund = 0.0
    score_settle = 0.0

    # ─── Node 1: OTP Verification ─────────────────────────────────────
    if req.otpVerified:
        score_settle += 40
        explanation.append("✅ OTP was verified — strong evidence of delivery")
    else:
        score_refund += 30
        explanation.append("❌ OTP not verified — delivery unconfirmed")

    # ─── Node 2: GPS Evidence ─────────────────────────────────────────
    if req.hasGpsProof:
        score_settle += 20
        explanation.append("✅ GPS logs show delivery partner reached destination")
    else:
        score_refund += 15
        explanation.append("⚠️ No GPS proof of delivery location")

    # ─── Node 3: Photo Evidence ───────────────────────────────────────
    if req.deliveryPhotoExists:
        score_settle += 15
        explanation.append("✅ Delivery photo on record")
    else:
        score_refund += 10
        explanation.append("⚠️ No delivery photo available")

    # ─── Node 4: Fraud Risk ───────────────────────────────────────────
    if req.fraudRiskLevel in ["HIGH", "CRITICAL"]:
        score_refund += 25
        explanation.append(f"🚨 High fraud risk detected (level: {req.fraudRiskLevel})")
    elif req.fraudRiskLevel == "MEDIUM":
        score_refund += 10
        explanation.append(f"⚠️ Medium fraud risk (level: {req.fraudRiskLevel})")

    # ─── Node 5: Customer Trust History ──────────────────────────────
    if req.customerTrustScore < 60:
        score_settle += 10
        explanation.append(f"⚠️ Customer has low trust score ({req.customerTrustScore})")
    if req.previousDisputes > 2:
        score_settle += 15
        explanation.append(f"⚠️ Customer has {req.previousDisputes} previous disputes")

    # ─── Node 6: Merchant Trust ───────────────────────────────────────
    if req.merchantTrustScore >= 85:
        score_settle += 10
        explanation.append(f"✅ Merchant has high trust score ({req.merchantTrustScore})")

    # ─── Decision ─────────────────────────────────────────────────────
    total = score_refund + score_settle
    if total == 0:
        recommendation = "MANUAL_REVIEW"
        confidence = 0.5
        suggested = "Escalate to human agent"
        refund_amt = None
        merchant_amt = None
    elif score_refund > score_settle * 1.3:
        recommendation = "REFUND"
        confidence = round(min(score_refund / (total + 0.01), 0.99), 2)
        suggested = f"Refund ₹{req.orderAmount:.2f} to customer"
        refund_amt = req.orderAmount
        merchant_amt = 0.0
    elif score_settle > score_refund * 1.3:
        recommendation = "SETTLE"
        confidence = round(min(score_settle / (total + 0.01), 0.99), 2)
        suggested = f"Release ₹{req.orderAmount * 0.9:.2f} to merchant"
        refund_amt = 0.0
        merchant_amt = req.orderAmount * 0.9
    else:
        recommendation = "MANUAL_REVIEW"
        confidence = 0.5
        suggested = f"Partial split: ₹{req.orderAmount * 0.5:.2f} each — requires human review"
        refund_amt = req.orderAmount * 0.5
        merchant_amt = req.orderAmount * 0.5

    return DisputeDecision(
        recommendation=recommendation,
        confidence=confidence,
        explanation=explanation,
        suggestedOutcome=suggested,
        refundAmount=refund_amt,
        merchantAmount=merchant_amt,
    )
