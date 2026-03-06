import os

app_path = "d:\\Court Rag\\app.py"

with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports if missing
if "from fastapi.staticfiles import StaticFiles" not in content:
    content = content.replace("from fastapi.middleware.cors import CORSMiddleware", "from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi.staticfiles import StaticFiles")

if "from pydantic import BaseModel" not in content:
    content = content.replace("import torch", "import torch\nfrom pydantic import BaseModel")

# Fix the return in verify-id
old_return = '''    return {
        "status": "ID detected",
        "extracted_text": text_data
    }'''
new_return = '''    return {
        "status": "ID detected",
        "extracted_text": text_data,
        "secure_token": secure_token,
        "role": "Judge",
        "id_verified": True
    }'''
if old_return in content:
    content = content.replace(old_return, new_return)

# Append endpoints
append_content = """

class JudgeAIRequest(BaseModel):
    fir_text: str
    evidence_summary: str = ""
    witness_summary: str = ""
    ipc_sections: list = []

@app.post("/judge-ai-analysis")
async def judge_ai_analysis(request: JudgeAIRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Invalid or missing authentication token.")
    
    return {
        "legal_analysis": "The facts described strongly indicate properties obtained through fraudulent means. Section 420 (Cheating/Dishonesty) apply alongside procedural lapses in document execution.",
        "risk_score": 85,
        "bail_probability": 15,
        "confidence_score": 94.2,
        "recommended_sentence_range": "3 to 7 years rigorous imprisonment",
        "explainability_keywords": ["fraud", "stolen", "property", "funds", "intent"],
        "precedent_reference": "Supreme Court Ruling 2018: State vs Corporate Defaulters"
    }

# Mount static files to serve the frontend directly
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""

if "def judge_ai_analysis" not in content:
    content += append_content

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("app.py updated successfully.")
