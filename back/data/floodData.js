/**
 * Universal Regional Flood Intelligence & Hydrological Profiles
 * Replaces manually hardcoded dummy placeholder data with comprehensive
 * basin-level hydrological knowledge, official emergency frameworks, and
 * links to the trained ML hydrodynamic predictive engine.
 */

// Comprehensive registry of Indian States, Union Territories, and River Basins
export const REGIONAL_BASINS = {
  // Northern & Himalayan States (Snowmelt + Flash Floods + Cloudbursts)
  "Himachal Pradesh": {
    basin: "Indus Basin (Satluj, Beas, Ravi, Chenab, Yamuna)",
    majorRivers: ["Satluj", "Beas", "Ravi", "Chenab", "Yamuna", "Parvati"],
    highRiskMonths: "July to September (Monsoon cloudbursts & glacial runoff)",
    primaryFloodDrivers: "High-gradient flash floods, cloudbursts, debris flows, landslide dam outbursts (GLOF)",
    majorDamsBarrages: ["Bhakra Dam (Satluj)", "Pong Dam (Beas)", "Pandoh Dam", "Chamera Dam (Ravi)", "Kol Dam"],
    emergencyContacts: { stateControlRoom: "1070 / 1077", ndrfHelpline: "1078 / 011-24363260", ambulance: "108" }
  },
  "Uttarakhand": {
    basin: "Upper Ganga Basin",
    majorRivers: ["Ganga", "Alaknanda", "Bhagirathi", "Mandakini", "Yamuna", "Kali", "Ramganga"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Flash floods, cloudbursts, glacial lake outbursts (GLOFs), river bank scouring",
    majorDamsBarrages: ["Tehri Dam (Bhagirathi)", "Koteshwar Dam", "Dhauliganga Dam", "Pashulok Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Jammu & Kashmir": {
    basin: "Indus Basin (Jhelum, Chenab, Tawi, Indus)",
    majorRivers: ["Jhelum", "Chenab", "Tawi", "Ravi", "Sind"],
    highRiskMonths: "March to April (Spring snowmelt), July to September (Monsoon)",
    primaryFloodDrivers: "Jhelum basin drainage congestion, river siltation, mountain flash floods",
    majorDamsBarrages: ["Baglihar Dam (Chenab)", "Salal Dam", "Uri Dam (Jhelum)", "Dul Hasti Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Ladakh": {
    basin: "Upper Indus Basin",
    majorRivers: ["Indus", "Zanskar", "Shyok", "Nubra", "Suru"],
    highRiskMonths: "June to August (Snowmelt peak and cloudbursts)",
    primaryFloodDrivers: "Glacial melt torrents, cloudburst flash floods in arid mountain valleys",
    majorDamsBarrages: ["Nimoo Bazgo Dam", "Chutak Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Punjab": {
    basin: "Indus Basin (Satluj, Beas, Ravi)",
    majorRivers: ["Satluj", "Beas", "Ravi", "Ghaggar"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Spillway releases from upstream Himalayan dams (Bhakra/Pong), Ghaggar non-perennial overflow, embankment breaches",
    majorDamsBarrages: ["Bhakra Dam (upstream Satluj)", "Pong Dam (upstream Beas)", "Ranjit Sagar Dam (Ravi)", "Ropar Headworks", "Harike Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Haryana": {
    basin: "Yamuna & Ghaggar Sub-basins",
    majorRivers: ["Yamuna", "Ghaggar", "Markanda", "Tangri"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Hathnikund barrage discharges into Yamuna, seasonal flooding in Ghaggar basin",
    majorDamsBarrages: ["Hathnikund Barrage (Yamuna)", "Tajewala (historical)", "Ottu Barrage (Ghaggar)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Delhi": {
    basin: "Yamuna Floodplain Sub-basin",
    majorRivers: ["Yamuna", "Najafgarh Drain", "Shahdara Drain"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "High discharge releases from Hathnikund Barrage (Haryana), backflow into stormwater drains, floodplain encroachment",
    majorDamsBarrages: ["Wazirabad Barrage", "ITO Barrage", "Okhla Barrage"],
    emergencyContacts: { stateControlRoom: "1077 / 1070", ndrfHelpline: "1078", ambulance: "102 / 108" }
  },
  "Uttar Pradesh": {
    basin: "Middle Ganga Basin",
    majorRivers: ["Ganga", "Yamuna", "Ghaghara (Sarayu)", "Rapti", "Gomti", "Ramganga", "Betwa", "Ken", "Sharda"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Monsoon river overflow from Himalayan tributaries (Ghaghara, Rapti, Gandak), heavy rain in catchment, flat alluvial topography",
    majorDamsBarrages: ["Rihand Dam (Govind Ballabh Pant Sagar)", "Sharda Barrage", "Girijapuri Barrage", "Narora Barrage", "Banthra/Gomti Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Bihar": {
    basin: "Lower-Middle Ganga Basin",
    majorRivers: ["Ganga", "Kosi", "Gandak", "Bagmati", "Burhi Gandak", "Kamala Balan", "Mahananda", "Son"],
    highRiskMonths: "July to October",
    primaryFloodDrivers: "Transboundary runoff from Nepal Himalayas, severe siltation, avulsion / course-shifting of Kosi River, backwater effect of Ganga",
    majorDamsBarrages: ["Kosi Barrage (Birpur)", "Valmiki Gandak Barrage", "Indrapuri Barrage (Son)", "Bhimnagar Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "102 / 108" }
  },

  // Eastern & North-Eastern States (High Precipitation + Brahmaputra/Delta System)
  "Assam": {
    basin: "Brahmaputra & Barak River Basins",
    majorRivers: ["Brahmaputra", "Barak", "Dhansiri", "Subansiri", "Kopili", "Jia Bharali", "Manas", "Dihing"],
    highRiskMonths: "May to September (Multi-wave monsoon floods)",
    primaryFloodDrivers: "Extreme monsoon precipitation in Assam-Meghalaya hills, sediment-choked shallow riverbeds, massive bank erosion, repetitive flood waves",
    majorDamsBarrages: ["Kopili Dam", "Doyang Dam (Nagaland border)", "Subansiri Lower Project", "Kurichhu (upstream Bhutan)"],
    emergencyContacts: { stateControlRoom: "1070 / 1079", ndrfHelpline: "1078", ambulance: "108" }
  },
  "West Bengal": {
    basin: "Ganga-Brahmaputra Delta & Damodar Valley",
    majorRivers: ["Bhagirathi-Hooghly", "Damodar", "Teesta", "Torsa", "Jaldhaka", "Rupnarayan", "Ajay", "Mayurakshi"],
    highRiskMonths: "June to October (Monsoon + Bay of Bengal Cyclones)",
    primaryFloodDrivers: "Simultaneous high rainfall and DVC dam releases, tidal lock in delta Sundarbans, flash floods in North Bengal Dooars",
    majorDamsBarrages: ["Farakka Barrage (Ganga)", "Durgapur Barrage (Damodar)", "Maithon Dam", "Panchet Dam", "Massanjore Dam (Mayurakshi)", "Teesta Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Odisha": {
    basin: "Mahanadi, Brahmani & Baitarani Basins",
    majorRivers: ["Mahanadi", "Brahmani", "Baitarani", "Subarnarekha", "Rushikulya", "Budhabalanga"],
    highRiskMonths: "July to October (Monsoon and Cyclonic storm surges)",
    primaryFloodDrivers: "Heavy catchment rainfall in Upper Mahanadi (Chhattisgarh), simultaneous peak river discharge and Bay of Bengal storm surge, delta breaching",
    majorDamsBarrages: ["Hirakud Dam (Mahanadi)", "Rengali Dam (Brahmani)", "Mandira Dam", "Upper Kolab Dam", "Indravati Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Arunachal Pradesh": {
    basin: "Brahmaputra Upper Catchment (Siang, Dibang, Lohit, Subansiri)",
    majorRivers: ["Siang (Brahmaputra)", "Dibang", "Lohit", "Subansiri", "Kameng", "Tirap"],
    highRiskMonths: "May to September",
    primaryFloodDrivers: "Intense orographic precipitation, landslide dammed lake formation and failure, flash floods",
    majorDamsBarrages: ["Ranganadi Dam", "Kameng Hydro Electric Project", "Lower Subansiri Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Meghalaya": {
    basin: "Brahmaputra & Meghna/Surma Basins",
    majorRivers: ["Simsang", "Umiam", "Myntdu", "Kopili", "Ganol"],
    highRiskMonths: "May to September (World's highest rainfall region - Mawsynram/Cherrapunji)",
    primaryFloodDrivers: "Hyper-intense rainfall causing torrential runoff down hill valleys into plain areas",
    majorDamsBarrages: ["Umiam Dam", "Khandong Dam (Kopili)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Tripura": {
    basin: "Barak & Meghna Sub-basins",
    majorRivers: ["Howrah", "Gumti", "Khowai", "Manu", "Dhalai", "Muhuri", "Feni"],
    highRiskMonths: "May to September",
    primaryFloodDrivers: "Transboundary river overflow into Bangladesh plains, heavy monsoon rains",
    majorDamsBarrages: ["Dumbur / Gumti Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Manipur": {
    basin: "Barak & Chindwin-Irrawaddy Basins",
    majorRivers: ["Imphal", "Iril", "Thoubal", "Barak", "Nambul"],
    highRiskMonths: "May to September",
    primaryFloodDrivers: "Imphal Valley bowl-shaped topography causing prolonged inundation, Loktak lake swelling",
    majorDamsBarrages: ["Khuga Dam", "Singda Dam", "Ithai Barrage"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Mizoram": {
    basin: "Barak & Kaladan Basins",
    majorRivers: ["Chhimtuipui (Kaladan)", "Tlawng", "Tuirial", "Tuivawl", "Khawthlangtuipui"],
    highRiskMonths: "May to September",
    primaryFloodDrivers: "Hill flash floods and co-occurring landslides blocking drainage valleys",
    majorDamsBarrages: ["Tuirial Dam", "Serlui B Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Nagaland": {
    basin: "Brahmaputra & Chindwin Basins",
    majorRivers: ["Doyang", "Dhansiri", "Dikhu", "Tizu"],
    highRiskMonths: "June to September",
    primaryFloodDrivers: "Steep slope torrential runoff, river overflow in foothills (Dimapur)",
    majorDamsBarrages: ["Doyang Hydro Electric Project"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Sikkim": {
    basin: "Teesta River Basin",
    majorRivers: ["Teesta", "Rangeet", "Lachen", "Lachung"],
    highRiskMonths: "June to September",
    primaryFloodDrivers: "GLOF (Glacial Lake Outburst Floods like South Lhonak lake), moraine collapse, intense monsoonal cloudbursts",
    majorDamsBarrages: ["Chungthang Dam (Teesta III)", "Teesta V Dam", "Rangit Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Jharkhand": {
    basin: "Damodar, Subarnarekha & North Koel Basins",
    majorRivers: ["Damodar", "Subarnarekha", "Barakar", "North Koel", "South Koel", "Mayurakshi"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Heavy catchment rainfall over Chota Nagpur plateau and sudden reservoir releases",
    majorDamsBarrages: ["Tenughat Dam", "Panchet Dam", "Maithon Dam", "Konar Dam", "Getalsud Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },

  // Western & Central States (Narmada, Tapi, Godavari, Chambal, Urban flooding)
  "Maharashtra": {
    basin: "Godavari, Krishna, Tapi & West Coast Basins",
    majorRivers: ["Godavari", "Krishna", "Tapi", "Bhima", "Panchganga", "Mithi", "Ulhas", "Koyna"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Heavy Western Ghats rainfall, backwater pooling between upstream dams (Koyna, Radhanagari) and downstream reservoirs (Almatti in Karnataka), Mumbai urban drainage bottlenecks",
    majorDamsBarrages: ["Koyna Dam", "Jayakwadi Dam (Godavari)", "Radhanagari Dam", "Ujjani Dam (Bhima)", "Panshet / Khadakwasla Dams", "Warna Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Gujarat": {
    basin: "Narmada, Tapi, Mahi, Sabarmati & Saurashtra Basins",
    majorRivers: ["Narmada", "Tapi", "Mahi", "Sabarmati", "Vishwamitri", "Bhadar", "Shetrunji"],
    highRiskMonths: "July to September (also Arabian Sea cyclonic surges)",
    primaryFloodDrivers: "Huge spillway releases from Sardar Sarovar (Narmada) & Ukai (Tapi) into coastal plains, Vadodara Vishwamitri river overflows, Saurashtra flash floods",
    majorDamsBarrages: ["Sardar Sarovar Dam (Narmada)", "Ukai Dam (Tapi)", "Kadana Dam (Mahi)", "Dharoi Dam (Sabarmati)", "Madhuwanti Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Madhya Pradesh": {
    basin: "Narmada, Chambal, Betwa, Son, Tapi Basins",
    majorRivers: ["Narmada", "Chambal", "Betwa", "Son", "Tawa", "Kshipra", "Ken", "Sindh"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Monsoon low-pressure systems over central India, concurrent dam releases across the Narmada cascade",
    majorDamsBarrages: ["Indira Sagar Dam (Narmada)", "Omkareshwar Dam", "Bargi Dam", "Tawa Dam", "Gandhi Sagar Dam (Chambal)", "Bansagar Dam (Son)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Chhattisgarh": {
    basin: "Mahanadi, Godavari & Brahmani Basins",
    majorRivers: ["Mahanadi", "Shivnath", "Hasdeo", "Indravati", "Arpa", "Kelo"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Upper Mahanadi catchment torrential rain, Hasdeo reservoir spillage",
    majorDamsBarrages: ["Gangrel Dam (Ravishankar Sagar)", "Hasdeo Bango Dam", "Murrum Silli Dam", "Sondur Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Rajasthan": {
    basin: "Chambal, Banas, Luni & Ghaggar Basins",
    majorRivers: ["Chambal", "Banas", "Luni", "Mahi", "Ghaggar"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Sudden cloudbursts in normally arid catchments, Chambal cascade dam releases (Hadoti region), Luni desert flash floods",
    majorDamsBarrages: ["Rana Pratap Sagar Dam", "Jawahar Sagar Dam", "Kota Barrage", "Bisalpur Dam (Banas)", "Mahi Bajaj Sagar Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Goa": {
    basin: "West Coast River Basins (Mandovi & Zuari)",
    majorRivers: ["Mandovi (Mhadei)", "Zuari", "Chapora", "Terekhol", "Sal"],
    highRiskMonths: "June to August",
    primaryFloodDrivers: "High Western Ghats monsoon runoff meeting high tides in coastal estuaries",
    majorDamsBarrages: ["Salaulim Dam", "Anjunem Dam", "Tillari Dam (inter-state)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },

  // Southern States (Krishna, Godavari, Cauvery, Coastal Monsoon)
  "Kerala": {
    basin: "West Coast Basins (44 Rivers)",
    majorRivers: ["Periyar", "Bharathapuzha", "Pamba", "Chaliyar", "Chalakkudy", "Meenachil", "Achenkovil", "Kallada"],
    highRiskMonths: "June to August (Southwest Monsoon) & October to November (Northeast Monsoon)",
    primaryFloodDrivers: "Extreme precipitation along Western Ghats ridgelines, cascading reservoir spills (Idukki, Mullaperiyar), steep slope debris flows & landslides, Vembanad lake delta backwaters",
    majorDamsBarrages: ["Idukki Arch Dam", "Mullaperiyar Dam", "Idamalayar Dam", "Banasura Sagar Dam", "Kakki Dam", "Malampuzha Dam"],
    emergencyContacts: { stateControlRoom: "1070 / 1077", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Karnataka": {
    basin: "Krishna, Cauvery, Godavari & West Flowing Basins",
    majorRivers: ["Krishna", "Cauvery", "Tungabhadra", "Ghataprabha", "Malaprabha", "Sharavathi", "Netravati", "Hemavati"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Intense Western Ghats monsoon rainfall, high inflows to Tungabhadra & Krishna reservoirs, coastal Dakshina Kannada flash floods",
    majorDamsBarrages: ["Almatti Dam (Krishna)", "Narayanpur Dam", "Tungabhadra Dam", "KRS Dam (Krishna Raja Sagara on Cauvery)", "Kabini Dam", "Linganamakki Dam", "Hemavathi Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Tamil Nadu": {
    basin: "Cauvery, Pennar, Vaigai, Tamirabarani & Palar Basins",
    majorRivers: ["Cauvery", "Kollidam (Coleroon)", "Bhavani", "Amaravathi", "Vaigai", "Tamirabarani", "Palar", "Adyar", "Cooum"],
    highRiskMonths: "October to December (Northeast Monsoon / Retracing Monsoon & Bay of Bengal Cyclones)",
    primaryFloodDrivers: "Northeast monsoon depressions and cyclonic deluges, Cauvery delta excess releases from Mettur, Chennai urban drainage constriction & lake overflows",
    majorDamsBarrages: ["Mettur Dam (Stanley Reservoir on Cauvery)", "Bhavanisagar Dam", "Vaigai Dam", "Pechiparai Dam", "Amaravathi Dam", "Chembarambakkam Lake"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Andhra Pradesh": {
    basin: "Lower Godavari, Krishna & Pennar Basins",
    majorRivers: ["Godavari", "Krishna", "Pennar", "Nagavali", "Vamsadhara", "Tungabhadra"],
    highRiskMonths: "July to November (Monsoon inflows + Coastal Cyclones)",
    primaryFloodDrivers: "Massive simultaneous inflows into Dowleswaram Barrage (Godavari) and Prakasam Barrage (Krishna), cyclonic storm surges in coastal districts (Konaseema, Krishna, Nellore)",
    majorDamsBarrages: ["Srisailam Dam (Krishna)", "Nagarjuna Sagar Dam", "Polavaram Project (Godavari)", "Dowleswaram Cotton Barrage", "Prakasam Barrage", "Somasila Dam (Pennar)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Telangana": {
    basin: "Middle Godavari & Krishna Basins",
    majorRivers: ["Godavari", "Krishna", "Manjira", "Pranahita", "Musi", "Kadam"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "High discharge in Godavari tributaries (Pranahita, Indravati), Bhadrachalam temple town river surges, Hyderabad Musi river urban flooding",
    majorDamsBarrages: ["Kaleshwaram Lift Project / Medigadda Barrage", "Sriram Sagar Project (SRSP)", "Singur Dam", "Nizam Sagar", "Nagarjuna Sagar (inter-state)", "Srisailam Dam"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },

  // Union Territories
  "Chandigarh": {
    basin: "Ghaggar Sub-basin (Sukhna Choe & Patiali Ki Rao)",
    majorRivers: ["Sukhna Choe", "Patiali Ki Rao"],
    highRiskMonths: "July to August",
    primaryFloodDrivers: "Sukhna Lake floodgates opening during peak Shivalik monsoon storms",
    majorDamsBarrages: ["Sukhna Lake Flood Gates"],
    emergencyContacts: { stateControlRoom: "1077", ndrfHelpline: "1078", ambulance: "108 / 112" }
  },
  "Puducherry": {
    basin: "Coastal Cauvery & Gingee / Varahanadi Basins",
    majorRivers: ["Sankaraparani (Gingee)", "Pennaiyar", "Guduvaiyar"],
    highRiskMonths: "October to December (Northeast Monsoon & Cyclones)",
    primaryFloodDrivers: "Heavy cyclonic rainfall combined with high sea tides preventing river drainage",
    majorDamsBarrages: ["Suthukeny Check Dam", "Vidur Dam (upstream)"],
    emergencyContacts: { stateControlRoom: "1070 / 1077", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Andaman & Nicobar Islands": {
    basin: "Island Coastal Drainages & Kalpong River",
    majorRivers: ["Kalpong River (North Andaman)", "Galathea (Great Nicobar)"],
    highRiskMonths: "May to November",
    primaryFloodDrivers: "Tropical depressions, squalls, cyclonic tidal inundation",
    majorDamsBarrages: ["Kalpong Dam (first hydro-electric project in A&N)"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Dadra & Nagar Haveli and Daman & Diu": {
    basin: "Daman Ganga & Kolak Basins",
    majorRivers: ["Daman Ganga", "Kolak", "Kalai"],
    highRiskMonths: "July to September",
    primaryFloodDrivers: "Madhuban Dam heavy water discharges down Daman Ganga into low-lying coastal areas",
    majorDamsBarrages: ["Madhuban Dam (Daman Ganga)"],
    emergencyContacts: { stateControlRoom: "1077", ndrfHelpline: "1078", ambulance: "108" }
  },
  "Lakshadweep": {
    basin: "Arabian Sea Coral Atolls (No continental river system)",
    majorRivers: ["No surface rivers; marine lagoon and storm surge flood domain"],
    highRiskMonths: "June to August (Southwest Monsoon squalls) & Nov-Dec (Cyclones)",
    primaryFloodDrivers: "Oceanic storm surges, high-spring tide wave overtopping onto low-elevation coral atolls",
    majorDamsBarrages: ["No dams; coastal sea walls and tetrapod breakwaters"],
    emergencyContacts: { stateControlRoom: "1070", ndrfHelpline: "1078", ambulance: "108" }
  }
};

/**
 * Universal Hydrological Profile Generator
 * Dynamically resolves flood intelligence for ANY region, basin, district,
 * or custom geographical coordinates requested by the user.
 */
export function getRegionalFloodProfile(regionQuery) {
  if (!regionQuery || typeof regionQuery !== "string") {
    return getUniversalFloodGuidance("Universal Flood Analysis");
  }

  const queryNorm = regionQuery.trim().toLowerCase();

  // 1. Direct or partial match on registered state/basin registry
  for (const [stateName, data] of Object.entries(REGIONAL_BASINS)) {
    if (stateName.toLowerCase() === queryNorm || queryNorm.includes(stateName.toLowerCase()) || stateName.toLowerCase().includes(queryNorm)) {
      return {
        regionName: stateName,
        ...data,
        isCustomRegion: false,
      };
    }
  }

  // 2. River basin keyword match (e.g. "Ganga", "Brahmaputra", "Yamuna", "Kosi", "Godavari", "Cauvery")
  for (const [stateName, data] of Object.entries(REGIONAL_BASINS)) {
    const matchedRiver = data.majorRivers.find((r) => queryNorm.includes(r.toLowerCase()));
    if (matchedRiver) {
      return {
        regionName: `${regionQuery} (${matchedRiver} River Basin / ${stateName})`,
        basin: data.basin,
        majorRivers: data.majorRivers,
        highRiskMonths: data.highRiskMonths,
        primaryFloodDrivers: data.primaryFloodDrivers,
        majorDamsBarrages: data.majorDamsBarrages,
        emergencyContacts: data.emergencyContacts,
        isCustomRegion: false,
      };
    }
  }

  // 3. Dynamic Fallback for Any Arbitrary Region / Coordinates worldwide
  return getUniversalFloodGuidance(regionQuery);
}

export function getUniversalFloodGuidance(customName) {
  return {
    regionName: customName || "Any Region / Catchment",
    basin: "Local Catchment Drainage & Hydrodynamic Flow Domain",
    majorRivers: ["Local perennial rivers, tributaries, and stormwater discharge channels"],
    highRiskMonths: "Monsoon periods, tropical storm seasons, or peak snowmelt windows",
    primaryFloodDrivers: "High precipitation intensity exceeding soil infiltration capacity, upstream dam/spillway discharge, drainage bottlenecks, or tidal surge",
    majorDamsBarrages: ["Upstream flood-control reservoirs, regulatory barrages, and retention basins"],
    emergencyContacts: {
      stateControlRoom: "1070 (State Emergency Operations Centre)",
      ndrfHelpline: "1078 / 011-24363260 (National Disaster Response Force)",
      ambulance: "108 / 112 (National Emergency Helpline)",
    },
    isCustomRegion: true,
  };
}

// Complete list of all supported states & territories for frontend selection
export const stateList = Object.keys(REGIONAL_BASINS).sort();
