# Flood Assist AI — Hydrodynamic Flood Prediction & Regional Safety Assistant

An AI-driven flood prediction, hydrodynamic forecasting, and civil engineering safety assistant. The system is trained on a **316,616-point Computational Fluid Dynamics (CFD) multi-scenario velocity field simulation dataset** across 13 hydrodynamic flow regimes (varying discharge $Q = 0.5 - 1.5$, constriction ratios $0\% - 40\%$, channel widths $1.5 - 4.5\text{ m}$, and 3D spanwise spatial profiles). It provides physical flood wave predictions, arrival time forecasting, flow velocity estimation, and regional flood guidance for any state, river basin, or territory.

```
project/
├── back/
│   ├── data/
│   │   ├── dataset/                          ← 13 CFD regimes (316,616 simulation data points)
│   │   │   ├── 0.5_3_60/                     ← Q=0.5, W=3m, T=60s (y=0.03m and y=0.30m)
│   │   │   ├── 1.5_3_30_20%/                 ← Q=1.5, W=3m, 20% constriction
│   │   │   ├── 1.5_3_30_40%/                 ← Q=1.5, W=3m, 40% constriction
│   │   │   ├── 1_3_30/                       ← Q=1.0, W=3m, T=30s
│   │   │   ├── 1_3_60/                       ← Q=1.0, W=3m, T=60s (y=0.03m and y=0.30m)
│   │   │   └── Velocity_0-8.00_*             ← Multi-aspect and benchmark flume velocity fields
│   │   └── floodData.js                      ← Dynamic universal basin & regional intelligence (36 States/UTs)
│   ├── ml/
│   │   ├── train_model.py                   ← Multi-scenario spatial regressor trainer (R² = 0.9885)
│   │   ├── predict.py                       ← Python CLI prediction tool
│   │   ├── trained_model.pkl                ← Serialized ML spatial model
│   │   ├── predictor_grid.json              ← High-resolution spatial interpolation grid
│   │   └── model_metadata.json              ← Validation metrics, stats & physics parameters
│   ├── src/
│   │   ├── ml/floodPredictor.js             ← Sub-millisecond Node.js hydrodynamic engine
│   │   ├── llm.js                           ← LLM provider switch (OpenRouter / Ollama)
│   │   └── systemPrompt.js                  ← Grounded physics + regional intelligence prompt
│   └── server.js                            ← Express API (/api/chat, /api/predict, /api/states, /api/health)
└── front/                                   ← React 18 + Vite chat UI with live ML prediction cards
```

---

## 1. Machine Learning Hydrodynamic Model & Training

### Dataset
- **Location**: `back/data/dataset/`
- **Samples**: 316,616 hydrodynamic simulation points across 13 simulation setups
- **Physical Parameter Coverage**:
  - **Inflow / Discharge Regimes ($Q$)**: $0.5$, $1.0$, $1.5$
  - **Constriction & Choking Geometries**: $0\%$ (open reach), $20\%$, $40\%$ narrowing
  - **Channel Widths & Aspect Ratios**: $1.5\text{ m}$, $3.0\text{ m}$, $4.5\text{ m}$
  - **Cross-Sectional Coordinates**: Streamwise $x \in [-6.25\text{ m}, 12.00\text{ m}]$, Transverse $y \in [0.03\text{ m}, 0.30\text{ m}]$, Depth $z \in [-0.40\text{ m}, 0.40\text{ m}]$
- **Columns**: `cellnumber`/`nodenumber`, `x-coordinate`, `y-coordinate`, `z-coordinate`, `velocity-magnitude`, `x-velocity`, `y-velocity`, `z-velocity`
- **Physics**: Captures open-channel flow, hydraulic jump acceleration (peaking at $2.196\text{ m/s}$ in the high-energy surge zone), constriction acceleration, and downstream wave propagation.

### Model Architecture & Training Results
The model is a **Multi-Scenario Hydrodynamic CFD Spatial Regressor** with physical feature mapping and spatial k-d grid export.

