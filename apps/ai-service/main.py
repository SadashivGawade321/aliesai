"""
AegisPay AI — Python FastAPI AI Service
Handles: Fraud Detection, Trust Scoring, Dispute Resolution, Insurance
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import fraud, trust, dispute, insurance

app = FastAPI(
    title="AegisPay AI Service",
    description="🤖 AI-powered fraud detection, trust scoring, and dispute resolution for AegisPay",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(trust.router, prefix="/api/trust", tags=["Trust Score"])
app.include_router(dispute.router, prefix="/api/dispute", tags=["Dispute Resolution"])
app.include_router(insurance.router, prefix="/api/insurance", tags=["Insurance"])

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "AegisPay AI Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": ["/docs", "/api/fraud", "/api/trust", "/api/dispute", "/api/insurance"],
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "service": "aegispay-ai"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
