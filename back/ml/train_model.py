"""
Hydrodynamic Flood Forecasting & Velocity Field ML Model Trainer
Trained on CFD Velocity Dataset: Velocity_0-8.00_1.5 3 60.03 (21,642 data points)
"""

import os
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "dataset", "Velocity_0-8.00_1.5 3 60.03")
if not os.path.exists(DATASET_PATH):
    # Fallback to alternate name if present
    alt_path = os.path.join(os.path.dirname(__file__), "..", "data", "dataset", "velocity_cfd_dataset.txt")
    if os.path.exists(alt_path):
        DATASET_PATH = alt_path

OUTPUT_DIR = os.path.dirname(__file__)

def train_and_export():
    print(f"[*] Loading flood simulation dataset from: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH, sep=r'\s+', engine='python')
    print(f"[*] Dataset loaded successfully. Shape: {df.shape}")

    # Features and targets
    feature_cols = ['x-coordinate', 'z-coordinate']
    target_cols = ['velocity-magnitude', 'x-velocity', 'y-velocity', 'z-velocity']

    X = df[feature_cols].values
    Y = df[target_cols].values

    # Train / test split
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

    print("[*] Training multi-target ExtraTrees Regressor on hydrodynamic velocity fields...")
    model = ExtraTreesRegressor(
        n_estimators=45,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, Y_train)

    # Evaluate
    Y_pred = model.predict(X_test)
    metrics = {}
    for i, col in enumerate(target_cols):
        r2 = float(r2_score(Y_test[:, i], Y_pred[:, i]))
        rmse = float(np.sqrt(mean_squared_error(Y_test[:, i], Y_pred[:, i])))
        mae = float(mean_absolute_error(Y_test[:, i], Y_pred[:, i]))
        metrics[col] = {
            "r2_score": round(r2, 5),
            "rmse": round(rmse, 5),
            "mae": round(mae, 5)
        }
        print(f"    -> {col}: R2={r2:.5f}, RMSE={rmse:.5f}, MAE={mae:.5f}")

    # Overall dataset statistics
    stats = {
        "sample_count": int(len(df)),
        "x_min": float(df['x-coordinate'].min()),
        "x_max": float(df['x-coordinate'].max()),
        "x_range": float(df['x-coordinate'].max() - df['x-coordinate'].min()),
        "z_min": float(df['z-coordinate'].min()),
        "z_max": float(df['z-coordinate'].max()),
        "z_range": float(df['z-coordinate'].max() - df['z-coordinate'].min()),
        "velocity_magnitude_min": float(df['velocity-magnitude'].min()),
        "velocity_magnitude_max": float(df['velocity-magnitude'].max()),
        "velocity_magnitude_mean": float(df['velocity-magnitude'].mean()),
        "velocity_magnitude_std": float(df['velocity-magnitude'].std()),
        "peak_velocity_zone": {
            "x_start": 6.5,
            "x_end": 8.35,
            "max_velocity": float(df[df['x-coordinate'].between(6.5, 8.35)]['velocity-magnitude'].max()),
            "description": "High kinetic energy zone (hydraulic jump / release front)"
        }
    }

    # Save pickle model
    pkl_path = os.path.join(OUTPUT_DIR, "trained_model.pkl")
    with open(pkl_path, "wb") as f:
        pickle.dump(model, f, protocol=4)
    file_size_mb = os.path.getsize(pkl_path) / (1024 * 1024)
    print(f"[*] Saved Python model to: {pkl_path} ({file_size_mb:.2f} MB)")

    # Build streamwise spatial profiles (25 longitudinal slices along river reach)
    bins = np.linspace(stats["x_min"], stats["x_max"], 26)
    df['x_bin'] = pd.cut(df['x-coordinate'], bins=bins)
    
    streamwise_profile = []
    g = 9.81 # gravity m/s^2
    cum_travel_time_sec = 0.0

    for i in range(len(bins) - 1):
        x_left = bins[i]
        x_right = bins[i+1]
        x_mid = (x_left + x_right) / 2.0
        slice_df = df[(df['x-coordinate'] >= x_left) & (df['x-coordinate'] < x_right)]
        
        if len(slice_df) > 0:
            mean_v = float(slice_df['velocity-magnitude'].mean())
            max_v = float(slice_df['velocity-magnitude'].max())
            mean_vx = float(slice_df['x-velocity'].mean())
            mean_vz = float(slice_df['z-velocity'].mean())
        else:
            mean_v = 0.5
            max_v = 1.0
            mean_vx = 0.5
            mean_vz = 0.0
        
        dx = x_right - x_left
        h = max(0.2, stats["z_range"])
        celerity = float(np.sqrt(g * h) + 1.2 * max(0.01, mean_v))
        dt = dx / celerity
        cum_travel_time_sec += dt

        hazard_index = float(mean_v * (h + 0.5))
        if hazard_index < 0.75:
            hazard_level = "Low"
        elif hazard_index < 1.25:
            hazard_level = "Moderate"
        elif hazard_index < 2.0:
            hazard_level = "High"
        else:
            hazard_level = "Critical"

        streamwise_profile.append({
            "x_slice": round(float(x_mid), 3),
            "x_left": round(float(x_left), 3),
            "x_right": round(float(x_right), 3),
            "mean_velocity": round(mean_v, 4),
            "max_velocity": round(max_v, 4),
            "mean_vx": round(mean_vx, 4),
            "mean_vz": round(mean_vz, 4),
            "celerity_ms": round(celerity, 3),
            "segment_arrival_sec": round(dt, 2),
            "cumulative_arrival_sec": round(cum_travel_time_sec, 2),
            "cumulative_arrival_min": round(cum_travel_time_sec / 60.0, 3),
            "hazard_level": hazard_level
        })

    # Export spatial 2D grid for sub-millisecond Node.js interpolation
    print("[*] Generating 2D interpolation grid for Node.js engine...")
    nx, nz = 80, 30
    grid_x = np.linspace(stats["x_min"], stats["x_max"], nx)
    grid_z = np.linspace(stats["z_min"], stats["z_max"], nz)
    GX, GZ = np.meshgrid(grid_x, grid_z)
    grid_coords = np.column_stack([GX.ravel(), GZ.ravel()])

    grid_preds = model.predict(grid_coords)

    export_grid = {
        "nx": nx,
        "nz": nz,
        "x_min": round(stats["x_min"], 4),
        "x_max": round(stats["x_max"], 4),
        "z_min": round(stats["z_min"], 4),
        "z_max": round(stats["z_max"], 4),
        "dx": round(float((stats["x_max"] - stats["x_min"]) / (nx - 1)), 5),
        "dz": round(float((stats["z_max"] - stats["z_min"]) / (nz - 1)), 5),
        "values": [
            {
                "x": round(float(pt[0]), 3),
                "z": round(float(pt[1]), 3),
                "v": round(float(val[0]), 4),
                "vx": round(float(val[1]), 4),
                "vy": round(float(val[2]), 4),
                "vz": round(float(val[3]), 4)
            }
            for pt, val in zip(grid_coords, grid_preds)
        ]
    }

    grid_path = os.path.join(OUTPUT_DIR, "predictor_grid.json")
    with open(grid_path, "w", encoding="utf-8") as f:
        json.dump(export_grid, f)
    print(f"[*] Saved Node.js prediction grid to: {grid_path}")

    metadata = {
        "model_type": "ExtraTreesRegressor (Hydrodynamic CFD Forecaster)",
        "features": feature_cols,
        "targets": target_cols,
        "evaluation_metrics": metrics,
        "dataset_statistics": stats,
        "streamwise_profile": streamwise_profile,
        "physics_parameters": {
            "gravity": g,
            "channel_depth_nominal_m": round(stats["z_range"], 3),
            "reach_length_nominal_m": round(stats["x_range"], 3),
            "hazard_thresholds": {
                "low": "< 0.75 (Safe for adults)",
                "moderate": "0.75 - 1.25 (Danger for children & vehicles)",
                "high": "1.25 - 2.0 (Structural damage, wading dangerous)",
                "critical": ">= 2.0 (Structural collapse, flash flood torrent)"
            }
        }
    }

    meta_path = os.path.join(OUTPUT_DIR, "model_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[*] Saved model metadata to: {meta_path}")

    print("[SUCCESS] Hydrodynamic flood AI model training and export complete!")

if __name__ == "__main__":
    train_and_export()
