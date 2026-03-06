import json
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import torch
import httpx

# -----------------------
# App Setup
# -----------------------
app = FastAPI(
    title="Universal IPC Predictor API",
    description="AI-powered IPC section prediction with smart filtering and confidence analysis",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Load Sentence Transformer
# -----------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

# -----------------------
# Load IPC Sections
# -----------------------
with open("ipc_sections.json", "r", encoding="utf-8") as f:
    raw_sections = json.load(f)

ipc_sections = {}

if isinstance(raw_sections, list):
    for item in raw_sections:
        sec = item.get("ipc_section")
        desc = item.get("description", "")
        ipc_sections[sec] = {"description": desc}

elif isinstance(raw_sections, dict):
    for sec, val in raw_sections.items():
        ipc_sections[sec] = {
            "description": val.get("description", "") if isinstance(val, dict) else str(val)
        }

# -----------------------
# Load Punishments
# -----------------------
with open("punishment.json", "r", encoding="utf-8") as f:
    punishments_list = json.load(f)

ipc_punishments = {
    item.get("ipc_section"): item.get("punishment", "Punishment not found")
    for item in punishments_list
}

for sec in ipc_sections:
    ipc_sections[sec]["punishment"] = ipc_punishments.get(sec, "Punishment not found")

# -----------------------
# Load Categories (optional)
# -----------------------
try:
    with open("ipc_categories.json", "r", encoding="utf-8") as f:
        ipc_categories = json.load(f)
except FileNotFoundError:
    ipc_categories = {}

# -----------------------
# Encode IPC descriptions once (performance optimized)
# -----------------------
ipc_numbers = list(ipc_sections.keys())
ipc_texts = [ipc_sections[sec]["description"] for sec in ipc_numbers]

ipc_embeddings = model.encode(
    ipc_texts,
    convert_to_tensor=True,
    normalize_embeddings=True
)

# -----------------------
# Request Schema
# -----------------------
class CaseRequest(BaseModel):
    description: str
    victim_age: int | None = None
    keywords: list[str] | None = None
    category_filter: str | None = None
    threshold: float = 0.35


# -----------------------
# Utility: Clean Text
# -----------------------
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    return text


# -----------------------
# Smart Filtering
# -----------------------
def filter_results(results, category=None, keywords=None, threshold=0.35):
    filtered = []

    for match in results:
        if match["confidence"] < threshold:
            continue

        if category:
            allowed = ipc_categories.get(category.lower(), [])
            if allowed and match["ipc_section"] not in allowed:
                continue

        if keywords:
            if not any(kw.lower() in match["description"].lower() for kw in keywords):
                continue

        filtered.append(match)

    return sorted(filtered, key=lambda x: x["confidence"], reverse=True)


# -----------------------
# Main Prediction Logic
# -----------------------
def predict_ipc(query, victim_age=None, keywords=None, category=None, threshold=0.35, top_k=10):

    query_clean = clean_text(query)

    query_embedding = model.encode(
        [query_clean],
        convert_to_tensor=True,
        normalize_embeddings=True
    )

    cosine_scores = util.cos_sim(query_embedding, ipc_embeddings)[0]

    results = []

    for idx, sec in enumerate(ipc_numbers):
        base_score = float(cosine_scores[idx])
        description = ipc_sections[sec]["description"]
        punishment = ipc_sections[sec]["punishment"]

        weight = 1.0

        # 🔥 Keyword boosting
        if keywords:
            for kw in keywords:
                if kw.lower() in description.lower():
                    weight += 0.25

        # 🔥 Minor victim age intelligence (POCSO boosting example)
        if victim_age is not None and victim_age < 18:
            if "minor" in description.lower() or "child" in description.lower():
                weight += 0.3

        confidence = base_score * weight

        results.append({
            "ipc_section": sec,
            "description": description,
            "punishment": punishment,
            "raw_score": round(base_score, 4),
            "confidence": round(confidence, 4),
        })

    # Apply filtering
    results = filter_results(results, category, keywords, threshold)

    results = results[:top_k]

    # Confidence status
    best_score = results[0]["confidence"] if results else 0

    if best_score < 0.4:
        status = "low_confidence"
    elif best_score < 0.65:
        status = "moderate_confidence"
    else:
        status = "high_confidence"

    # Add reason snippet
    for r in results:
        snippet = r["description"].split(".")[:2]
        r["reason"] = ".".join(snippet).strip() + "."

    return {
        "status": status,
        "best_confidence_score": best_score,
        "total_matches": len(results),
        "matches": results
    }


# -----------------------
# API Endpoint
# -----------------------
@app.post("/predict-ipc")
def predict_case(case: CaseRequest):
    return predict_ipc(
        query=case.description,
        victim_age=case.victim_age,
        keywords=case.keywords,
        category=case.category_filter,
        threshold=case.threshold
    )
# -----------------------
# ID Card Verification Endpoint
# -----------------------
from fastapi import UploadFile, File, HTTPException, Header
import cv2
import numpy as np
import uuid
import datetime
import random
from ml.id_detector import detect_id
from ml.ocr_reader import extract_text

@app.post("/verify-id/")
async def verify_id(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"status": "Invalid image"}

    id_detected = detect_id(frame)

    if not id_detected:
        return {"status": "No ID detected"}

    text_data = extract_text(frame)
    
    # Generate secure token & grant Judge Role for mock
    secure_token = str(uuid.uuid4())

    return {
        "status": "ID detected",
        "extracted_text": text_data
    }

# -----------------------
# Judge Secure AI Endpoint
# -----------------------
import asyncio

class SecureAIRequest(BaseModel):
    case_context: str | None = None
    fir_details: str | None = None
    evidence_text: str | None = None
    witness_statements: str | None = None
    charges: str | None = None
    prior_history: str | None = None

@app.post("/api/judge-analysis/")
async def judge_analysis(
    request: SecureAIRequest,
    authorization: str = Header(None)
):
    # Validate secure token passed from frontend
    if not authorization or authorization != "Bearer SECURE_JUDGE_TOKEN_999X":
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid Secure Token or Role")
    
    await asyncio.sleep(2.5)
    
    
    return {
        "confidential_case_summary": "Based on analysis of 12,540 prior judgments, the defendant demonstrated a calculated intent to defraud, corroborated by circumstantial evidence indicating a premeditated financial conspiracy.",
        "risk_assessment": random.randint(75, 95),
        "bail_recommendation": "High Flight Risk - Denial Recommended",
        "sentencing_guidance": "5 to 7 Years Rigorous Imprisonment",
        "precedent_analysis": "Pattern consistency detected in previous Tribunal rulings where similar financial obfuscation methods were utilized.",
        "procedural_stage": "Trial Phase – Evidence Recording",
        "delay_prediction_days": random.randint(15, 45),
        "confidence_score": random.randint(88, 98),
        # Extra Phase 2 Mock Data
        "fir_summary": "FIR No. 420/2026 registered at cyber cell. Primary allegation involves multi-crore digital embezzlement.",
        "evidence_summary": "Digital trail verified. 4 HDD drives secured under Section 65B forensics.",
        "witness_risks": "High risk of witness tampering flags detected for Witness #2 (Key Financial Officer).",
        "charge_interpretation": "Prima facie case established under IPC 420, 467, 468, 471 & IT Act 66D.",
        "forensic_strength": "High",
        
        "recidivism_score": random.randint(60, 85),
        "bail_probability": random.randint(10, 25),
        "flight_risk_class": "Severe (Interpol Alert Recommended)",
        
        "cctv_analysis": "CCTV Frame 00:43:12 confirms physical presence at localized ATM.",
        "face_match_confidence": random.randint(92, 99),
        "document_authenticity": random.randint(30, 45), 
        "tampering_result": "Positive - Digital Forgery Detected in Exhibit B.",
        
        "timeline": [
            {"date": "12 Jan 2026", "event": "FIR Filed & Arrest Warrant Issued", "status": "red"},
            {"date": "15 Jan 2026", "event": "Initial Bail Hearing - Denied", "status": "red"},
            {"date": "02 Feb 2026", "event": "Chargesheet Filed (1,200 Pages)", "status": "blue"},
            {"date": "24 Feb 2026", "event": "Forensic Report Submitted", "status": "green"}
        ],
        
        "explainability": {
            "suggested_sections": "IPC 420, 467, 468 - Selected due to digital forgery cross-referenced with financial gain.",
            "top_keywords": ["Embezzlement", "Cyber Fraud", "Forged Document", "Intent"],
            "precedents": ["State vs. CyberCorp (2021) - 94% Match", "Dev Sharma vs. UoI (2018) - 86% Match"],
            "evidence_weight": "Forensic Data (45%), Witness Statement (30%), Digital Trail (25%)"
        }
    }

class LiveAIRequest(BaseModel):
    case_id: str | None = None
    latest_case_data_hash: str | None = None
    verification_token: str | None = None

@app.post("/api/judge-analysis/live")
async def judge_analysis_live(
    request: LiveAIRequest,
    authorization: str = Header(None)
):
    # Validate secure token for continuous access
    if not authorization or authorization != "Bearer SECURE_JUDGE_TOKEN_999X":
        raise HTTPException(status_code=403, detail="Unauthorized: Session Expired – Reverification Required")
    
    # Simulate processing jitter for live mode
    await asyncio.sleep(0.5)
    
    # Generate dynamically shifting metrics for live simulation
    base_risk = random.randint(75, 95)
    base_delay = random.randint(15, 45)
    base_confidence = random.randint(88, 98)
    
    return {
        "risk_assessment": base_risk + random.randint(-2, 2),
        "bail_probability": random.randint(10, 25),
        "recidivism_score": random.randint(60, 85),
        "sentencing_guidance": "5 to 7 Years Rigorous Imprisonment",
        "delay_prediction_days": base_delay + random.randint(-1, 1),
        "flight_risk_class": "Severe (Interpol Alert Recommended)",
        "confidence_score": base_confidence + random.randint(-1, 1),
        
        "forensic_strength": random.choice(["High", "High (Verified)"]),
        "face_match_confidence": random.randint(92, 99),
        "document_authenticity": random.randint(30, 45),
        
        "explainability": {
            "suggested_sections": "IPC 420, 467, 468 - Continuous pattern matching confirmed.",
            "top_keywords": ["Embezzlement", "Cyber Fraud", "Forged Document", "Intent", "Live Data Sync"],
            "evidence_weight": f"Forensic Data ({random.randint(40,48)}%), Witness Statement ({random.randint(28,32)}%), Digital Trail ({random.randint(20,30)}%)"
        }
    }

# -----------------------
# NewsData Integration Proxy
# -----------------------
NEWSDATA_URL = "https://newsdata.io/api/1/latest"
NEWSDATA_API_KEY = "pub_4534034c8b38475596493431d12b1429"

@app.get("/api/latest-news")
async def get_latest_news():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                NEWSDATA_URL,
                params={
                    "apikey": NEWSDATA_API_KEY,
                    "country": "in",     # optional
                    "language": "en"     # optional
                },
                timeout=10.0
            )

            response.raise_for_status()
            data = response.json()

            return data.get("results", [])

        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"News API Error: {e.response.text}")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))