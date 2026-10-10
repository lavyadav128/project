"""
Command-line Python Prediction Tool for Trained Hydrodynamic Flood AI Model
Usage:
  python predict.py --x 7.2 --z 0.1 --discharge-scale 1.2
  python predict.py --distance 5000 --depth 2.5 --discharge-scale 1.5
"""

import os
import sys
import json
import pickle
import argparse
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "trained_model.pkl")
META_PATH = os.path.join(os.path.dirname(__file__), "model_metadata.json")

def load_predictor():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(META_PATH):
        raise FileNotFoundError("Model files not found. Run train_model.py first.")
    
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return model, meta

def predict_hydrodynamics(x, z, discharge_scale=1.0, reach_scale=1.0):
    model, meta = load_predictor()
    stats = meta["dataset_statistics"]
    
    # Clamp x, z to trained physical domain for base velocity lookup
    x_clamped = np.clip(x, stats["x_min"], stats["x_max"])
    z_clamped = np.clip(z, stats["z_min"], stats["z_max"])

    features = np.array([[x_clamped, z_clamped]])
    preds = model.predict(features)[0]
    
    base_v = float(preds[0])
    base_vx = float(preds[1])
    base_vy = float(preds[2])
    base_vz = float(preds[3])

    # Hydrodynamic scaling with discharge (V ~ Q^0.4 based on Manning's open channel flow)
    q_factor = float(discharge_scale ** 0.4)
    scaled_v = base_v * q_factor
    scaled_vx = base_vx * q_factor

    # Wave celerity c = sqrt(g * h) + 1.2 * v
    g = 9.81
    h = max(0.5, (z_clamped - stats["z_min"]) + 0.3)
    celerity = np.sqrt(g * h) + 1.2 * max(0.1, scaled_v)

    # Effective distance in meters
    eff_distance = max(1.0, (x - stats["x_min"]) * reach_scale)
    arrival_time_sec = eff_distance / celerity
    arrival_time_min = arrival_time_sec / 60.0
    arrival_time_hr = arrival_time_min / 60.0

    # Hazard rating H = v * (h + 0.5)
    hazard_val = scaled_v * (h + 0.5)
    if hazard_val < 0.75:
        risk_level = "Low"
        warning = "Caution advised; shallow, safe for adults."
    elif hazard_val < 1.25:
        risk_level = "Moderate"
        warning = "Dangerous to children and small vehicles. Do not drive through flow."
    elif hazard_val < 2.0:
        risk_level = "High"
        warning = "Severe risk; can sweep vehicles and destabilize light structures. Evacuate immediately."
    else:
        risk_level = "Critical / Flash Flood"
        warning = "Catastrophic torrent. Extreme danger to life and permanent structures. Immediate vertical evacuation required."

    return {
        "input_coordinates": {"x": x, "z": z, "discharge_scale": discharge_scale},
        "predicted_velocity_magnitude_ms": round(scaled_v, 4),
        "predicted_x_velocity_ms": round(scaled_vx, 4),
        "predicted_y_velocity_ms": round(base_vy, 4),
        "predicted_z_velocity_ms": round(base_vz, 4),
        "wave_celerity_ms": round(float(celerity), 3),
        "estimated_arrival_time": {
            "seconds": round(float(arrival_time_sec), 1),
            "minutes": round(float(arrival_time_min), 2),
            "hours": round(float(arrival_time_hr), 3)
        },
        "flow_depth_m": round(float(h), 3),
        "hazard_rating": round(float(hazard_val), 3),
        "risk_level": risk_level,
        "warning_and_action": warning
    }

def main():
    parser = argparse.ArgumentParser(description="Predict flood velocity and wave propagation using trained ML model.")
    parser.add_argument("--x", type=float, default=7.5, help="Streamwise distance / x coordinate (m)")
    parser.add_argument("--z", type=float, default=0.1, help="Depth / z coordinate (m)")
    parser.add_argument("--discharge-scale", type=float, default=1.0, help="Discharge multiplier (e.g. 1.5 for 50% flood increase)")
    parser.add_argument("--reach-scale", type=float, default=1.0, help="Spatial scaling factor for long rivers (e.g. 100 for 100x reach length)")

    args = parser.parse_args()
    result = predict_hydrodynamics(args.x, args.z, args.discharge_scale, args.reach_scale)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
