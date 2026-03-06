import os
import fitz
import re

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def clean_text(text):
    import re
    
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Fix broken words like "rikes B" → "strikes B"
    text = re.sub(r'\b([a-z]{1})\s([a-z]{2,})\b', r'\1\2', text)
    
    # Remove weird symbols
    text = re.sub(r'[^\w\s.,;:()\-]', '', text)
    
    return text.strip()

def chunk_text(text, chunk_size=800, overlap=150):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def process_pdfs(folder="data/pdfs"):
    all_chunks = []
    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            path = os.path.join(folder, file)
            print("Processing:", file)
            text = extract_text(path)
            text = clean_text(text)
            chunks = chunk_text(text)
            for chunk in chunks:
                all_chunks.append({
                    "source": file,
                    "text": chunk
                })
    return all_chunks