from joblib import load, dump

# Load the original model
model = load("ipc_model.joblib")

# Save it in a format compatible with your target environment (1.7.2)
dump(model, "ipc_model_1_7_2.joblib")
print("Model re-saved successfully!")