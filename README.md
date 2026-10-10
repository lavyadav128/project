# Flood Assist AI — Hydrodynamic Flood Prediction & Regional Safety Assistant

An AI-driven flood prediction, hydrodynamic forecasting, and civil engineering safety assistant. The system is trained on a **21,642-point Computational Fluid Dynamics (CFD) velocity field simulation dataset** (`Velocity_0-8.00_1.5 3 60.03`) and provides physical flood wave predictions, arrival time forecasting, flow velocity estimation, and regional flood guidance for any state, river basin, or territory.

```
project/
├── back/
│   ├── data/
│   │   ├── dataset/
│   │   │   └── Velocity_0-8.00_1.5 3 60.03   ← 21,642 CFD simulation data points
│   │   └── floodData.js                      ← Dynamic universal basin & regional intelligence
│   ├── ml/
│   │   ├── train_model.py                   ← Multi-target ML regressor trainer (R² = 0.9987)
│   │   ├── predict.py                       ← Python CLI prediction tool
│   │   ├── trained_model.pkl                ← Pickled ML model
│   │   ├── predictor_grid.json              ← 2D spatial interpolation grid
│   │   └── model_metadata.json              ← Validation metrics, stats & physics parameters
│   ├── src/
│   │   ├── ml/floodPredictor.js             ← Sub-millisecond Node.js hydrodynamic engine
│   │   ├── llm.js                           ← LLM provider switch (OpenRouter / Ollama)
│   │   └── systemPrompt.js                  ← Grounded physics + regional intelligence prompt
│   └── server.js                            ← Express API (/api/chat, /api/predict, /api/states)
└── front/                                   ← React 18 + Vite chat UI with live ML prediction cards
```

---

## 1. Machine Learning Hydrodynamic Model & Training

### Dataset
- **File**: `back/data/dataset/Velocity_0-8.00_1.5 3 60.03`
- **Samples**: 21,642 hydrodynamic simulation points
- **Columns**: `cellnumber`, `x-coordinate`, `y-coordinate`, `z-coordinate`, `velocity-magnitude`, `x-velocity`, `y-velocity`, `z-velocity`
- **Physics**: Captures open-channel flow, hydraulic jump acceleration (peaking at $2.115\text{ m/s}$ in the high-energy surge zone), and downstream wave propagation.

### Model Architecture & Training Results
The model is an **ExtraTrees Multi-Target Hydrodynamic Regressor** with physical feature mapping and spatial k-d grid export.

| Target Variable | $R^2$ Score | RMSE | MAE |
|---|---|---|---|
| **Velocity Magnitude ($V$)** | **0.99869** | 0.01798 m/s | 0.00652 m/s |
| **Streamwise Velocity ($V_x$)** | **0.99889** | 0.01655 m/s | 0.00599 m/s |
| **Transverse Velocity ($V_y$)** | **0.97094** | 0.00826 m/s | 0.00239 m/s |
| **Vertical Velocity ($V_z$)** | **0.99360** | 0.01166 m/s | 0.00374 m/s |

### Re-training the Model
```bash
cd back
python ml/train_model.py
```
This updates `trained_model.pkl`, `predictor_grid.json`, and `model_metadata.json`.

### CLI Prediction Tool
```bash
python ml/predict.py --x 7.5 --z 0.1 --discharge-scale 1.5
```

---

## 2. Universal Regional Coverage (No Dummy Data)

All manually added dummy placeholder data has been completely removed from the codebase.
The system now dynamically covers:
- **All 36 Indian States and Union Territories** with official river basin categorizations (Indus, Ganga, Brahmaputra, Godavari, Krishna, Mahanadi, Cauvery, Narmada, Tapi, and coastal systems).
- **Major Dams & Barrages** across each basin.
- **Official Climatological Flood Drivers** (Monsoon cloudbursts, Himalayan GLOFs, transboundary Nepal snowmelt, cyclonic storm surges, DVC/barrage release protocols).
- **Official Emergency Response Numbers** (SEOC: 1070, NDRF: 1078, Ambulance: 108/112).
- **Custom Region & Coordinates Support**: Users can enter any district, city, river, or custom coordinates.

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

- **`POST /api/chat`**: Conversational endpoint. Automatically detects flood arrival and prediction intents, executes the ML model, and feeds real-time physical calculations to the LLM.
- **`POST /api/predict`**: Direct programmatic prediction endpoint.
  ```json
  // Request
  { "distanceKm": 5.0, "rainfallMm": 50, "dischargeScale": 1.2 }
  
  // Response
  {
    "prediction": {
      "velocityMagnitudeMs": 0.19,
      "waveCelerityMs": 2.92,
      "flowDepthM": 0.75,
      "riskLevel": "Low",
      "estimatedArrival": {
        "minutes": 28.6,
        "summary": "Approximately 29 minutes"
      }
    }
  }
  ```
- **`GET /api/states`**: Returns all 36 states, UTs, and basin characteristics.
- **`GET /api/health`**: Checks active LLM provider and ML model status ($R^2$, sample count).

---

## 5. Running the Project

### Backend
```bash
cd back
npm install
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
