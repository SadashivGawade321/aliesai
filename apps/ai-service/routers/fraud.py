"""
Fraud Detection Router — XGBoost + Rule Engine
Detects: fake refunds, GPS mismatch, velocity attacks, device spoofing, etc.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import numpy as np

router = APIRouter()

class FraudAnalysisRequest(BaseModel):
    userId: str
    orderId: Optional[str] = None
    orderAmount: Optional[float] = 0
    refundCount: Optional[int] = 0
    cancellationCount: Optional[int] = 0
    deviceId: Optional[str] = None
    ipAddress: Optional[str] = None
    totalOrders: Optional[int] = 0
    accountAgeDays: Optional[int] = 30
    uniqueDevices: Optional[int] = 1
    requestsPerHour: Optional[int] = 1
    gpsConsistency: Optional[float] = 1.0  # 0-1, 1=consistent

class FraudAnalysisResponse(BaseModel):
    score: float
    riskLevel: str
    flags: List[str]
    explanation: dict

def get_risk_level(score: float) -> str:
    if score >= 70: return "CRITICAL"
    if score >= 40: return "HIGH"
    if score >= 20: return "MEDIUM"
    return "LOW"

@router.post("/analyze", response_model=FraudAnalysisResponse)
def analyze_fraud(req: FraudAnalysisRequest) -> FraudAnalysisResponse:
    """
    Analyze fraud risk using rule-based scoring + XGBoost model.
    Returns a fraud score (0-100), risk level, and detected flags.
    """
    score = 0.0
    flags = []
    explanation = {}

    # ─── Rule 1: Refund Abuse ───────────────────────────────────────
    if req.refundCount and req.refundCount > 3:
        increment = min(req.refundCount * 8, 30)
        score += increment
        flags.append("refund_abuse")
        explanation["refund_abuse"] = f"Refund count {req.refundCount} exceeds threshold (3)"

    # ─── Rule 2: Repeated Cancellations ─────────────────────────────
    if req.cancellationCount and req.cancellationCount > 5:
        increment = min(req.cancellationCount * 4, 20)
        score += increment
        flags.append("repeated_cancellation")
        explanation["repeated_cancellation"] = f"Cancellations ({req.cancellationCount}) too high"

    # ─── Rule 3: Account Farming (new account, high volume) ──────────
    if req.accountAgeDays < 7 and (req.totalOrders or 0) > 10:
        score += 25
        flags.append("account_farming")
        explanation["account_farming"] = "New account with unusually high order volume"

    # ─── Rule 4: Device Spoofing ────────────────────────────────────
    if req.uniqueDevices and req.uniqueDevices > 3:
        score += 15
        flags.append("device_spoofing")
        explanation["device_spoofing"] = f"Multiple devices detected ({req.uniqueDevices})"

    # ─── Rule 5: Velocity Attack ─────────────────────────────────────
    if req.requestsPerHour and req.requestsPerHour > 20:
        score += 20
        flags.append("velocity_attack")
        explanation["velocity_attack"] = f"High request rate ({req.requestsPerHour}/hr)"

    # ─── Rule 6: GPS Mismatch ────────────────────────────────────────
    if req.gpsConsistency is not None and req.gpsConsistency < 0.5:
        score += 20
        flags.append("gps_mismatch")
        explanation["gps_mismatch"] = f"GPS consistency low ({req.gpsConsistency:.2f})"

    # ─── XGBoost Model (simulated — load real model in production) ───
    # In production, load: model = xgb.Booster(); model.load_model('models/fraud_model.json')
    features = np.array([[
        req.refundCount or 0,
        req.cancellationCount or 0,
        req.accountAgeDays or 30,
        req.uniqueDevices or 1,
        req.requestsPerHour or 1,
        req.gpsConsistency or 1.0,
        req.orderAmount or 0,
        req.totalOrders or 0,
    ]])
    # Simulated model output (0-1 probability)
    model_score = float(np.clip(score / 100 + np.random.normal(0, 0.05), 0, 1))
    final_score = round(min(score * 0.7 + model_score * 30, 100), 2)

    return FraudAnalysisResponse(
        score=final_score,
        riskLevel=get_risk_level(final_score),
        flags=flags,
        explanation=explanation,
    )

@router.post("/batch-analyze")
def batch_analyze(requests: List[FraudAnalysisRequest]):
    """Analyze multiple users in batch"""
    return [analyze_fraud(req) for req in requests]

@router.get("/risk-levels")
def get_risk_levels():
    return {
        "LOW": {"range": "0-19", "action": "Allow"},
        "MEDIUM": {"range": "20-39", "action": "Monitor"},
        "HIGH": {"range": "40-69", "action": "Flag for review"},
        "CRITICAL": {"range": "70-100", "action": "Block and refund"},
    }
