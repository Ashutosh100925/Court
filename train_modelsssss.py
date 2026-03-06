import pandas as pd
import joblib
import os

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# ===============================
# 1. Load Dataset
# ===============================
df = pd.read_csv("data/legal_dataset.csv")

# Ensure 'priority_rank' exists
if 'priority_rank' not in df.columns:
    # If not present, assign based on severity_level (example)
    df['priority_rank'] = df['severity_level'].rank(method='dense', ascending=False).astype(int)

# ===============================
# 2. Create Models Folder
# ===============================
os.makedirs("models", exist_ok=True)

# ===============================
# 3. IPC Section Prediction Model
# ===============================

# Features
text_features = "description"
numeric_features = ["priority_rank", "severity_level"]

preprocessor = ColumnTransformer(
    transformers=[
        ("text", TfidfVectorizer(ngram_range=(1,2)), text_features),
        ("num", StandardScaler(), numeric_features)
    ]
)

ipc_model = Pipeline([
    ("preprocess", preprocessor),
    ("clf", LogisticRegression(max_iter=2000, class_weight="balanced"))
])

# Train IPC section model
ipc_model.fit(df, df["ipc_section"])

# Save model
joblib.dump(ipc_model, "models/ipc_model.pkl")
print("✅ IPC Section Model trained and saved.")

# ===============================
# 4. Bail Prediction Model
# ===============================
X_bail = df[["evidence_strength", "witness_count", "severity_level"]]
y_bail = df["bail_granted"]

bail_model = LogisticRegression(max_iter=1000)
bail_model.fit(X_bail, y_bail)

# Save model
joblib.dump(bail_model, "models/bail_model.pkl")
print("✅ Bail Model trained and saved.")

# ===============================
# 5. Function to predict IPC + Bail
# ===============================
def predict_case(description, evidence_strength, witness_count, severity_level, priority_rank):
    # Prepare IPC input
    ipc_input = pd.DataFrame([{
        "description": description,
        "priority_rank": priority_rank,
        "severity_level": severity_level
    }])

    predicted_ipc = ipc_model.predict(ipc_input)[0]
    ipc_proba = ipc_model.predict_proba(ipc_input)

    # Prepare bail input
    bail_input = pd.DataFrame([{
        "evidence_strength": evidence_strength,
        "witness_count": witness_count,
        "severity_level": severity_level
    }])
    predicted_bail = bail_model.predict(bail_input)[0]

    return {
        "predicted_ipc_section": predicted_ipc,
        "predicted_bail": int(predicted_bail),
        "ipc_probabilities": ipc_proba.tolist()
    }

# Example usage
example = predict_case(
    description="Cruelty by husband towards wife including harassment for dowry",
    evidence_strength=8,
    witness_count=3,
    severity_level=7,
    priority_rank=1
)
print(example)