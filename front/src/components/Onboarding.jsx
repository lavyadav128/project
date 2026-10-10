import { useEffect, useRef, useState } from "react";
import { LANGUAGES, t } from "../data/i18n.js";
import { fetchStates } from "../api.js";

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=8&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function matchState(detectedName, knownStates) {
  if (!detectedName) return null;
  const target = normalize(detectedName);
  const exact = knownStates.find((s) => normalize(s.name) === target);
  if (exact) return exact;
  const partial = knownStates.find(
    (s) => target.includes(normalize(s.name)) || normalize(s.name).includes(target)
  );
  return partial || null;
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(null);

  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [statesError, setStatesError] = useState(null);

  const [locStatus, setLocStatus] = useState("idle");
  const [detectedState, setDetectedState] = useState(null);
  const [detectedRawName, setDetectedRawName] = useState(null);
  const [manualPick, setManualPick] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const hasAutoStarted = useRef(false);

  const lang = language || "en";

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => setStatesError(err.message))
      .finally(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    if (step === 2 && !hasAutoStarted.current && states.length > 0) {
      hasAutoStarted.current = true;
      detectLocation();
    }
  }, [step, states]);

  function detectLocation() {
    setManualPick(false);
    setLocStatus("locating");

    if (!("geolocation" in navigator)) {
      setLocStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await reverseGeocode(latitude, longitude);
          const rawState = data?.address?.state || data?.address?.state_district || null;
          const match = matchState(rawState, states);

          if (match) {
            setDetectedState(match);
            setLocStatus("found");
          } else {
            setDetectedRawName(rawState);
            setLocStatus("not-matched");
          }
        } catch {
          setLocStatus("error");
        }
      },
      (err) => {
        setLocStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }

  function confirmState(stateObj) {
    onComplete({ language: lang, state: stateObj.name });
  }

  function confirmCustom(customName) {
    const trimmed = (customName || "").trim();
    if (!trimmed) return;
    onComplete({ language: lang, state: trimmed });
  }

  const filteredStates = states.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.basin && s.basin.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.majorRivers && s.majorRivers.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-brand">
          <div className="wave-mark" aria-hidden="true">
            <svg viewBox="0 0 64 24" width="40" height="16">
              <path d="M0 12c6-8 12 8 18 0s12-8 18 0 12 8 18 0 8-4 10 0" />
            </svg>
          </div>
          <span className="onboard-brand-name">{t(lang, "appName")}</span>
        </div>

        <div className="onboard-progress" aria-hidden="true">
          <span className={step >= 1 ? "on" : ""} />
          <span className={step >= 2 ? "on" : ""} />
        </div>

        {step === 1 && (
          <>
            <h1>{t(lang, "selectLanguage")}</h1>
            <div className="option-grid">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`option-tile ${language === l.code ? "selected" : ""}`}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button className="primary-btn" disabled={!language} onClick={() => setStep(2)}>
              {t(lang, "continue")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1>{t(lang, "selectState")}</h1>

            {statesError && (
              <p className="muted error-text">
                Couldn't reach backend ({statesError}). Ensure server is running.
              </p>
            )}

            {!manualPick && (locStatus === "locating" || loadingStates) && (
              <div className="location-status">
                <span className="location-spinner" aria-hidden="true" />
                <p>{t(lang, "detectingLocation")}</p>
              </div>
            )}

            {!manualPick && locStatus === "found" && detectedState && (
              <div className="location-result">
                <div className="location-pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path
                      d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div>
                  <div className="location-result-label">{t(lang, "locationDetected")}</div>
                  <div className="location-result-state">{detectedState.name}</div>
                  <div className="location-result-meta">
                    {t(lang, "riskMonths")}: {detectedState.highRiskMonths}
                  </div>
                </div>
              </div>
            )}

            {!manualPick && (locStatus === "denied" || locStatus === "error" || locStatus === "not-matched") && (
              <div className="location-fallback-msg">
                <p className="muted">
                  {locStatus === "denied" && t(lang, "locationDenied")}
                  {locStatus === "error" && t(lang, "locationError")}
                  {locStatus === "not-matched" &&
                    (detectedRawName ? `Detected "${detectedRawName}". You can proceed or pick manually.` : t(lang, "locationNotMatched"))}
                </p>
                {locStatus === "not-matched" && detectedRawName && (
                  <button className="primary-btn" style={{ marginTop: 8 }} onClick={() => confirmCustom(detectedRawName)}>
                    Continue with "{detectedRawName}"
                  </button>
                )}
              </div>
            )}

            {!manualPick && locStatus === "found" && (
              <div className="onboard-actions" style={{ marginTop: 4 }}>
                <button className="ghost-btn" onClick={() => setManualPick(true)}>
                  {t(lang, "selectManually")}
                </button>
                <button className="primary-btn" onClick={() => confirmState(detectedState)}>
                  {t(lang, "continue")}
                </button>
              </div>
            )}

            {!manualPick && (locStatus === "denied" || locStatus === "error" || (locStatus === "not-matched" && !detectedRawName)) && (
              <div className="onboard-actions" style={{ marginTop: 4 }}>
                <button className="ghost-btn" onClick={detectLocation}>
                  {t(lang, "tryAgain")}
                </button>
                <button className="primary-btn" onClick={() => setManualPick(true)}>
                  {t(lang, "selectManually")}
                </button>
              </div>
            )}

            {manualPick && (
              <>
                <div className="search-state-wrap">
                  <input
                    type="text"
                    className="state-search-input"
                    placeholder="Search any state, territory or river basin…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="state-grid">
                  {filteredStates.map((s) => (
                    <button key={s.name} className="state-tile" onClick={() => confirmState(s)}>
                      <span className="state-name">{s.name}</span>
                      <span className="state-meta">
                        {t(lang, "riskMonths")}: {s.highRiskMonths}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Region / Basin option */}
                <div className="custom-region-box">
                  <span className="custom-region-label">Or enter any custom district, basin or city:</span>
                  <div className="custom-region-form">
                    <input
                      type="text"
                      placeholder="e.g. Varanasi, Konaseema, Ganga Basin"
                      value={customRegion}
                      onChange={(e) => setCustomRegion(e.target.value)}
                    />
                    <button
                      type="button"
                      className="primary-btn compact"
                      disabled={!customRegion.trim()}
                      onClick={() => confirmCustom(customRegion)}
                    >
                      Use
                    </button>
                  </div>
                </div>

                <div className="onboard-actions">
                  <button className="ghost-btn" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}