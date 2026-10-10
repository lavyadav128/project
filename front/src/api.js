import { API_BASE_URL } from "./environment.js";

export async function fetchStates() {
  const res = await fetch(`${API_BASE_URL}/api/states`);

  if (!res.ok) {
    throw new Error("Could not load state list");
  }

  const data = await res.json();
  return data.states;
}

export async function sendChatMessage({
  message,
  state,
  language,
  history,
}) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      state,
      language,
      history,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return {
    reply: data.reply,
    prediction: data.prediction || null,
  };
}

export async function predictFlood({
  distanceKm,
  depthM,
  dischargeScale,
  rainfallMm,
  damReleaseM3s,
  x,
  z,
}) {
  const res = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      distanceKm,
      depthM,
      dischargeScale,
      rainfallMm,
      damReleaseM3s,
      x,
      z,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Prediction request failed.");
  }
  return data;
}
