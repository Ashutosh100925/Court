import pdfplumber
import os
import json
import re   # <-- HERE

# ==============================
# CLEANING FUNCTION (PUT HERE)
# ==============================


import re

def clean_judgment(text):


     # Remove http / https links
    text = re.sub(r'https?://\S+', '', text)

    # Remove www links
    text = re.sub(r'www\.\S+', '', text)

    # Remove domain-style links (example.com, indiankanoon.org, etc.)
    text = re.sub(r'\b[\w.-]+\.(com|org|in|net|gov|edu|co\.in)\b\S*', '', text)

    # Remove email addresses
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', text)
    # ----------------------------
    # 1. Remove Indian Kanoon header line
    # ----------------------------
    text = re.sub(r'^.*? on \d{1,2} .*?, \d{4}', '', text, flags=re.MULTILINE)

    # ----------------------------
    # 2. Remove Equivalent citations
    # ----------------------------
    text = re.sub(r'Equivalent citations:.*?(?=Author:|Bench:|REPORTABLE|JUDGMENT)', '',
                  text, flags=re.DOTALL)

    # ----------------------------
    # 3. Remove Author / Bench lines
    # ----------------------------
    text = re.sub(r'Author:.*', '', text)
    text = re.sub(r'Bench:.*', '', text)

    # ----------------------------
    # 4. Remove REPORTABLE + Court header block
    # ----------------------------
    text = re.sub(r'REPORTABLE.*?(?=JUDGMENT)', '', text, flags=re.DOTALL)

    # ----------------------------
    # 5. Remove long underscore lines
    # ----------------------------
    text = re.sub(r'_{3,}', '', text)

    # ----------------------------
    # 6. Remove page numbers like 2 / 83
    # ----------------------------
    text = re.sub(r'\b\d+\s*/\s*\d+\b', '', text)

    # ----------------------------
    # 7. Remove standalone numbers like 1. 2. 23.
    # ----------------------------
    text = re.sub(r'\n\s*\d+\.\s*', '\n', text)

    # ----------------------------
    # 8. Fix broken words caused by PDF line wrapping
    # (join words only if line breaks inside sentence)
    # ----------------------------
    text = re.sub(r'(?<!\.)\n(?!\n)', ' ', text)

    # ----------------------------
    # 9. Remove excessive whitespace
    # ----------------------------
    text = re.sub(r'\s+', ' ', text)

    return text.strip()

# ==============================
# MAIN EXTRACTION LOOP
# ==============================

pdf_folder = r"D:\Court Rag\data\judgments"
all_judgments = {}

for filename in os.listdir(pdf_folder):
    if filename.lower().endswith(".pdf"):

        file_path = os.path.join(pdf_folder, filename)
        print("Processing:", filename)

        full_text = ""

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

        # 🔥 APPLY CLEANING HERE
        cleaned_text = clean_judgment(full_text)

        case_name = os.path.splitext(filename)[0]
        all_judgments[case_name] = cleaned_text


# ==============================
# SAVE JSON
# ==============================

with open("cleaned_judgments.json", "w", encoding="utf-8") as f:
    json.dump(all_judgments, f, indent=4, ensure_ascii=False)

print("Total files processed:", len(all_judgments))