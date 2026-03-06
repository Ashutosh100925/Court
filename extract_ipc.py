import pdfplumber
import re
import json

ipc_sections = {}

with pdfplumber.open("D:\\Court Rag\\data\\pdfs\\IPC_186045.pdf") as pdf:
    full_text = ""
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            full_text += text + "\n"

# ==============================
# GLOBAL CLEANING
# ==============================

# Remove amendment notes like [Ins. by Act ...]
full_text = re.sub(r'\[.*?\]', '', full_text, flags=re.DOTALL)

# Remove Subs./Omitted footnotes blocks
full_text = re.sub(r'\n\d+\.\s+(Subs|Ins|Omit).*?(?=\n\d+\.|\Z)', '', full_text, flags=re.DOTALL)

# Remove standalone page numbers
full_text = re.sub(r'\n\d+\n', '\n', full_text)

# Remove excessive spaces
full_text = re.sub(r'\s+', ' ', full_text)

# ==============================
# SPLIT SECTIONS
# ==============================

sections = re.split(r'(?=\b\d+\.\s)', full_text)

for sec in sections:
    match = re.match(r'(\d+)\.\s', sec)
    if match:
        section_number = match.group(1)

        # Remove section number from text
        clean_text = re.sub(r'^\d+\.\s*', '', sec).strip()

        # Extract title (before dash or period)
        title_match = re.match(r'([A-Za-z ,\-()]+)[.—-]', clean_text)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = "Offence"

        # Remove Illustrations (optional but recommended)
        clean_text = re.sub(r'Illustration.*', '', clean_text, flags=re.IGNORECASE)

        # Final formatting for AI
        enriched_text = (
    f"Section {section_number} of the Indian Penal Code (IPC) – {title}. "
    f"This section defines and explains the offence. "
    f"{clean_text}"
)

        # Skip very short junk sections
        if len(enriched_text) > 120:
            ipc_sections[section_number] = enriched_text.strip()

# ==============================
# SAVE CLEAN JSON
# ==============================

with open("ipc_sections_clean.json", "w", encoding="utf-8") as f:
    json.dump(ipc_sections, f, indent=4, ensure_ascii=False)

print("Total Clean Sections:", len(ipc_sections))
print("IPC Cleaned & AI-Optimized Successfully 🚀")