import json
from sentence_transformers import SentenceTransformer, util

# ===============================
# Load Model and IPC Data
# ===============================
model = SentenceTransformer("all-MiniLM-L6-v2")

with open("ipc_sections.json", "r", encoding="utf-8") as f:
    ipc_sections = json.load(f)  # {"302": "Murder", "379": "Theft", ...}

with open("ipc_categories.json", "r", encoding="utf-8") as f:
    ipc_categories = json.load(f)  # {"rape": ["376", "354", ...], ...}

with open("punishment.json", "r", encoding="utf-8") as f:
    ipc_punishments = json.load(f)

# Optional: priority ranks for court decisions (1=highest)
with open("ipc_priority.json", "r", encoding="utf-8") as f:
    ipc_priority = json.load(f)  # {"302": 1, "379": 5, "498A": 2, ...}

ipc_numbers = list(ipc_sections.keys())
ipc_texts = list(ipc_sections.values())

# Precompute embeddings
ipc_embeddings = model.encode(ipc_texts, convert_to_tensor=True, normalize_embeddings=True)

# ===============================
# IPC Prediction + Priority Ranking
# ===============================
def predict_ipc_priority(
    query: str,
    top_k: int = 10,
    threshold: float = 0.3,
    keywords: list = None,
    victim_age: int = None
):
    query_lower = query.lower()
    query_emb = model.encode([query], convert_to_tensor=True, normalize_embeddings=True)
    cosine_scores = util.cos_sim(query_emb, ipc_embeddings)[0]

    results = []

    for idx, ipc in enumerate(ipc_numbers):
        desc = ipc_sections[ipc]
        score = float(cosine_scores[idx])

        # ----- Age/Category Filter -----
        if victim_age is not None and ipc.startswith("376"):
            child_keywords = ["under 12", "under twelve", "under 16", "under sixteen", "minor"]
            if victim_age >= 18 and any(kw in desc.lower() for kw in child_keywords):
                continue
            if victim_age < 18 and ipc not in ["376AB","376DA","376DB"]:
                continue

        # ----- Keyword Boost -----
        weight = 1.0
        if keywords:
            for kw in keywords:
                if kw.lower() in desc.lower() or kw.lower() in query_lower:
                    weight += 0.3

        # ----- Legal Priority Boost -----
        priority = ipc_priority.get(ipc, 5)  # default medium priority=5
        priority_weight = 1 + (10 - priority) * 0.05  # higher priority => higher score

        final_score = score * weight * priority_weight

        if final_score < threshold:
            continue

        reason = ". ".join(desc.split(". ")[:2]).strip()
        if reason and not reason.endswith("."):
            reason += "."

        results.append({
            "ipc_section": ipc,
            "description": desc,
            "punishment": ipc_punishments.get(ipc, "Punishment not found"),
            "confidence": round(final_score, 3),
            "reason": reason,
            "priority_rank": priority
        })

    # Sort by final confidence + priority
    results.sort(key=lambda x: (x["confidence"], -x["priority_rank"]), reverse=True)

    results = results[:top_k]

    # Determine status
    best_score = results[0]["confidence"] if results else 0
    if best_score < 0.4:
        status = "low_confidence"
    elif best_score < 0.6:
        status = "moderate_confidence"
    else:
        status = "high_confidence"

    return {
        "status": status,
        "total_matches": len(results),
        "matches": results
    }

# ===============================
# Test Example
# ===============================
if __name__ == "__main__":
    query = "Man forcibly took cash from a shop at night and threatened the shopkeeper."

    result = predict_ipc_priority(
        query=query,
        top_k=5,
        threshold=0.3,
        keywords=["theft", "robbery", "steal"],
        victim_age=None
    )

    print(json.dumps(result, indent=4))