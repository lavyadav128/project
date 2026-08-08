// =====================================================================
// DUMMY FLOOD DATA
// =====================================================================
// THIS ENTIRE FILE IS PLACEHOLDER DATA I made up for demo/testing.
// Numbers, dam names, "current" levels, and travel times are NOT real.
//
// WHEN YOUR PROFESSOR GIVES YOU REAL DATA:
//   - Keep the exact same shape (same keys) for each state object below,
//     and everything else in the app (server.js, systemPrompt.js,
//     frontend) will keep working with zero changes.
//   - Realistically the "dams" and "currentLevel" fields should come from
//     a live source (CWC's flood forecast API, a sensor feed, a CSV your
//     professor provides, etc.) instead of being hardcoded — but for a
//     working demo, hardcoded is fine.
// =====================================================================

export const floodData = {
  Assam: {
    majorRivers: ["Brahmaputra", "Barak", "Dhansiri"],
    floodProneDistricts: ["Dhemaji", "Barpeta", "Morigaon", "Dibrugarh"],
    highRiskMonths: "June to September (monsoon + Himalayan snowmelt)",
    dams: [
      { name: "Kopili Dam", river: "Kopili", currentLevel: "Normal", status: "Safe" },
      { name: "Doyang Dam", river: "Doyang", currentLevel: "Near Full Reservoir Level", status: "Watch" },
    ],
    generalPrecautions: [
      "Move livestock and valuables to higher ground before water levels rise",
      "Keep a battery radio to track All India Radio flood bulletins",
      "Avoid crossing flooded roads even in a vehicle — 30cm of moving water can sweep away a car",
      "Store at least 3 days of drinking water and dry food",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  Bihar: {
    majorRivers: ["Ganga", "Kosi", "Gandak", "Bagmati"],
    floodProneDistricts: ["Darbhanga", "Muzaffarpur", "Supaul", "Purnia"],
    highRiskMonths: "July to September",
    dams: [
      { name: "Kosi Barrage", river: "Kosi", currentLevel: "Rising", status: "Watch" },
      { name: "Valmiki Barrage", river: "Gandak", currentLevel: "Normal", status: "Safe" },
    ],
    generalPrecautions: [
      "Kosi river is known for sudden channel shifts — do not rely on last year's safe zones",
      "Keep important documents in a waterproof pouch, ready to carry",
      "Identify your nearest raised relief shelter / school building in advance",
      "Do not let children play near embankments during high flow",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "102",
    },
  },
  "Uttar Pradesh": {
    majorRivers: ["Ganga", "Yamuna", "Ghaghara", "Rapti"],
    floodProneDistricts: ["Gorakhpur", "Ballia", "Prayagraj", "Varanasi"],
    highRiskMonths: "July to September",
    dams: [
      { name: "Rihand Dam", river: "Rihand", currentLevel: "Normal", status: "Safe" },
      { name: "Sarda Sahayak Barrage", river: "Sharda", currentLevel: "Near Full Reservoir Level", status: "Watch" },
    ],
    generalPrecautions: [
      "Track water release announcements from upstream barrages — releases can raise levels within hours",
      "Avoid low-lying river-side colonies during confirmed high-release windows",
      "Keep a charged power bank; mobile towers can go down during severe flooding",
      "Boil or chemically treat drinking water after flood water recedes",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  "West Bengal": {
    majorRivers: ["Ganga (Hooghly)", "Damodar", "Ajay", "Teesta"],
    floodProneDistricts: ["Malda", "Murshidabad", "Howrah", "Hooghly"],
    highRiskMonths: "June to October (also cyclone-linked flooding)",
    dams: [
      { name: "Durgapur Barrage", river: "Damodar", currentLevel: "Rising", status: "Watch" },
      { name: "Massanjore Dam", river: "Mayurakshi", currentLevel: "Normal", status: "Safe" },
    ],
    generalPrecautions: [
      "DVC (Damodar Valley Corporation) scheduled releases are a major flood trigger downstream — check release bulletins",
      "In coastal/delta districts also watch cyclone + storm surge warnings, not just rainfall",
      "Keep boats/country boats accessible in known chronically flooded blocks",
      "Vaccinate against water-borne disease risk where advised by local health authorities",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  Odisha: {
    majorRivers: ["Mahanadi", "Brahmani", "Baitarani"],
    floodProneDistricts: ["Kendrapara", "Jagatsinghpur", "Puri", "Cuttack"],
    highRiskMonths: "July to September (also cyclone season Oct-Nov)",
    dams: [
      { name: "Hirakud Dam", river: "Mahanadi", currentLevel: "Near Full Reservoir Level", status: "Watch" },
    ],
    generalPrecautions: [
      "Hirakud Dam gate openings are announced in advance — follow Water Resources Dept bulletins for release timing",
      "Delta districts should prepare for both river flooding and cyclonic storm surge",
      "Cyclone/flood shelters (multipurpose cyclone shelters) exist in most coastal blocks — know your nearest one",
      "Keep livestock fodder stored on raised platforms",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  Kerala: {
    majorRivers: ["Periyar", "Pamba", "Bharathapuzha"],
    floodProneDistricts: ["Idukki", "Ernakulam", "Alappuzha", "Wayanad"],
    highRiskMonths: "June to August (SW monsoon), also landslide risk in hill districts",
    dams: [
      { name: "Idukki Dam", river: "Periyar", currentLevel: "Normal", status: "Safe" },
      { name: "Mullaperiyar Dam", river: "Periyar", currentLevel: "Rising", status: "Watch" },
    ],
    generalPrecautions: [
      "In hill districts, flooding often comes with landslide risk — evacuate on official warning, don't wait to see water",
      "Mullaperiyar releases affect downstream areas fast — sign up for local disaster management SMS alerts",
      "Backwater/low-lying areas near Vembanad lake flood even with moderate rain — check local advisories",
      "Keep an emergency go-bag: torch, ID copies, medicines, phone charger",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  Maharashtra: {
    majorRivers: ["Godavari", "Krishna", "Tapi", "Mithi"],
    floodProneDistricts: ["Kolhapur", "Sangli", "Mumbai (Mithi basin)", "Nashik"],
    highRiskMonths: "June to September",
    dams: [
      { name: "Almatti Dam (backwater effect)", river: "Krishna", currentLevel: "Near Full Reservoir Level", status: "Watch" },
      { name: "Koyna Dam", river: "Koyna", currentLevel: "Normal", status: "Safe" },
    ],
    generalPrecautions: [
      "Kolhapur/Sangli flooding is often worsened by backwater from downstream dams in Karnataka — cross-state coordination matters",
      "Mumbai's Mithi river flooding is drainage-linked; avoid underpasses and low roads during heavy rain warnings",
      "Do not enter flooded basements/parking — risk of sudden water rise and electrocution",
      "Keep vehicle fuel tanks topped up during monsoon alerts for quick evacuation",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
  Punjab: {
    majorRivers: ["Sutlej", "Beas", "Ravi"],
    floodProneDistricts: ["Ferozepur", "Jalandhar", "Gurdaspur"],
    highRiskMonths: "July to September",
    dams: [
      { name: "Bhakra Dam", river: "Sutlej", currentLevel: "Normal", status: "Safe" },
      { name: "Pong Dam", river: "Beas", currentLevel: "Rising", status: "Watch" },
    ],
    generalPrecautions: [
      "Sudden dam gate openings upstream (Bhakra/Pong) are a major driver of downstream flooding — watch for official release notices",
      "Farmers should move stored grain and machinery from low-lying fields ahead of the season",
      "Embankment (bandh) breaches are a known risk — report visible cracks/seepage to local irrigation dept immediately",
      "Keep cattle sheds on elevated ground where possible",
    ],
    emergencyContacts: {
      stateFloodControlRoom: "1070",
      ndrfHelpline: "011-24363260",
      ambulance: "108",
    },
  },
};

// A short list used by the frontend's dropdown (kept in sync manually).
export const stateList = Object.keys(floodData);

// Generic fallback used when the selected state isn't in our (small) demo
// dataset yet — keeps the assistant useful instead of failing outright.
export const genericFloodGuidance = {
  majorRivers: ["Not in demo dataset yet"],
  floodProneDistricts: ["Not in demo dataset yet"],
  highRiskMonths: "Varies by region — typically the SW monsoon (June-Sept) in most of India",
  dams: [],
  generalPrecautions: [
    "Follow official IMD (weather) and CWC (river/dam levels) bulletins for your district",
    "Identify your nearest government relief shelter in advance",
    "Keep an emergency kit ready: torch, radio, medicines, dry food, drinking water, phone charger",
    "Never attempt to walk or drive through moving flood water",
  ],
  emergencyContacts: {
    stateFloodControlRoom: "1070",
    ndrfHelpline: "011-24363260",
    ambulance: "108",
  },
};
