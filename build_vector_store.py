import joblib
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Load FAISS index and texts
texts = joblib.load("models/legal_texts.pkl")
index = faiss.read_index("models/legal_index.faiss")

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Case description
case_description = "A 10-year-old child was forced to work in a factory and denied proper education."

# Generate embedding
query_emb = model.encode([case_description], convert_to_tensor=False).astype("float32")

# Search top-k relevant sections
top_k = 5
distances, indices = index.search(query_emb, top_k)

print("Top relevant IPC sections:")
for rank, idx in enumerate(indices[0]):
    entry = texts[idx]
    print(f"{rank+1}. IPC {entry['ipc_section']} - {entry['text'][:120]}...")
    print(f"   Punishment: {entry['punishment']}\n")