import json
import pandas as pd

# Load your ipc_sections.json
with open("ipc_sections.json", "r", encoding="utf-8") as f:
    ipc_sections = json.load(f)

# Create a list of rows
rows = []
for section, text in ipc_sections.items():
    # You can fill dummy numeric features or leave as placeholders
    row = {
        "description": text,
        "ipc_section": section,
        "evidence_strength": 5,  # default placeholder
        "witness_count": 1,      # default placeholder
        "severity_level": 3,     # default placeholder
        "bail_granted": 0        # default placeholder
    }
    rows.append(row)

# Convert to DataFrame
df = pd.DataFrame(rows)

# Save to CSV
df.to_csv("data/legal_dataset.csv", index=False)
print("✅ legal_dataset.csv created successfully!")