| Target Variable | $R^2$ Score | RMSE | MAE |
|---|---|---|---|
| **Velocity Magnitude ($V$)** | **0.98853** | 0.04245 m/s | 0.01681 m/s |
| **Streamwise Velocity ($V_x$)** | **0.98754** | 0.04287 m/s | 0.01698 m/s |
| **Transverse Velocity ($V_y$)** | **0.97370** | 0.01486 m/s | 0.00588 m/s |
| **Vertical Velocity ($V_z$)** | **0.97963** | 0.02335 m/s | 0.00925 m/s |

### Re-training the Model
```bash
cd back
python ml/train_model.py
```
This ingests all 13 CFD simulation setups, computes 80/20 train/test validation, and updates `trained_model.pkl`, `predictor_grid.json`, and `model_metadata.json`.

### CLI Prediction Tool
```bash
cd back
python ml/predict.py --x 7.5 --y 0.03 --z 0.1 --discharge-scale 1.2
```

---

## 2. Universal Regional Coverage (No Dummy Data)

All manually added dummy placeholder data has been removed from the codebase.
The system dynamically covers:
- **All 36 Indian States and Union Territories** with official river basin categorizations (Indus, Ganga, Brahmaputra, Godavari, Krishna, Mahanadi, Cauvery, Narmada, Tapi, and coastal systems).
- **Major Dams & Barrages** across each basin.
- **Official Climatological Flood Drivers** (Monsoon cloudbursts, Himalayan GLOFs, transboundary Nepal snowmelt, cyclonic storm surges, DVC/barrage release protocols).
- **Official Emergency Response Numbers** (SEOC: 1070, NDRF: 1078, Ambulance: 108/112).
- **Custom Region & Coordinates Support**: Users can enter any district, city, river, or custom coordinates worldwide.

---

## 3. Future Flood Forecasting & Wave Celerity Physics

The system implements open-channel shallow-water wave physics:
1. **Wave Celerity ($c$)**:
   $$c = \sqrt{g \cdot h} + 1.2 \cdot V$$
2. **Downstream Arrival Time ($T_{arrival}$)**:
   $$T = \frac{\text{Distance}}{c}$$
3. **Discharge Scaling (Manning/Froude Power Law)**:
   $$V_{future} = V_{base} \cdot \left(\frac{Q_{future}}{Q_0}\right)^{0.4}$$
4. **Flood Hazard Rating ($H$)**:
   $$H = V \cdot (d + 0.5)$$
   - **Low**: $H < 0.75$ (Safe for adults)
   - **Moderate**: $0.75 \le H < 1.25$ (Danger for small vehicles and children)
   - **High**: $1.25 \le H < 2.0$ (Severe risk, vehicles swept away, structural scouring)
   - **Critical / Flash Flood**: $H \ge 2.0$ (Immediate vertical evacuation required)

---

## 4. API Endpoints

- **`POST /api/chat`**: Conversational endpoint. Automatically detects flood arrival and prediction intents, executes the ML model, and feeds real-time physical calculations to the LLM formatted in a structured ChatGPT sequence.
- **`POST /api/predict`**: Direct programmatic prediction endpoint.
  ```json
  // Request
  { "distanceKm": 5.0, "rainfallMm": 50, "dischargeScale": 1.2 }
  
  // Response
  {
    "prediction": {
      "velocityMagnitudeMs": 0.17,
      "waveCelerityMs": 2.93,
      "flowDepthM": 0.76,
      "riskLevel": "Low",
      "estimatedArrival": {
        "minutes": 28.4,
        "summary": "Approximately 28 minutes"
      }
    }
  }
  ```
- **`GET /api/states`**: Returns all 36 states, UTs, and basin characteristics.
- **`GET /api/health`**: Checks active LLM provider and ML model status ($R^2$, sample count = 316,616).

---

## 5. Running the Project

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- Python 3.10+ (for model re-training)

### Backend
```bash
cd back
npm install
# Copy .env.example to .env and configure provider:
# In .env set LLM_PROVIDER=openrouter or ollama
node server.js
```

### Frontend
```bash
cd front
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
