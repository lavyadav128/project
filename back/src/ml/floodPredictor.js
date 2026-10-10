import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_PATH = path.join(__dirname, "..", "..", "ml", "model_metadata.json");
const GRID_PATH = path.join(__dirname, "..", "..", "ml", "predictor_grid.json");

let modelMeta = null;
let predictorGrid = null;

// Load trained parameters on startup
try {
  if (fs.existsSync(METADATA_PATH)) {
    modelMeta = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
  }
  if (fs.existsSync(GRID_PATH)) {
    predictorGrid = JSON.parse(fs.readFileSync(GRID_PATH, "utf-8"));
  }
} catch (err) {
  console.error("Warning: could not load trained ML model files:", err.message);
}

/**
 * Predicts hydrodynamics, flow velocity, wave arrival time, and hazard rating
 * based on the trained CFD model (21,642 data points).
 */
export function predictHydrodynamics({
  x = 7.5,
  z = 0.0,
  distanceKm = null,
  depthM = null,
  dischargeScale = 1.0,
  rainfallMm = null,
  damReleaseM3s = null,
} = {}) {
  if (!modelMeta || !predictorGrid) {
    throw new Error("Trained ML model weights not loaded. Please verify train_model.py output.");
  }

  const stats = modelMeta.dataset_statistics;

  // If distanceKm is provided, map it to the dimensionless/reach coordinate domain
  let queryX = x;
  if (distanceKm !== null && distanceKm !== undefined) {
    const km = Math.max(0.1, Number(distanceKm));
    // Normalize km onto simulation reach [-6.21 to 11.99]
    queryX = stats.x_min + (Math.min(km, 50.0) / 50.0) * stats.x_range;
  }

  // Discharge scaling adjustment if rainfall or dam release specified
  let qScale = Math.max(0.2, Number(dischargeScale || 1.0));
  if (rainfallMm && Number(rainfallMm) > 0) {
    // Heavy rain increases discharge: e.g. 50mm -> +30% discharge
    qScale += (Number(rainfallMm) / 100.0) * 0.6;
  }
  if (damReleaseM3s && Number(damReleaseM3s) > 0) {
    // Dam release factor
    qScale += (Number(damReleaseM3s) / 500.0) * 0.5;
  }

  // Clamp coordinates within dataset domain
  const clampedX = Math.min(stats.x_max, Math.max(stats.x_min, queryX));
  const clampedZ = Math.min(stats.z_max, Math.max(stats.z_min, z));

  // Find nearest trained spatial grid point
  const { nx, nz, x_min, x_max, z_min, z_max, values } = predictorGrid;
  const ix = Math.min(nx - 1, Math.max(0, Math.round(((clampedX - x_min) / (x_max - x_min)) * (nx - 1))));
  const iz = Math.min(nz - 1, Math.max(0, Math.round(((clampedZ - z_min) / (z_max - z_min)) * (nz - 1))));
  const cellIndex = iz * nx + ix;
  const cell = values[cellIndex] || values[0];

  // Hydrodynamic velocity scaling: V ~ Q^0.4 (Manning open channel power law)
  const qFactor = Math.pow(qScale, 0.4);
  const baseV = cell.v;
  const scaledV = Number((baseV * qFactor).toFixed(4));
  const scaledVx = Number((cell.vx * qFactor).toFixed(4));
  const vy = Number(cell.vy.toFixed(4));
  const vz = Number(cell.vz.toFixed(4));

  // Effective water depth h (m)
  const nominalH = depthM ? Math.max(0.2, Number(depthM)) : Math.max(0.5, clampedZ - stats.z_min + 0.3);
  const effectiveH = Number((nominalH * Math.pow(qScale, 0.3)).toFixed(3));

  // Shallow-water wave celerity: c = sqrt(g * h) + 1.2 * V
  const g = 9.81;
  const waveCelerity = Number((Math.sqrt(g * effectiveH) + 1.2 * Math.max(0.1, scaledV)).toFixed(3));

  // Calculate arrival time
  let effectiveDistanceMeters = 0;
  if (distanceKm !== null && distanceKm !== undefined) {
    effectiveDistanceMeters = Math.max(50, Number(distanceKm) * 1000);
  } else {
    effectiveDistanceMeters = Math.max(10, (clampedX - stats.x_min) * 100);
  }

  const arrivalSec = effectiveDistanceMeters / waveCelerity;
  const arrivalMin = Number((arrivalSec / 60.0).toFixed(2));
  const arrivalHr = Number((arrivalMin / 60.0).toFixed(2));

  // Australian / DEFRA Flood Hazard Index: H = V * (d + 0.5)
  const hazardIndex = Number((scaledV * (effectiveH + 0.5)).toFixed(3));
  let riskLevel = "Low";
  let hazardDescription = "";
  let actionRequired = "";

  if (hazardIndex < 0.75) {
    riskLevel = "Low";
    hazardDescription = "Shallow water movement. Generally safe for adults, but monitor water levels.";
    actionRequired = "Stay alert to weather and upstream dam bulletins. Secure ground-level equipment.";
  } else if (hazardIndex < 1.25) {
    riskLevel = "Moderate";
    hazardDescription = "Dangerous to children, elderly, and standard passenger cars (vehicles can lose traction).";
    actionRequired = "Do NOT drive through flooded roads. Move valuables to higher floors. Prepare emergency supplies.";
  } else if (hazardIndex < 2.0) {
    riskLevel = "High";
    hazardDescription = "High velocity and depth. Can sweep away SUVs and cause significant structural damage to boundary walls.";
    actionRequired = "Immediate evacuation to designated elevated shelters. Avoid all contact with flood water and electrical wiring.";
  } else {
    riskLevel = "Critical / Flash Flood";
    hazardDescription = "Violent flood torrent. High probability of masonry wall collapse and severe erosion.";
    actionRequired = "LIFE SAFETY PRIORITY: Immediate vertical evacuation to upper concrete floors or hill slopes. Call NDRF/Emergency control.";
  }

  return {
    model: "Hydrodynamic ExtraTrees CFD Forecaster",
    trainedSamples: stats.sample_count,
    r2Score: modelMeta.evaluation_metrics["velocity-magnitude"].r2_score,
    inputs: {
      distanceKm: distanceKm !== null ? Number(distanceKm) : null,
      depthM: effectiveH,
      dischargeScale: qScale,
      rainfallMm: rainfallMm || 0,
      damReleaseM3s: damReleaseM3s || 0,
      internalCoordinates: { x: Number(clampedX.toFixed(3)), z: Number(clampedZ.toFixed(3)) },
    },
    prediction: {
      velocityMagnitudeMs: scaledV,
      velocityComponents: { vx: scaledVx, vy, vz },
      waveCelerityMs: waveCelerity,
      flowDepthM: effectiveH,
      hazardIndex,
      riskLevel,
      estimatedArrival: {
        seconds: Math.round(arrivalSec),
        minutes: arrivalMin,
        hours: arrivalHr,
        summary: formatArrival(arrivalMin),
      },
      peakVelocityZone: stats.peak_velocity_zone,
      impactAssessment: {
        humanSafety: scaledV > 0.4 ? "Unsafe for pedestrians to wade" : "Shallow wading possible with care",
        vehicleSafety: scaledV > 0.3 || effectiveH > 0.3 ? "Danger: 30cm water sweeps cars" : "Drive with extreme caution only if road visible",
        structuralRisk: scaledV > 1.8 ? "Critical risk of embankment/wall breach" : "Moderate erosion pressure",
      },
      recommendedAction: actionRequired,
    },
  };
}

function formatArrival(minutes) {
  if (minutes < 1) return "Under 1 minute (immediate proximity)";
  if (minutes < 60) return `Approximately ${Math.round(minutes)} minutes`;
  const hrs = Math.floor(minutes / 60);
  const remainingMin = Math.round(minutes % 60);
  return `${hrs} hour${hrs > 1 ? "s" : ""} ${remainingMin > 0 ? remainingMin + " mins" : ""}`;
}

/**
 * Returns summary of model training and hydrodynamic metrics.
 */
export function getModelMetadata() {
  return modelMeta;
}
