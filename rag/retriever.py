import faiss
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("models/legal_index.faiss")
texts = joblib.load("models/legal_texts.pkl")

def retrieve(query, top_k=5):
    query_vector = model.encode([query])
    distances, indices = index.search(np.array(query_vector), top_k)
    return [texts[i] for i in indices[0]]