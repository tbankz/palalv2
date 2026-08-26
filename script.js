// ═══════════════════════════════════════════════
//  PALAL — PRAYER INTELLIGENCE
//  COMPLETE JAVASCRIPT — CLEAN VERSION
// ═══════════════════════════════════════════════

// ─── HELPERS ─────────────────────────────────────
const $ = id => document.getElementById(id);

function toast(m) {
  const t = $('toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function vibrate() { if (navigator.vibrate) navigator.vibrate(10); }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── STORE ──────────────────────────────────────
const STORE = 'palal_v32';
const DEFAULT_STATE = {
  theme: 'light',
  streak: 0,
  lastPrayerDate: null,
  totalSolSec: 0,
  entries: [],
  requests: [],
  circles: [],
  confBurnt: 0,
  confessions: [],
  milestones: { lastMilestone: 0 },
  modeSaved: { temptation: [], healing: [] },
  homeCity: null,
  currentCity: null,
  messiahName: 'Yeshua',
  godName: 'Yahuah',
  _guidedActive: false,
  _guidedPrayer: null,
  _guidedStep: 0
};

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE };
    const merged = { ...DEFAULT_STATE, ...parsed };
    if (!Array.isArray(merged.entries)) merged.entries = [];
    if (!Array.isArray(merged.confessions)) merged.confessions = [];
    if (!Array.isArray(merged.requests)) merged.requests = [];
    return merged;
  } catch (e) {
    console.warn('Palal: stored data was corrupted, resetting to defaults.', e);
    return { ...DEFAULT_STATE };
  }
}

let D = loadLocal();

function saveLocal() {
  try {
    localStorage.setItem(STORE, JSON.stringify(D));
    return true;
  } catch (e) {
    console.warn('Palal: could not save to localStorage.', e);
    toast('Could not save — storage unavailable');
    return false;
  }
}

// ─── THEME ──────────────────────────────────────
function applyTheme(th) {
  D.theme = th;
  document.documentElement.setAttribute('data-theme', th);
  const btn = $('themeBtn');
  if (btn) btn.textContent = th === 'dark' ? '◐' : '◑';
  saveLocal();
  renderDNA();
}

const themeBtn = $('themeBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', function() { 
    applyTheme(D.theme === 'dark' ? 'light' : 'dark'); 
  });
}

// ─── COUNTRY DATA ──────────────────────────────
const COUNTRY_PROFILES = {
  'za': { name: 'South Africa', population: 59308690, christian: 80.0, unreached: 5.0, freedomScore: 70,
    prayerPoints: ['Healing from apartheid legacy', 'Church unity', 'Youth unemployment'],
    alerts: ['Economic inequality'] },
  'gh': { name: 'Ghana', population: 31072940, christian: 71.0, unreached: 10.0, freedomScore: 75,
    prayerPoints: ['Church growth', 'Corruption', 'Education'],
    alerts: ['Political tension'] },
  'ke': { name: 'Kenya', population: 53771296, christian: 85.0, unreached: 5.0, freedomScore: 55,
    prayerPoints: ['Flood victims', 'Church planting', 'Youth evangelism'],
    alerts: ['Flood crisis'] },
  'ng': { name: 'Nigeria', population: 218541212, christian: 49.0, unreached: 10.0, freedomScore: 40,
    prayerPoints: ['Christians facing violence', 'Boko Haram victims', 'Church unity'],
    alerts: ['Conflict in north'] },
  'sd': { name: 'Sudan', population: 45996644, christian: 5.0, unreached: 85.0, freedomScore: 25,
    prayerPoints: ['Civilians in conflict', 'Famine victims', 'Church resilience'],
    alerts: ['Civil war', 'Famine risk'] },
  'ye': { name: 'Yemen', population: 29687900, christian: 0.1, unreached: 99.0, freedomScore: 15,
    prayerPoints: ['Believers in hiding', 'Famine victims', 'Children in crisis'],
    alerts: ['Civil war', 'Famine'] },
  'ht': { name: 'Haiti', population: 11447569, christian: 85.0, unreached: 3.0, freedomScore: 40,
    prayerPoints: ['Violence victims', 'Church relief work', 'Children in crisis'],
    alerts: ['Gang violence', 'Displacement'] },
  'sb': { name: 'South Sudan', population: 11193725, christian: 60.0, unreached: 30.0, freedomScore: 35,
    prayerPoints: ['Civil war victims', 'Famine survivors', 'Church peacemakers'],
    alerts: ['Famine risk', 'Civil war'] },
  'jp': { name: 'Japan', population: 125836021, christian: 1.5, unreached: 85.0, freedomScore: 80,
    prayerPoints: ['Unreached peoples', 'Aging population', 'Church planting'],
    alerts: ['Natural disaster'] },
  'kr': { name: 'South Korea', population: 51780579, christian: 29.0, unreached: 30.0, freedomScore: 80,
    prayerPoints: ['Church vitality', 'Youth faith', 'North Korea mission'],
    alerts: ['Political tensions'] },
  'id': { name: 'Indonesia', population: 273523615, christian: 10.0, unreached: 70.0, freedomScore: 50,
    prayerPoints: ['Religious minority', 'Church growth', 'Disaster relief'],
    alerts: ['Religious tensions'] },
  'in': { name: 'India', population: 1428627663, christian: 2.3, unreached: 35.0, freedomScore: 51,
    prayerPoints: ['Dalit communities', 'Church planting in north', 'Persecution in Manipur'],
    alerts: ['Manipur violence'] },
  'pk': { name: 'Pakistan', population: 231402117, christian: 1.5, unreached: 97.0, freedomScore: 28,
    prayerPoints: ['Blasphemy law victims', 'Underground church', 'Minority rights'],
    alerts: ['Blasphemy accusations'] },
  'cn': { name: 'China', population: 1412176000, christian: 4.0, unreached: 30.0, freedomScore: 20,
    prayerPoints: ['House church leaders', 'Bible shortages', 'Underground seminary'],
    alerts: ['Church closures'] },
  'fr': { name: 'France', population: 65273511, christian: 50.0, unreached: 15.0, freedomScore: 85,
    prayerPoints: ['Church decline', 'Secularism', 'Multicultural evangelism'],
    alerts: ['Cost of living crisis'] },
  'de': { name: 'Germany', population: 83783942, christian: 55.0, unreached: 15.0, freedomScore: 90,
    prayerPoints: ['Church decline', 'Refugee integration', 'Spiritual awakening'],
    alerts: ['Economic pressures'] },
  'it': { name: 'Italy', population: 60262770, christian: 75.0, unreached: 10.0, freedomScore: 85,
    prayerPoints: ['Vatican influence', 'Youth disillusionment', 'Southern Italy missions'],
    alerts: ['Migration crisis'] },
  'gb': { name: 'United Kingdom', population: 67326569, christian: 46.0, unreached: 10.0, freedomScore: 90,
    prayerPoints: ['Church decline', 'Revival in youth', 'Multicultural churches'],
    alerts: ['Cost of living crisis'] },
  'ua': { name: 'Ukraine', population: 43633801, christian: 80.0, unreached: 5.0, freedomScore: 60,
    prayerPoints: ['War victims', 'Church unity', 'Recovery and peace'],
    alerts: ['War in east'] },
  'ca': { name: 'Canada', population: 37742154, christian: 55.0, unreached: 15.0, freedomScore: 90,
    prayerPoints: ['Church decline', 'First Nations ministry', 'Multicultural outreach'],
    alerts: ['Cost of living crisis'] },
  'mx': { name: 'Mexico', population: 128932753, christian: 85.0, unreached: 5.0, freedomScore: 65,
    prayerPoints: ['Cartel violence', 'Church growth', 'Biblical training'],
    alerts: ['Cartel violence'] },
  'ar': { name: 'Argentina', population: 45195774, christian: 85.0, unreached: 5.0, freedomScore: 70,
    prayerPoints: ['Economic crisis', 'Church revival', 'Youth ministry'],
    alerts: ['Economic crisis'] },
  'us': { name: 'United States', population: 331893745, christian: 63.0, unreached: 5.0, freedomScore: 90,
    prayerPoints: ['Cultural division', 'Church unity', 'Revival in cities'],
    alerts: ['Political polarization'] },
  'br': { name: 'Brazil', population: 213993437, christian: 88.0, unreached: 2.0, freedomScore: 70,
    prayerPoints: ['Amazon missions', 'Poverty relief', 'Church growth'],
    alerts: ['Deforestation crisis'] },
  'au': { name: 'Australia', population: 25499884, christian: 45.0, unreached: 20.0, freedomScore: 90,
    prayerPoints: ['Church decline', 'Indigenous ministry', 'Refugee outreach'],
    alerts: ['Bushfires'] },
  'nz': { name: 'New Zealand', population: 4822233, christian: 40.0, unreached: 25.0, freedomScore: 90,
    prayerPoints: ['Church vitality', 'Maori ministry', 'Youth faith'],
    alerts: ['Earthquake risk'] },
  'fj': { name: 'Fiji', population: 896444, christian: 60.0, unreached: 15.0, freedomScore: 60,
    prayerPoints: ['Church growth', 'Climate change', 'Youth discipleship'],
    alerts: ['Cyclone risk'] },
};

// ─── REAL-TIME ALERTS ──────────────────────────
const ACTIVE_ALERTS = {
  'sd': { type: 'Conflict', detail: 'Civil war escalation, 10M displaced' },
  'ye': { type: 'Hunger', detail: '18.3M in crisis, famine risk' },
  'ht': { type: 'Conflict', detail: 'Gang violence, 5,000+ displaced' },
  'ps': { type: 'Hunger', detail: '1.6M food insecure, 77% population' },
  'mm': { type: 'Disaster', detail: 'Earthquake recovery, 700+ dead' },
  've': { type: 'Disaster', detail: 'Earthquake recovery, 1,400+ dead' },
  'ua': { type: 'Conflict', detail: 'War escalation, 6M displaced' },
  'ng': { type: 'Conflict', detail: 'Violence in north, church attacks' },
  'ir': { type: 'Conflict', detail: 'House church crackdowns' },
  'kp': { type: 'Restricted', detail: 'Severe persecution, prison camps' },
  'cn': { type: 'Restricted', detail: 'Church closures, underground arrests' },
};
// ─── CITY DATA ──────────────────────────────────
const CITY_DATA = [
  // ─── UNITED KINGDOM ───
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
  { name: 'Liverpool', lat: 53.4084, lng: -2.9916 },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
  { name: 'Nottingham', lat: 52.9548, lng: -1.1581 },
  { name: 'Sheffield', lat: 53.3811, lng: -1.4701 },
  { name: 'Newcastle', lat: 54.9783, lng: -1.6178 },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
  { name: 'Cardiff', lat: 51.4816, lng: -3.1791 },
  { name: 'Belfast', lat: 54.5973, lng: -5.9301 },
  { name: 'Aberdeen', lat: 57.1497, lng: -2.0943 },
  { name: 'Dundee', lat: 56.4620, lng: -2.9707 },
  { name: 'Swansea', lat: 51.6208, lng: -3.9432 },
  
  // ─── UNITED STATES ───
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
  { name: 'Austin', lat: 30.2672, lng: -97.7431 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  
  // ─── AUSTRALIA ───
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
  { name: 'Perth', lat: -31.9505, lng: 115.8605 },
  { name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
  { name: 'Canberra', lat: -35.2809, lng: 149.1300 },
  { name: 'Hobart', lat: -42.8821, lng: 147.3272 },
  { name: 'Darwin', lat: -12.4634, lng: 130.8456 },
  
  // ─── CANADA ───
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673 },
  { name: 'Calgary', lat: 51.0447, lng: -114.0719 },
  { name: 'Edmonton', lat: 53.5461, lng: -113.4938 },
  { name: 'Ottawa', lat: 45.4215, lng: -75.6972 },
  
  // ─── EUROPE ───
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Brussels', lat: 50.8503, lng: 4.3517 },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603 },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378 },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  
  // ─── ASIA ───
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Busan', lat: 35.1796, lng: 129.0756 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
  
  // ─── AFRICA ───
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Accra', lat: 5.6037, lng: -0.1870 },
  { name: 'Kigali', lat: -1.9441, lng: 30.0619 },
  
  // ─── SOUTH AMERICA ───
  { name: 'Bogota', lat: 4.7110, lng: -74.0721 },
  { name: 'Medellin', lat: 6.2442, lng: -75.5812 },
  { name: 'Cali', lat: 3.4516, lng: -76.5320 },
  { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  
  // ─── SPAIN (keep original) ───
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Seville', lat: 37.3891, lng: -5.9845 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { name: 'Malaga', lat: 36.7213, lng: -4.4214 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502 },
  { name: 'Las Palmas', lat: 28.1235, lng: -15.4363 },
  { name: 'Bilbao', lat: 43.2630, lng: -2.9350 },
  { name: 'Alicante', lat: 38.3452, lng: -0.4830 },
  { name: 'Cordoba', lat: 37.8882, lng: -4.7794 },
  { name: 'Valladolid', lat: 41.6523, lng: -4.7245 },
  { name: 'Vigo', lat: 42.2406, lng: -8.7207 },
  { name: 'Gijon', lat: 43.5357, lng: -5.6615 },
];


function getCityHeadline(cityName) {
  const headlines = [
    'Housing crisis deepens',
    'Drought threatens water supply',
    'Community leaders call for unity',
    'Young families leaving the city',
    'Elderly face isolation',
    'Peace and reconciliation needed',
    'Local economy struggling',
    'Climate change affects crops',
    'Public services under pressure',
    'Healthcare system strained',
    'Education system needs reform',
    'Refugees seeking shelter',
    'Religious freedom under threat',
    'Rising cost of living',
    'Political division in the region'
  ];
  const index = cityName.length % headlines.length;
  return headlines[index];
}

function getCityWeather() {
  const conditions = ['Clear', 'Cloudy', 'Light Rain', 'Overcast', 'Mist', 'Sunny'];
  return {
    temp: Math.floor(Math.random() * 15 + 10),
    condition: conditions[Math.floor(Math.random() * conditions.length)]
  };
}

function getPrayerCount(cityName) {
  return Math.floor(Math.random() * 400 + 50 + (cityName.length * 7));
}

// ─── COUNTRY CAPITALS ──────────────────────────
const COUNTRY_CAPITALS = {
  'za': { name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  'gh': { name: 'Accra', lat: 5.6037, lng: -0.1870 },
  'ke': { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  'ng': { name: 'Abuja', lat: 9.0765, lng: 7.3986 },
  'sd': { name: 'Khartoum', lat: 15.5007, lng: 32.5599 },
  'ye': { name: 'Sanaa', lat: 15.3694, lng: 44.1910 },
  'ht': { name: 'Port-au-Prince', lat: 18.5944, lng: -72.3074 },
  'sb': { name: 'Juba', lat: 4.8594, lng: 31.5713 },
  'jp': { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  'kr': { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  'id': { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  'in': { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  'pk': { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  'cn': { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  'fr': { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  'de': { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  'it': { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  'gb': { name: 'London', lat: 51.5074, lng: -0.1278 },
  'ua': { name: 'Kyiv', lat: 50.4501, lng: 30.5234 },
  'ca': { name: 'Ottawa', lat: 45.4215, lng: -75.6972 },
  'mx': { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  'ar': { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  'us': { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
  'br': { name: 'Brasilia', lat: -15.7939, lng: -47.8828 },
  'au': { name: 'Canberra', lat: -35.2809, lng: 149.1300 },
  'nz': { name: 'Wellington', lat: -41.2865, lng: 174.7762 },
  'fj': { name: 'Suva', lat: -18.1416, lng: 178.4419 },
};

// ─── PRAYER POINTS ──────────────────────────────
const PRAYER_POINTS = [
  { id: 1, country: 'Nigeria', lat: 9.0820, lng: 8.6753, level: 'Conflict',
    prayer: 'Pray for Christians facing violence in northern Nigeria.' },
  { id: 2, country: 'North Korea', lat: 40.3399, lng: 127.5101, level: 'Restricted',
    prayer: 'Pray for the underground church in North Korea.' },
  { id: 3, country: 'Iran', lat: 32.4279, lng: 53.6880, level: 'Conflict',
    prayer: 'Pray for Iranian believers facing arrest.' },
  { id: 4, country: 'India', lat: 20.5937, lng: 78.9629, level: 'Monitored',
    prayer: 'Pray for Christians in India facing restrictions.' },
  { id: 5, country: 'Afghanistan', lat: 33.9391, lng: 67.7100, level: 'Conflict',
    prayer: 'Pray for the handful of believers in Afghanistan.' },
  { id: 6, country: 'China', lat: 35.8617, lng: 104.1954, level: 'Restricted',
    prayer: 'Pray for Christians in China facing pressure.' },
  { id: 7, country: 'Somalia', lat: 2.0469, lng: 45.3182, level: 'Conflict',
    prayer: 'Pray for the persecuted church in Somalia.' },
  { id: 8, country: 'Egypt', lat: 26.8206, lng: 30.8025, level: 'Monitored',
    prayer: 'Pray for Coptic Christians in Egypt.' },
  { id: 9, country: 'Pakistan', lat: 30.3753, lng: 69.3451, level: 'Conflict',
    prayer: 'Pray for Christians in Pakistan facing blasphemy laws.' },
  { id: 10, country: 'Venezuela', lat: 6.4238, lng: -66.5897, level: 'Conflict',
    prayer: 'Pray for Christians in Venezuela facing hardship.' },
  { id: 11, country: 'Syria', lat: 34.8021, lng: 38.9968, level: 'Conflict',
    prayer: 'Pray for the church in Syria healing from war.' },
  { id: 12, country: 'Yemen', lat: 15.5527, lng: 48.5164, level: 'Conflict',
    prayer: 'Pray for believers in Yemen facing persecution.' },
  { id: 13, country: 'Eritrea', lat: 15.1794, lng: 39.7823, level: 'Restricted',
    prayer: 'Pray for Christians in Eritrea facing conscription.' },
  { id: 14, country: 'Turkey', lat: 38.9637, lng: 35.2433, level: 'Monitored',
    prayer: 'Pray for the growing church in Turkey.' },
  { id: 15, country: 'Myanmar', lat: 21.9162, lng: 95.9560, level: 'Conflict',
    prayer: 'Pray for Christians in Myanmar facing conflict.' },
  { id: 16, country: 'Ukraine', lat: 48.3794, lng: 31.1656, level: 'Conflict',
    prayer: 'Pray for peace in Ukraine.' },
  { id: 17, country: 'Sudan', lat: 12.8628, lng: 30.2176, level: 'Conflict',
    prayer: 'Pray for civilians caught in the Sudan conflict.' },
  { id: 18, country: 'Mali', lat: 17.5707, lng: -3.9962, level: 'Conflict',
    prayer: 'Pray for Mali facing escalating violence.' },
  { id: 19, country: 'Burkina Faso', lat: 12.2383, lng: -1.5616, level: 'Conflict',
    prayer: 'Pray for Burkina Faso facing conflict.' },
  { id: 20, country: 'DRC', lat: -4.0383, lng: 21.7587, level: 'Conflict',
    prayer: 'Pray for peace in the Democratic Republic of Congo.' },
];

// ─── MAP ─────────────────────────────────────────
let homeCity = null;
let selectedCity = null;
let mapInstance = null;
let mapInitialized = false;
let cityMarkers = [];
let mapCounts = {};
let homeLocatorMarker = null;
let tooltipTimeout = null;
let LIVE_CRISES = [];

const MARKER_CLASS_MAP = {
  'Conflict': 'conflict',
  'Restricted': 'restricted',
  'Monitored': 'monitored',
  'Disaster': 'disaster',
  'Hunger': 'hunger',
  'Displacement': 'displacement'
};

// ─── LIVE CRISIS FEED (NASA EONET) ───────────────
// Free, keyless, CORS-enabled public API for active natural-disaster events.
const EONET_CATEGORY_LEVEL = {
  wildfires: 'Disaster',
  severeStorms: 'Disaster',
  volcanoes: 'Disaster',
  earthquakes: 'Disaster',
  floods: 'Disaster',
  landslides: 'Disaster',
  seaLakeIce: 'Disaster',
  dustHaze: 'Disaster',
  drought: 'Hunger',
  manmade: 'Conflict'
};

async function loadLiveCrises() {
  const cacheKey = 'palal_crisis_cache_v1';
  const dayMs = 24 * 60 * 60 * 1000;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.fetchedAt && Date.now() - parsed.fetchedAt < dayMs) {
        return { events: parsed.events, isFresh: false };
      }
    }
  } catch (e) {}

  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40');
    if (!res.ok) throw new Error('EONET request failed: ' + res.status);
    const data = await res.json();
    const events = (data.events || [])
      .map(ev => {
        const geom = ev.geometry && ev.geometry[ev.geometry.length - 1];
        if (!geom || !geom.coordinates) return null;
        const categoryId = ev.categories && ev.categories[0] && ev.categories[0].id;
        const categoryTitle = (ev.categories && ev.categories[0] && ev.categories[0].title) || 'Event';
        return {
          id: ev.id,
          country: ev.title,
          lat: geom.coordinates[1],
          lng: geom.coordinates[0],
          level: EONET_CATEGORY_LEVEL[categoryId] || 'Monitored',
          prayer: `Pray for those affected by this ${categoryTitle.toLowerCase()}.`,
          isLive: true
        };
      })
      .filter(Boolean)
      .slice(0, 25);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), events }));
    } catch (e) {}

    return { events, isFresh: true };
  } catch (e) {
    console.warn('Palal: live crisis feed unavailable —', e.message);
    return { events: [], isFresh: false };
  }
}

function addCrisisMarker(point) {
  const markerEl = document.createElement('div');
  const count = mapCounts[point.id] || 0;
  markerEl.className = 'custom-marker ' + (MARKER_CLASS_MAP[point.level] || 'monitored') + (count > 0 ? ' has-prayers' : '');
  const marker = L.marker([point.lat, point.lng], {
    icon: L.divIcon({ html: markerEl.outerHTML, className: '', iconSize: [10, 10], iconAnchor: [5, 5] }),
    riseOnHover: true,
  }).addTo(mapInstance);

  const idArg = typeof point.id === 'number' ? point.id : `'${point.id}'`;

  marker.bindPopup(`
    <div class="map-popup-title">${point.country}</div>
    <div class="map-popup-tag alert">${point.level}${point.isLive ? ' · live' : ''}</div>
    <div class="map-popup-quote">"${point.prayer}"</div>
    <button class="map-popup-btn" onclick="prayForMapPoint(${idArg})">Pray for this</button>
    <div class="map-popup-count">${count} intercessors</div>
  `, { minWidth: 160, maxWidth: 200 });

  return marker;
}

function renderLiveCrisisMarkers() {
  if (!mapInstance) return;
  LIVE_CRISES.forEach(point => addCrisisMarker(point));
}

// ─── COUNTRY TOOLTIP ────────────────────────────
function showCountryTooltip(countryCode, markerElement) {
  const profile = COUNTRY_PROFILES[countryCode];
  if (!profile) return;

  const alert = ACTIVE_ALERTS[countryCode] || null;
  const prayerCount = D.entries.filter(e => e.city === profile.name).length;

  const tooltip = $('countryTooltip');
  $('tooltipName').textContent = profile.name;
  $('tooltipPopulation').textContent = profile.population.toLocaleString();
  $('tooltipChristian').textContent = profile.christian + '%';
  $('tooltipAlert').textContent = alert ? alert.type + ': ' + alert.detail : 'No active alerts';
  $('tooltipAlert').style.color = alert ? 'var(--ember)' : 'var(--ink-mid)';
  $('tooltipPrayerCount').textContent = prayerCount + ' prayers';

  const rect = markerElement.getBoundingClientRect();
  const tooltipWidth = 200;
  const tooltipHeight = 130;

  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  let top = rect.top - tooltipHeight - 12;

  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
  if (top < 10) top = 10;

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.transform = 'none';
  tooltip.classList.add('show');
}

function hideCountryTooltip() {
  const tooltip = $('countryTooltip');
  tooltip.classList.remove('show');
  clearTimeout(tooltipTimeout);
}

// ─── COUNTRY MODAL ──────────────────────────────
function openCountryModal(countryCode) {
  hideCountryTooltip();
  const profile = COUNTRY_PROFILES[countryCode];
  if (!profile) return;

  const modal = $('countryModal');
  $('modalName').textContent = profile.name;
  $('modalSub').textContent = 'Population: ' + profile.population.toLocaleString() + ' · Christian: ' + profile.christian + '%';

  modal.dataset.country = countryCode;
  modal.dataset.name = profile.name;

  renderModalTab('overview', countryCode);
  modal.classList.add('show');

  document.querySelectorAll('.country-modal-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === 'overview');
  });
}

function closeCountryModal() {
  $('countryModal').classList.remove('show');
}

function renderModalTab(tab, countryCode) {
  const profile = COUNTRY_PROFILES[countryCode];
  if (!profile) return;
  const body = $('modalBody');

  let html = '';

  switch (tab) {
    case 'overview':
      html = `
        <div class="section">
          <div class="section-title">Overview</div>
          <div class="stat-grid">
            <div class="stat-item"><div class="num">${profile.population.toLocaleString()}</div><div class="lbl">Population</div></div>
            <div class="stat-item"><div class="num">${profile.christian}%</div><div class="lbl">Christian</div></div>
            <div class="stat-item"><div class="num">${profile.unreached}%</div><div class="lbl">Unreached</div></div>
            <div class="stat-item"><div class="num">${profile.freedomScore}</div><div class="lbl">Freedom Score</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Country Overview</div>
          <div style="font-size:0.5rem;color:var(--ink-mid);line-height:1.6;font-weight:300;">
            ${profile.name} has a population of ${profile.population.toLocaleString()} with approximately ${profile.christian}% Christian.
            ${profile.unreached > 30 ? 'A significant portion of the population remains unreached with the Gospel.' : 'The Church is present and growing.'}
            Freedom score: ${profile.freedomScore}/100.
          </div>
        </div>
        ${ACTIVE_ALERTS[countryCode] ? `
          <div class="section">
            <div class="section-title">Active Alerts</div>
            <div style="padding:0.5rem;background:var(--ember-dim);border-radius:8px;border:0.5px solid var(--ember);font-size:0.4375rem;color:var(--ember);">
              ${ACTIVE_ALERTS[countryCode].type}: ${ACTIVE_ALERTS[countryCode].detail}
            </div>
          </div>
        ` : ''}
      `;
      break;

    case 'prayer':
      html = `
        <div class="section">
          <div class="section-title">Prayer Points</div>
          ${profile.prayerPoints.map(p => `
            <div class="prayer-point">${p}</div>
          `).join('')}
        </div>
        <div class="section">
          <div class="section-title">Testimonies</div>
          ${D.entries.filter(e => e.city === profile.name && e.testimony).slice(0, 3).map(e => `
            <div class="testimony">"${e.testimony}"<div class="from">— ${e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'recent'}</div></div>
          `).join('') || '<div style="font-size:0.4375rem;color:var(--ink-mid);opacity:0.4;font-weight:300;">No testimonies yet. Be the first to share.</div>'}
        </div>
      `;
      break;

    case 'community':
      const countryEntries = D.entries.filter(e => e.city === profile.name);
      html = `
        <div class="section">
          <div class="section-title">Community Prayers</div>
          ${countryEntries.length === 0 ? '<div style="font-size:0.4375rem;color:var(--ink-mid);opacity:0.4;font-weight:300;">No prayers recorded for this country yet.</div>' :
          countryEntries.slice(0, 10).map(e => `
            <div class="prayer-point">
              "${e.text}"
              <span class="cite">${e.mode} · ${e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'recent'}${e.answered ? ' · answered' : ''}</span>
              ${e.testimony ? `<div class="testimony" style="margin-top:0.25rem;">"${e.testimony}"</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      break;

    case 'alerts':
      const activeAlerts = Object.entries(ACTIVE_ALERTS).filter(([code]) => code === countryCode);
      html = `
        <div class="section">
          <div class="section-title">Active Alerts</div>
          ${activeAlerts.length === 0 ? '<div style="font-size:0.4375rem;color:var(--ink-mid);opacity:0.4;font-weight:300;">No active alerts for this country.</div>' :
          activeAlerts.map(([code, alert]) => `
            <div style="padding:0.5rem;background:var(--card);border:0.5px solid var(--gold-line);border-radius:8px;margin-bottom:0.375rem;">
              <div style="font-size:0.5rem;color:var(--ember);font-weight:400;">${alert.type}</div>
              <div style="font-size:0.4375rem;color:var(--ink-mid);font-weight:300;">${alert.detail}</div>
            </div>
          `).join('')}
        </div>
      `;
      break;
  }

  body.innerHTML = html;
}

// ─── MODAL TAB SWITCHING ────────────────────────
document.querySelectorAll('.country-modal-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const modal = $('countryModal');
    const countryCode = modal.dataset.country;
    document.querySelectorAll('.country-modal-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    renderModalTab(this.dataset.tab, countryCode);
  });
});

const modalClose = $('countryModalClose');
if (modalClose) modalClose.addEventListener('click', closeCountryModal);

const countryModal = $('countryModal');
if (countryModal) {
  countryModal.addEventListener('click', function(e) {
    if (e.target === this) closeCountryModal();
  });
}

const modalPrayBtn = $('modalPrayBtn');
if (modalPrayBtn) {
  modalPrayBtn.addEventListener('click', function() {
    const modal = $('countryModal');
    const name = modal.dataset.name;
    if (!name) return;
    closeCountryModal();

    const city = { name: name, weather: getCityWeather(), headline: getCityHeadline(name) };
    selectedCity = city;
    D.currentCity = city;

    const verseText = $('verseText');
    const verseRef = $('verseRef');
    const cityContext = $('cityContext');
    if (verseText) verseText.textContent = '"Pray for ' + name + ', for ' + city.headline.toLowerCase() + '."';
    if (verseRef) verseRef.textContent = name;
    if (cityContext) cityContext.textContent = name + ' · ' + city.weather.temp + '° ' + city.weather.condition;

    const mapPanel = $('mapPanel');
    const stageAxis = $('stageAxis');
    if (mapPanel) mapPanel.classList.add('hidden');
    if (stageAxis) stageAxis.classList.remove('hidden');

    toast('Praying for ' + name);

    D.currentCity = { name, weather: city.weather, headline: city.headline };
    saveLocal();

    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navPray = $('navPray');
    if (navPray) navPray.classList.add('active');

    setTimeout(() => {
      const mainInput = $('mainInput');
      if (mainInput) mainInput.focus();
    }, 300);
  });
}

// ─── REQUESTS ────────────────────────────────────
function renderRequests() {
  const container = $('requestsContent');
  if (!container) return;

  if (!D.requests || D.requests.length === 0) {
    container.innerHTML = `
      <div class="requests-empty">No prayer requests yet.<br>Share one below.</div>
      <div class="request-input-row">
        <input type="text" id="newRequestInput" placeholder="Share a prayer request…" maxlength="200">
        <button onclick="submitRequest()">Submit</button>
      </div>
    `;
    return;
  }

  let html = '';
  D.requests.forEach((item, index) => {
    const safeText = escapeHtml(item.request);
    const safeName = escapeHtml(item.name || 'Anonymous');
    const safeTime = escapeHtml(item.time || 'Just now');
    html += `
      <div class="request-item">
        <div class="request-text">"${safeText}"</div>
        <div class="request-meta">
          <span>${safeName}</span>
          <span>${safeTime}</span>
          <span class="count">${item.prayers || 0} prayers</span>
          <button class="request-pray-btn" onclick="prayForRequest(${index})">Pray</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="request-input-row">
      <input type="text" id="newRequestInput" placeholder="Share a prayer request…" maxlength="200">
      <button onclick="submitRequest()">Submit</button>
    </div>
  `;

  container.innerHTML = html;
}

window.submitRequest = function() {
  const input = document.getElementById('newRequestInput');
  if (!input || !input.value.trim()) {
    toast('Write a prayer request');
    return;
  }

  if (!D.requests) D.requests = [];
  D.requests.unshift({
    name: 'You',
    request: input.value.trim(),
    time: 'Just now',
    prayers: 0,
    timestamp: new Date().toISOString()
  });

  input.value = '';
  saveLocal();
  renderRequests();
  toast('Prayer request submitted');
  vibrate();
};

window.prayForRequest = function(index) {
  if (!D.requests || !D.requests[index]) return;

  const request = D.requests[index];
  request.prayers = (request.prayers || 0) + 1;

  D.entries.unshift({
    id: Date.now(),
    text: 'Prayed for request: ' + request.request.slice(0, 60),
    mode: 'intercession',
    city: 'Request',
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: ['request'],
    isRequestPrayer: true
  });

  updateStreak();
  saveLocal();
  renderRequests();
  renderDNA();

  toast('Prayed for this request');
  vibrate();
};

// ─── DNA ─────────────────────────────────────────
const DNA_SUGGESTED_THEMES = ['healing', 'family', 'work', 'strength', 'trust', 'hope', 'rest', 'peace', 'grace', 'comfort'];
let dnaSearchQuery = '';
let dnaModeFilter = 'all';

function renderDNA() {
  const listEl = $('dnaList');
  const metricsEl = $('dnaMetrics');
  if (!listEl || !metricsEl) return;

  const total = D.entries.length;
  const answered = D.entries.filter(e => e.answered).length;
  const themed = D.entries.filter(e => e.theme).length;
  const sol = D.totalSolSec || 0;
  const streak = D.streak || 0;

  let identity = 'Pilgrim';
  if (streak >= 30 && total >= 100) identity = 'Watchman';
  else if (streak >= 14 && total >= 50) identity = 'Keeper';
  else if (streak >= 7 && total >= 20) identity = 'Intercessor';
  else if (streak >= 3 && total >= 10) identity = 'Scribe';
  else if (total >= 5) identity = 'Seeker';

  const identityLabel = $('identityLabel');
  const streakLabel = $('streakLabel');
  if (identityLabel) identityLabel.textContent = identity;
  if (streakLabel) streakLabel.textContent = '· ' + streak;

  metricsEl.innerHTML = [
    { v: total, l: 'Prayers' },
    { v: answered, l: 'Answered' },
    { v: themed, l: 'Themed' },
    { v: Math.floor(sol / 60) + 'm', l: 'In Prayer' },
    { v: streak, l: 'Streak' }
  ].map(m => `<div class="dna-metric"><span class="value">${m.v}</span><span class="label">${m.l}</span></div>`).join('');

  renderDnaTodayStrip();
  renderDnaThemeBars();

  if (total === 0) {
    listEl.innerHTML = `<div class="dna-empty">Start praying to see your DNA.</div>`;
    return;
  }

  const q = dnaSearchQuery.trim().toLowerCase();
  const modeFiltered = dnaModeFilter === 'all' ? D.entries : D.entries.filter(e => e.mode === dnaModeFilter);
  const searchFiltered = q
    ? modeFiltered.filter(e => e.text.toLowerCase().includes(q) || (e.theme && e.theme.toLowerCase().includes(q)))
    : modeFiltered;

  if (!searchFiltered.length) {
    listEl.innerHTML = `<div class="dna-empty">${q ? 'No prayers match "' + escapeHtml(dnaSearchQuery) + '"' : 'No prayers in this filter yet'}</div>`;
    return;
  }

  const displayEntries = searchFiltered.slice(0, 15);
  let listHTML = '';

  displayEntries.forEach((entry) => {
    const id = entry.id;
    const modeEmoji = {
      petition: '◈', confession: '◐', thanksgiving: '✧',
      intercession: '✦', lament: '◌', adoration: '◉'
    }[entry.mode] || '◈';

    const cityText = entry.city && entry.city !== 'Global' ? entry.city : '';
    const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '';
    const safeText = escapeHtml(entry.text.length > 70 ? entry.text.slice(0, 70) + '…' : entry.text);
    const safeMode = escapeHtml(entry.mode);
    const safeCity = escapeHtml(cityText);
    const safeTheme = entry.theme ? escapeHtml(entry.theme) : '';

    listHTML += `
      <div class="dna-entry" id="dnaEntry_${id}" onclick="openDnaDetail(${id})">
        <div class="dna-entry-content">
          <div class="dna-text">"${safeText}"</div>
          <div class="dna-meta">
            <span class="mode-badge">${modeEmoji} ${safeMode}</span>
            ${entry.answered ? '<span class="answered-badge">Answered</span>' : ''}
            <span class="city-tag">${safeCity ? '· ' + safeCity : ''}</span>
            ${safeTheme ? `<span class="theme-chip">⬡ ${safeTheme}</span>` : ''}
            <span style="opacity:0.4;">${date}</span>
          </div>
        </div>
        <div class="click-indicator">›</div>
      </div>
    `;
  });

  if (searchFiltered.length > 15) {
    listHTML += `<div style="font-size:0.375rem;color:var(--ink-mid);opacity:0.3;text-align:center;padding-top:0.5rem;">+ ${searchFiltered.length - 15} more prayers</div>`;
  }

  listEl.innerHTML = listHTML;
}

function renderDnaThemeBars() {
  const el = $('dnaThemeBars');
  if (!el) return;
  const counts = {};
  D.entries.forEach(e => { if (e.theme) counts[e.theme] = (counts[e.theme] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) {
    el.innerHTML = `<div class="no-conn" style="text-align:center;">No themes yet</div>`;
    return;
  }
  const max = top[0][1];
  el.innerHTML = top.map(([theme, count]) =>
    `<div class="theme-bar-item"><span class="theme-name">${escapeHtml(theme)}</span><div class="theme-bar-container"><div class="theme-bar-fill" style="width:${(count / max) * 100}%"></div></div><span class="theme-count">${count}</span></div>`
  ).join('');
}

// ─── DNA DETAIL MODAL ────────────────────────────
let dnaDetailId = null;
let dnaDetailPendingAnswered = false;

window.openDnaDetail = function(id) {
  const entry = D.entries.find(e => e.id === id);
  if (!entry) return;
  dnaDetailId = id;
  dnaDetailPendingAnswered = !!entry.answered;

  const cityText = entry.city && entry.city !== 'Global' ? entry.city : '';
  const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '';

  const textEl = $('dnaDetailText');
  const metaEl = $('dnaDetailMeta');
  const themeEl = $('dnaDetailTheme');
  const testimonyEl = $('dnaDetailTestimony');
  const themeList = $('dnaDetailThemeList');

  if (textEl) textEl.textContent = '"' + entry.text + '"';
  if (metaEl) metaEl.textContent = [date, entry.mode, cityText].filter(Boolean).join(' · ');
  if (themeEl) themeEl.value = entry.theme || '';
  if (testimonyEl) testimonyEl.value = entry.testimony || '';
  if (themeList) themeList.innerHTML = DNA_SUGGESTED_THEMES.map(t => `<option value="${t}">`).join('');

  updateDnaDetailAnsweredUI(dnaDetailPendingAnswered);
  renderDnaDetailConnections(entry);

  const modal = $('dnaDetailModal');
  if (modal) modal.classList.add('open');
};

window.closeDnaDetail = function() {
  const modal = $('dnaDetailModal');
  if (modal) modal.classList.remove('open');
  dnaDetailId = null;
};

function updateDnaDetailAnsweredUI(answered) {
  const dot = $('dnaDetailAnsweredDot');
  const label = $('dnaDetailAnsweredLabel');
  if (dot) dot.classList.toggle('lit', !!answered);
  if (label) label.textContent = answered ? 'Answered' : 'Mark answered';
}

function renderDnaDetailConnections(entry) {
  const el = $('dnaDetailConnections');
  if (!el) return;
  if (!entry.theme) {
    el.innerHTML = `<div class="no-conn">Assign a theme to reveal connections</div>`;
    return;
  }
  const matches = D.entries.filter(o => o.id !== entry.id && o.theme && o.theme.toLowerCase() === entry.theme.toLowerCase());
  if (!matches.length) {
    el.innerHTML = `<div class="no-conn">No other prayers share this theme yet</div>`;
    return;
  }
  el.innerHTML = `<div class="conn-label">Resonant prayers · "${escapeHtml(entry.theme)}"</div>` +
    matches.map(m => `<div class="conn-item" onclick="openDnaDetail(${m.id})"><div class="conn-text">"${escapeHtml(m.text.length > 60 ? m.text.slice(0, 57) + '…' : m.text)}"</div><div class="conn-sub">${escapeHtml(m.mode)} · ${m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ''}${m.answered ? ' · answered' : ''}</div></div>`).join('');
}

function renderDnaTodayStrip() {
  const strip = $('todayStrip');
  if (!strip) return;
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = D.entries.filter(e => e.timestamp && e.timestamp.split('T')[0] === today);
  if (!todayEntries.length) {
    strip.innerHTML = `<div class="today-strip-empty">no prayers yet today</div>`;
    return;
  }
  const counts = { petition: 0, lament: 0, thanksgiving: 0, adoration: 0, confession: 0, intercession: 0 };
  todayEntries.forEach(e => { if (counts[e.mode] !== undefined) counts[e.mode]++; });
  strip.innerHTML = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<div class="today-pill"><span class="today-pill-count">${v}</span>${escapeHtml(k)}</div>`)
    .join('');
}

// ─── DNA INTERACTIONS ────────────────────────────
window.deleteEntry = function(id) {
  const idx = D.entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  if (!confirm('Delete this prayer?')) return;
  D.entries.splice(idx, 1);
  saveLocal();
  renderDNA();
  toast('✕ Prayer deleted');
};

window.prayEntryAgain = function(id) {
  const entry = D.entries.find(e => e.id === id);
  if (!entry) return;
  entry.repeatCount = (entry.repeatCount || 0) + 1;
  saveLocal();
  renderDNA();
  toast('Prayed again · ' + (entry.repeatCount + 1) + 'x total');
};

// ─── MAP ─────────────────────────────────────────
async function resolveUserRegion(lat, lng) {
  const cacheKey = 'palal_region_' + Math.round(lat * 10) + '_' + Math.round(lng * 10);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Reverse geocode failed: ' + res.status);
    const data = await res.json();
    const addr = data.address || {};
    const countryCode = (addr.country_code || '').toLowerCase();
    const cityName = addr.city || addr.town || addr.village || addr.county || addr.state || null;
    const result = { countryCode, cityName, countryName: addr.country || null };
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
    return result;
  } catch (e) {
    console.warn('Palal: reverse geocode failed, showing world view instead.', e);
    return null;
  }
}

function showRegionWelcome(region) {
  if (!region) return;
  const profile = COUNTRY_PROFILES[region.countryCode];
  const capital = COUNTRY_CAPITALS[region.countryCode];
  const card = document.getElementById('regionWelcomeCard');
  if (!card) return;

  const placeLabel = region.cityName || (capital ? capital.name : region.countryName || 'your region');
  const nameEl = document.getElementById('regionWelcomeName');
  const factEl = document.getElementById('regionWelcomeFact');
  const statsEl = document.getElementById('regionWelcomeStats');
  const btn = document.getElementById('regionWelcomePrayBtn');

  if (nameEl) nameEl.textContent = placeLabel;

  if (profile) {
    if (factEl) factEl.textContent = profile.prayerPoints[0];
    if (statsEl) {
      const popDisplay = profile.population >= 1000000
        ? (profile.population / 1000000).toFixed(1) + 'M'
        : profile.population.toLocaleString();
      statsEl.innerHTML = `
        <span class="region-welcome-stat"><span class="k">Population</span><span class="v">${popDisplay}</span></span>
        <span class="region-welcome-stat"><span class="k">Christian</span><span class="v">${profile.christian}%</span></span>
      `;
    }
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.onclick = () => { hideRegionWelcome(); prayForCountry(region.countryCode); };
    }
  } else {
    if (factEl) factEl.textContent = 'No profile data yet for this region — but you can still pray for it.';
    if (statsEl) statsEl.innerHTML = '';
    if (btn) btn.style.display = 'none';
  }

  card.classList.add('show');
}

function hideRegionWelcome() {
  const card = document.getElementById('regionWelcomeCard');
  if (card) card.classList.remove('show');
}

// ─── MAP INCENSE FEED ────────────────────────────
let mapIncensePointer = 0;
let mapIncenseInterval = null;

function getMapIncensePool() {
  const pool = PRAYER_POINTS.slice();
  if (typeof LIVE_CRISES !== 'undefined' && LIVE_CRISES.length) pool.push(...LIVE_CRISES);
  return pool;
}

function manifestNextMapIncense() {
  const pool = getMapIncensePool();
  if (!pool.length) return;
  const smokeEl = document.getElementById('mapIncenseSmoke');
  const textEl = document.getElementById('mapIncenseText');
  const joinBtn = document.getElementById('mapIncenseJoinBtn');
  if (!smokeEl || !textEl) return;

  smokeEl.classList.add('dissolve');
  setTimeout(function() {
    const point = pool[mapIncensePointer % pool.length];
    mapIncensePointer++;
    textEl.textContent = point.country + ': ' + point.prayer;
    if (joinBtn) joinBtn.onclick = function() { prayForMapPoint(point.id); };
    smokeEl.classList.remove('dissolve');
    smokeEl.classList.add('active');
  }, 800);
}

function initMapIncenseFeed() {
  manifestNextMapIncense();
  if (mapIncenseInterval) clearInterval(mapIncenseInterval);
  mapIncenseInterval = setInterval(manifestNextMapIncense, 7000);
}

function initMap() {
  const container = $('mapContainer');
  if (!container) return;
  if (mapInstance) { mapInstance.remove();
    mapInstance = null; }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  mapInstance = L.map(container, {
    center: [20, 0],
    zoom: 2,
    zoomControl: false,
    fadeAnimation: true,
    attributionControl: false,
    scrollWheelZoom: true,
    touchZoom: true,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const tileUrl = isDark ?
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  L.tileLayer(tileUrl, {
    maxZoom: 6,
    minZoom: 1,
    attribution: '',
    subdomains: isDark ? 'abcd' : 'abc',
  }).addTo(mapInstance);

  try {
    const saved = localStorage.getItem('palal_map_counts');
    if (saved) mapCounts = JSON.parse(saved);
  } catch (e) {}

  // Country markers
  Object.entries(COUNTRY_CAPITALS).forEach(([code, capital]) => {
    const profile = COUNTRY_PROFILES[code];
    if (!profile) return;
    const alert = ACTIVE_ALERTS[code] || null;
    const prayerCount = D.entries.filter(e => e.city === profile.name).length;

    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker ' + (alert ? 'conflict' : 'monitored') + (prayerCount > 0 ? ' has-prayers' : '');
    const marker = L.marker([capital.lat, capital.lng], {
      icon: L.divIcon({ html: markerEl.outerHTML, className: '', iconSize: [10, 10], iconAnchor: [5, 5] }),
      riseOnHover: true,
    }).addTo(mapInstance);

    marker.on('add', function() {
      this._icon._countryCode = code;
    });

    marker.on('mouseover', function(e) {
      const icon = this._icon;
      if (icon) {
        showCountryTooltip(code, icon);
      }
    });

    marker.on('mouseout', function() {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(hideCountryTooltip, 300);
    });

    marker.on('click', function() {
      openCountryModal(code);
    });

    marker.bindPopup(`
      <div class="map-popup-title">${profile.name}</div>
      <div class="map-popup-tag ${alert ? 'alert' : 'neutral'}">${alert ? alert.type : 'No active alerts'}</div>
      <div class="map-popup-meta">${profile.population.toLocaleString()} · ${profile.christian}% Christian</div>
      <button class="map-popup-btn" onclick="openCountryModal('${code}')">View full profile</button>
      <button class="map-popup-btn secondary" onclick="prayForCountry('${code}')">Pray for this country</button>
      <div class="map-popup-count">${prayerCount} prayers</div>
    `, { minWidth: 160, maxWidth: 200 });
  });

  // Prayer point markers
  PRAYER_POINTS.forEach(point => addCrisisMarker(point));

  // Live crisis markers (NASA EONET — refreshed daily, cached in localStorage)
  loadLiveCrises().then(function(result) {
    LIVE_CRISES = result.events;
    renderLiveCrisisMarkers();
    if (result.isFresh && result.events.length > 0) {
      toast('🌍 New: ' + result.events[0].country + ' — pray for those affected');
    }
  });

  // City markers
  cityMarkers = [];

  if (D.homeCity) {
    homeCity = D.homeCity;
  }

  CITY_DATA.forEach(function(city) {
    const isHome = homeCity && homeCity.name === city.name;
    const marker = L.circleMarker([city.lat, city.lng], {
      radius: isHome ? 6 : 4,
      color: '#C5B49E',
      weight: 0.5,
      opacity: isHome ? 0.8 : 0.3,
      fillColor: '#C5B49E',
      fillOpacity: isHome ? 0.4 : 0.12,
      className: 'city-marker' + (isHome ? ' home' : '')
    }).addTo(mapInstance);

    cityMarkers.push({ marker, city });

    marker.on('click', function() {
      showCityOverlay(city);
      mapInstance.setView([city.lat, city.lng], 10);
    });

    marker.on('dblclick', function() {
      setHomeCity(city);
    });
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      let nearest = null;
      let nearestDist = Infinity;
      CITY_DATA.forEach(function(city) {
        const dist = Math.sqrt(
          Math.pow(city.lat - pos.coords.latitude, 2) +
          Math.pow(city.lng - pos.coords.longitude, 2)
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = city;
        }
      });

      // Only claim a "home" pin the first time — a returning user's chosen
      // home city (or previously auto-detected one) is left alone.
      if (!homeCity && nearest) {
        homeCity = nearest;
        D.homeCity = nearest;
        saveLocal();
      }

      setTimeout(function() {
        // Fly to the user's actual live coordinates, not just the nearest
        // predefined city, so this reflects where they really are right now.
        mapInstance.flyTo([pos.coords.latitude, pos.coords.longitude], 9, { duration: 1.4 });
        if (homeCity) showCityOverlay(homeCity);
        updateHomeMarkers();
        resolveUserRegion(pos.coords.latitude, pos.coords.longitude).then(showRegionWelcome);
      }, 1000);
    }, function() {
      if (homeCity) {
        mapInstance.setView([homeCity.lat, homeCity.lng], 10);
      } else {
        mapInstance.setView([20, 0], 2);
      }
      toast('Enable location to see facts about where you are');
    });
  } else if (homeCity) {
    setTimeout(function() {
      mapInstance.setView([homeCity.lat, homeCity.lng], 10);
      showCityOverlay(homeCity);
      updateHomeMarkers();
    }, 800);
  }

  mapInstance.on('click', function() {
    hideCityOverlay();
    hideCountryTooltip();
  });

  setTimeout(function() { mapInstance.invalidateSize(); }, 500);
  mapInitialized = true;
}

// ─── PRAY FOR COUNTRY ────────────────────────────
window.prayForCountry = function(countryCode) {
  const profile = COUNTRY_PROFILES[countryCode];
  if (!profile) return;

  const entry = {
    id: Date.now(),
    text: 'Prayed for: ' + profile.name,
    mode: 'intercession',
    city: profile.name,
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: ['intercession', 'country'],
    location: profile.name
  };

  D.entries.unshift(entry);
  updateStreak();
  saveLocal();
  renderDNA();

  toast('Prayed for ' + profile.name);
  vibrate();

  D.currentCity = { name: profile.name, weather: getCityWeather(), headline: profile.prayerPoints[0] };
  selectedCity = { name: profile.name };

  const verseText = $('verseText');
  const verseRef = $('verseRef');
  const cityContext = $('cityContext');
  if (verseText) verseText.textContent = '"' + profile.prayerPoints[0] + '"';
  if (verseRef) verseRef.textContent = profile.name;
  if (cityContext) cityContext.textContent = profile.name;

  const mapPanel = $('mapPanel');
  const stageAxis = $('stageAxis');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');

  const dnaPanel = $('dnaPanel');
  if (dnaPanel && dnaPanel.classList.contains('open')) {
    dnaPanel.classList.remove('open');
  }

  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navPray = $('navPray');
  if (navPray) navPray.classList.add('active');

  setTimeout(() => {
    const mainInput = $('mainInput');
    if (mainInput) mainInput.focus();
  }, 300);

  enterSanctuary('intercession');
};

// ─── CITY FUNCTIONS ─────────────────────────────
function updateHomeLocatorPulse() {
  if (!mapInstance || !homeCity) return;
  if (homeLocatorMarker) {
    mapInstance.removeLayer(homeLocatorMarker);
    homeLocatorMarker = null;
  }
  const icon = L.divIcon({
    html: '<div class="home-locator-pulse"><span class="pulse-ring"></span><span class="pulse-ring delay"></span><span class="pulse-core"></span></div>',
    className: '',
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
  homeLocatorMarker = L.marker([homeCity.lat, homeCity.lng], {
    icon: icon,
    interactive: false,
    zIndexOffset: -100
  }).addTo(mapInstance);
}

function updateHomeMarkers() {
  cityMarkers.forEach(function(item) {
    const isHome = homeCity && homeCity.name === item.city.name;
    item.marker.setRadius(isHome ? 6 : 4);
    item.marker.setStyle({
      opacity: isHome ? 0.8 : 0.3,
      fillOpacity: isHome ? 0.4 : 0.12,
      className: 'city-marker' + (isHome ? ' home' : '')
    });
  });
  if (selectedCity) {
    const homeBadge = $('cityHomeBadge');
    if (homeCity && homeCity.name === selectedCity.name) {
      homeBadge.textContent = 'home';
    } else {
      homeBadge.textContent = '';
    }
  }
  updateHomeLocatorPulse();
}

function setHomeCity(city) {
  homeCity = city;
  D.homeCity = city;
  saveLocal();
  updateHomeMarkers();
  toast(city.name + ' set as home');
  showCityOverlay(city);
  if (mapInstance) {
    mapInstance.setView([city.lat, city.lng], 10);
  }
}

function showCityOverlay(city) {
  const weather = getCityWeather();
  const headline = getCityHeadline(city.name);
  const prayerCount = getPrayerCount(city.name);

  const cityName = $('cityName');
  const cityTemp = $('cityTemp');
  const cityWeather = $('cityWeather');
  const cityHeadline = $('cityHeadline');
  const cityMeta = $('cityMeta');
  const homeBadge = $('cityHomeBadge');

  if (cityName) cityName.textContent = city.name;
  if (cityTemp) cityTemp.textContent = weather.temp + '°';
  if (cityWeather) cityWeather.textContent = weather.condition;
  if (cityHeadline) cityHeadline.textContent = '"' + headline + '"';
  if (cityMeta) cityMeta.textContent = prayerCount + ' prayers · ' + Math.floor(prayerCount / 20) + ' intercessors';

  if (homeCity && homeCity.name === city.name) {
    if (homeBadge) homeBadge.textContent = 'home';
  } else {
    if (homeBadge) homeBadge.textContent = '';
  }

  selectedCity = city;
  D.currentCity = { name: city.name, weather, headline, prayerCount };

  const overlay = $('cityOverlay');
  if (overlay) {
    overlay.classList.add('show');
    overlay.onclick = function(e) {
      if (e.target.closest('.city-close-overlay')) return;
      enterPrayerWithCity();
    };
  }
}

function hideCityOverlay() {
  const overlay = $('cityOverlay');
  if (overlay) overlay.classList.remove('show');
}

const closeOverlayBtn = $('closeOverlayBtn');
if (closeOverlayBtn) {
  closeOverlayBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    hideCityOverlay();
  });
}

const regionWelcomeClose = document.getElementById('regionWelcomeClose');
if (regionWelcomeClose) regionWelcomeClose.addEventListener('click', hideRegionWelcome);

function enterPrayerWithCity() {
  if (!selectedCity && !D.currentCity) return;

  const city = selectedCity || D.currentCity;
  const name = city.name || 'Your City';
  const weather = city.weather || getCityWeather();
  const headline = city.headline || getCityHeadline(name);

  const verseText = $('verseText');
  const verseRef = $('verseRef');
  const cityContext = $('cityContext');
  if (verseText) verseText.textContent = '"Pray for ' + name + ', for ' + headline.toLowerCase() + '."';
  if (verseRef) verseRef.textContent = name;
  if (cityContext) cityContext.textContent = name + ' · ' + weather.temp + '° ' + weather.condition;

  const mapPanel = $('mapPanel');
  const stageAxis = $('stageAxis');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');

  hideCityOverlay();

  toast('Praying for ' + name);

  D.currentCity = { name, weather, headline };
  saveLocal();

  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navPray = $('navPray');
  if (navPray) navPray.classList.add('active');

  setTimeout(() => {
    const mainInput = $('mainInput');
    if (mainInput) mainInput.focus();
  }, 300);
}

function exitPrayerToMap() {
  const mapPanel = $('mapPanel');
  const stageAxis = $('stageAxis');
  if (mapPanel) mapPanel.classList.remove('hidden');
  if (stageAxis) stageAxis.classList.add('hidden');
  if (mapInstance) {
    setTimeout(function() { mapInstance.invalidateSize(); }, 300);
    if (!selectedCity) {
      mapInstance.setView([20, 0], 2);
    }
  }
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navWorld = $('navWorld');
  if (navWorld) navWorld.classList.add('active');
}

// ─── PRAYER MODES ───────────────────────────────
const MODES = [
  { name: 'petition', symbol: '◈', verse: '"Ask, and it will be given to you."', ref: 'Matthew 7:7',
    placeholder: 'lay it down…' },
  { name: 'confession', symbol: '◐', verse: '"If we confess our sins, he is faithful and just to forgive us."',
    ref: '1 John 1:9', placeholder: 'whisper your confession…' },
  { name: 'thanksgiving', symbol: '✧', verse: '"Give thanks in all circumstances."', ref: '1 Thessalonians 5:18',
    placeholder: 'give thanks…' },
  { name: 'intercession', symbol: '✦', verse: '"Pray for one another."', ref: 'James 5:16',
    placeholder: 'pray for others…' },
  { name: 'lament', symbol: '◌', verse: '"Out of the depths I cry to you, Lord."', ref: 'Psalm 130:1',
    placeholder: 'cry out…' }
];

let currentModeIndex = 0;
let isHolding = false;
let isSanctuaryActive = false;
let sanctuaryTimer = 0;
let sanctuaryInterval = null;
let progressRing = $('progressRing');
let progressValue = 0;
let progressInterval = null;

function buildModeTrack() {
  const track = $('modeTrack');
  if (!track) return;
  track.innerHTML = MODES.map(m => `<div class="mode-item"><span class="symbol">${m.symbol}</span>${m.name}</div>`).join('');
}

// ─── LIVE SCRIPTURE (bible-api.com) ─────────────
const MODE_VERSE_REFS = {
  petition: ['Matthew 7:7', 'Mark 11:24', 'Philippians 4:6', '1 John 5:14', 'Psalm 37:4'],
  confession: ['1 John 1:9', 'Psalm 51:10', 'Proverbs 28:13', 'Psalm 51:1', 'Psalm 32:5'],
  thanksgiving: ['1 Thessalonians 5:18', 'Psalm 107:1', 'Psalm 100:4', 'Colossians 3:17', 'Psalm 118:1'],
  intercession: ['James 5:16', '1 Timothy 2:1', 'Ephesians 6:18', 'Romans 8:26', 'Colossians 4:2'],
  lament: ['Psalm 130:1', 'Psalm 22:1', 'Psalm 13:1', 'Psalm 42:11', 'Psalm 6:6']
};
let lastScriptureRefByMode = {};
let modeScriptureRequestId = 0;
let currentStageScripture = null;

async function fetchLiveScripture(modeName, fallback) {
  const pool = MODE_VERSE_REFS[modeName] || [fallback.ref];
  let ref = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && ref === lastScriptureRefByMode[modeName]) {
    ref = pool[(pool.indexOf(ref) + 1) % pool.length];
  }
  lastScriptureRefByMode[modeName] = ref;
  try {
    const res = await fetch('https://bible-api.com/' + encodeURIComponent(ref) + '?translation=kjv');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const text = (data.text || '').replace(/\s+/g, ' ').trim();
    if (!text) throw new Error('empty verse');
    return { verse: '"' + text + '"', ref: data.reference || ref };
  } catch (e) {
    return { verse: fallback.verse, ref: fallback.ref };
  }
}

function displayModeScripture(verse, ref) {
  currentStageScripture = { verse: verse, ref: ref };
  const verseText = $('verseText');
  const verseRef = $('verseRef');
  if (verseText) {
    verseText.dataset.originalText = verse;
    verseText.textContent = replaceGodName(replaceMessiahName(verse));
  }
  if (verseRef) {
    verseRef.dataset.originalText = ref;
    verseRef.textContent = replaceGodName(replaceMessiahName(ref));
  }
}

function updateMode() {
  const mode = MODES[currentModeIndex];
  const track = $('modeTrack');
  const modeWindow = $('modeWindow');
  if (track && modeWindow) {
    track.style.transform = `translateX(${-currentModeIndex * modeWindow.getBoundingClientRect().width}px)`;
  }
  const mainInput = $('mainInput');
  const nexusHint = $('nexusHint');
  displayModeScripture(mode.verse, mode.ref);
  if (mainInput) mainInput.placeholder = mode.placeholder;
  if (mainInput) mainInput.value = '';
  if (nexusHint) nexusHint.textContent = mode.name === 'confession' ? 'hold to confess' : 'hold to enter';
  progressValue = 0;
  if (progressRing) {
    progressRing.style.strokeDashoffset = 421;
  }
  updateCharCounter();

  const requestId = ++modeScriptureRequestId;
  const modeAtRequest = currentModeIndex;
  fetchLiveScripture(mode.name, { verse: mode.verse, ref: mode.ref }).then(function(result) {
    if (requestId !== modeScriptureRequestId || currentModeIndex !== modeAtRequest) return;
    displayModeScripture(result.verse, result.ref);
  });
}

function updateCharCounter() {
  const input = $('mainInput');
  const counter = $('charCounter');
  if (input && counter) {
    const len = input.value.length;
    counter.textContent = len + '/140';
    counter.style.color = len > 120 ? 'var(--ember)' : '';
  }
}

const mainInput = $('mainInput');
if (mainInput) mainInput.addEventListener('input', updateCharCounter);

const prevMode = $('prevMode');
if (prevMode) {
  prevMode.addEventListener('click', function() {
    currentModeIndex = (currentModeIndex - 1 + MODES.length) % MODES.length;
    updateMode();
    vibrate();
  });
}

const nextMode = $('nextMode');
if (nextMode) {
  nextMode.addEventListener('click', function() {
    currentModeIndex = (currentModeIndex + 1) % MODES.length;
    updateMode();
    vibrate();
  });
}

// ─── NEXUS BUTTON ───────────────────────────────

const nexusBtn = $('nexusBtn');

if (nexusBtn) {
  // Add this to prevent default touch behavior
  nexusBtn.addEventListener('touchstart', function(e) {
    e.preventDefault(); // ← ADD THIS
  }, { passive: false }); // ← CHANGE to false
  
  // Original event listeners
  nexusBtn.addEventListener('mousedown', startHold);
  nexusBtn.addEventListener('touchstart', startHold, { passive: true });
  nexusBtn.addEventListener('mouseup', endHold);
  nexusBtn.addEventListener('touchend', endHold, { passive: true });
  nexusBtn.addEventListener('mouseleave', endHold);
  
  // ADD THIS to remove focus after interaction
  nexusBtn.addEventListener('click', function(e) {
    this.blur(); // ← ADD THIS
  });
}

function startHold(e) {
  e.preventDefault();
  e.stopPropagation(); // ← ADD THIS
  
  // Remove any blue highlight/focus
  if (document.activeElement) {
    document.activeElement.blur(); // ← ADD THIS
  }
  isHolding = true;
  progressValue = 0;
  const nexusHint = $('nexusHint');
  if (nexusHint) {
    nexusHint.textContent = 'holding…';
    nexusHint.classList.add('active');
  }
  if (progressRing) {
    progressRing.style.transition = 'none';
    progressRing.style.strokeDashoffset = 421;
  }
  clearInterval(progressInterval);
  progressInterval = setInterval(function() {
    if (!isHolding) {
      clearInterval(progressInterval);
      return;
    }
    progressValue += 2;
    if (progressValue >= 100) {
      progressValue = 100;
      clearInterval(progressInterval);
      enterSanctuary();
      return;
    }
    if (progressRing) {
      const offset = 421 - (421 * progressValue / 100);
      progressRing.style.strokeDashoffset = offset;
    }
    const nexusHint2 = $('nexusHint');
    if (nexusHint2) nexusHint2.textContent = Math.floor(progressValue / 10) + '/10';
  }, 50);
}

function endHold() {
  // Remove blue highlight when releasing
  const btn = $('nexusBtn');
  if (btn) btn.blur(); // ← ADD THIS
  isHolding = false;
  clearInterval(progressInterval);
  if (!isSanctuaryActive) {
    const nexusHint = $('nexusHint');
    if (nexusHint) {
      nexusHint.textContent = 'hold to enter';
      nexusHint.classList.remove('active');
    }
    if (progressRing) {
      progressRing.style.transition = 'stroke-dashoffset 0.3s ease';
      progressRing.style.strokeDashoffset = 421;
    }
  }
}

// ─── SANCTUARY ───────────────────────────────────
const SANCTUARY_MODES = MODES.map(m => ({ id: m.name, name: capitalize(m.name), symbol: m.symbol }));
let currentSanctuaryMode = 'petition';

function getScriptureForMode(mode) {
  const map = {
    petition: ['"Ask, and it will be given to you."', 'Matthew 7:7'],
    lament: ['"Out of the depths I cry to you, O Lord."', 'Psalm 130:1'],
    thanksgiving: ['"Give thanks to the Lord, for he is good."', 'Psalm 107:1'],
    intercession: ['"Pray for one another, that you may be healed."', 'James 5:16'],
    confession: ['"If we confess our sins, he is faithful and just."', '1 John 1:9']
  };
  const [verse, ref] = map[mode] || ['"Be still, and know that I am God."', 'Psalm 46:10'];
  return [replaceGodName(replaceMessiahName(verse)), ref];
}

function renderModeMenu() {
  const menu = $('sanctuaryModeMenu');
  if (!menu) return;
  menu.innerHTML = SANCTUARY_MODES.map(m =>
    `<div class="item ${m.id === currentSanctuaryMode ? 'active' : ''}" data-mode="${m.id}" onclick="switchSanctuaryMode('${m.id}')">
      <span class="symbol">${m.symbol}</span>${m.name}
    </div>`
  ).join('');
}

function switchSanctuaryMode(modeId) {
  currentSanctuaryMode = modeId;
  const mode = SANCTUARY_MODES.find(m => m.id === modeId);
  if (mode) {
    const current = $('sanctuaryModeCurrent');
    if (current) {
      current.innerHTML = `<span class="symbol">${mode.symbol}</span> ${mode.name} <span class="caret">▾</span>`;
    }
  }
  renderModeMenu();
  const scripture = getScriptureForMode(modeId);
  const solVerse = $('solVerse');
  const solRef = $('solRef');
  if (solVerse) solVerse.textContent = scripture[0];
  if (solRef) solRef.textContent = scripture[1];
  const menu = $('sanctuaryModeMenu');
  if (menu) menu.classList.remove('open');
  updateSanctuaryForConfession(modeId === 'confession');
  toast(mode.name + ' mode');
}

window.switchSanctuaryMode = switchSanctuaryMode;

function toggleModeMenu() {
  const menu = $('sanctuaryModeMenu');
  if (menu) menu.classList.toggle('open');
}

window.toggleModeMenu = toggleModeMenu;

// ─── CONFESSION ──────────────────────────────────
function updateSanctuaryForConfession(isConfession) {
  const capsule = $('confCapsule');
  if (!capsule) return;
  if (isConfession) {
    capsule.classList.add('visible');
    const note = $('confNote');
    if (note) note.textContent = (D.confBurnt || 0);
    setTimeout(() => {
      const input = $('confInput');
      if (input) input.focus();
    }, 300);
  } else {
    capsule.classList.remove('visible');
  }
}

function addAshMark() {
  const strip = $('ashStrip');
  if (!strip) return;
  const mark = document.createElement('div');
  mark.className = 'ash-mark';
  strip.appendChild(mark);
  strip.scrollTop = strip.scrollHeight;
}

function burnConfession(text) {
  D.confBurnt = (D.confBurnt || 0) + 1;
  if (!D.confessions) D.confessions = [];
  D.confessions.push({ text: text, timestamp: new Date().toISOString() });
  addAshMark();
  const note = $('confNote');
  if (note) note.textContent = D.confBurnt;
  saveLocal();

  D.entries.unshift({
    id: Date.now(),
    text: 'Confession: ' + text,
    mode: 'confession',
    city: 'Heart',
    timestamp: new Date().toISOString(),
    answered: true,
    testimony: '',
    solSec: 0,
    tags: ['confession', 'forgiveness'],
    isConfession: true
  });
  saveLocal();
  renderDNA();

  const verseEl = $('solVerse');
  const refEl = $('solRef');
  if (verseEl) {
    verseEl.textContent = '"If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."';
    verseEl.style.opacity = '1';
  }
  if (refEl) {
    refEl.textContent = '1 John 1:9';
  }
  toast('Confession burnt — you are forgiven');
  vibrate();

  setTimeout(() => {
    const scripture = getScriptureForMode(currentSanctuaryMode);
    if (verseEl) verseEl.textContent = scripture[0];
    if (refEl) refEl.textContent = scripture[1];
  }, 4000);
}

function hideAllAlerts() {}

function showAllAlerts() {}

// ─── SANCTUARY ──────────────────────────────────
function enterSanctuary(modeNameOverride) {
  hideAllAlerts();

  isSanctuaryActive = true;
  const sanctuary = $('sanctuary');
  if (sanctuary) sanctuary.classList.add('active');

  const city = D.currentCity || { name: 'Your City' };
  const solCityContext = $('solCityContext');
  if (solCityContext) solCityContext.textContent = city.name;

  const modeName = modeNameOverride || MODES[currentModeIndex].name;
  currentSanctuaryMode = modeName;
  const modeObj = SANCTUARY_MODES.find(m => m.id === modeName);
  if (modeObj) {
    const current = $('sanctuaryModeCurrent');
    if (current) {
      current.innerHTML = `<span class="symbol">${modeObj.symbol}</span> ${modeObj.name} <span class="caret">▾</span>`;
    }
  }
  const solVerse = $('solVerse');
  const solRef = $('solRef');
  if (D._guidedActive && D._guidedPrayer && GUIDED_PRAYERS[D._guidedPrayer]) {
    // A guided prayer is in progress — keep showing its current step,
    // not the generic scripture for the sanctuary mode.
    const gPrayer = GUIDED_PRAYERS[D._guidedPrayer];
    const gScripture = gPrayer.scriptures[D._guidedStep || 0];
    let gText = gScripture.text;
    gText = replaceGodName(gText);
    gText = replaceMessiahName(gText);
    if (solVerse) solVerse.textContent = '"' + gText + '"';
    if (solRef) solRef.textContent = '— ' + gScripture.ref;
  } else if (!modeNameOverride && currentStageScripture) {
    // Carry over the live scripture already showing on the stage carousel
    // so it doesn't swap to a different one the instant sanctuary opens.
    if (solVerse) solVerse.textContent = replaceGodName(replaceMessiahName(currentStageScripture.verse));
    if (solRef) solRef.textContent = replaceGodName(replaceMessiahName(currentStageScripture.ref));
  } else {
    const scripture = getScriptureForMode(currentSanctuaryMode);
    if (solVerse) solVerse.textContent = scripture[0];
    if (solRef) solRef.textContent = scripture[1];
  }
  renderModeMenu();
  updateSanctuaryForConfession(currentSanctuaryMode === 'confession');
  updateSanctuaryGuidedNav();

  sanctuaryTimer = 0;
  const solTimer = $('solTimer');
  if (solTimer) solTimer.textContent = '0s';
  clearInterval(sanctuaryInterval);
  sanctuaryInterval = setInterval(function() {
    sanctuaryTimer++;
    const timer = $('solTimer');
    if (timer) timer.textContent = sanctuaryTimer + 's';
  }, 1000);

  if (progressRing) {
    progressRing.style.transition = 'stroke-dashoffset 0.3s ease';
    progressRing.style.strokeDashoffset = 421;
  }
  const nexusHint = $('nexusHint');
  if (nexusHint) {
    nexusHint.textContent = 'in sanctuary';
    nexusHint.classList.add('active');
  }
  const mainInput2 = $('mainInput');
  if (mainInput2) mainInput2.blur();

  toast('Entering sanctuary…');
}

function leaveSanctuary() {
  isSanctuaryActive = false;
  const sanctuary = $('sanctuary');
  if (sanctuary) sanctuary.classList.remove('active');
  clearInterval(sanctuaryInterval);
  const menu = $('sanctuaryModeMenu');
  if (menu) menu.classList.remove('open');
  const capsule = $('confCapsule');
  if (capsule) capsule.classList.remove('visible');

  D.totalSolSec = (D.totalSolSec || 0) + sanctuaryTimer;
  saveLocal();
  renderDNA();

  toast('Returned from sanctuary (' + sanctuaryTimer + 's)');
  const nexusHint = $('nexusHint');
  if (nexusHint) {
    nexusHint.textContent = 'hold to enter';
    nexusHint.classList.remove('active');
  }
  const solTimer = $('solTimer');
  if (solTimer) solTimer.textContent = '0s';

  showAllAlerts();
}

const leaveBtn = $('leaveBtn');
if (leaveBtn) leaveBtn.addEventListener('click', leaveSanctuary);

const sanctuaryGuidedNextBtn = $('sanctuaryGuidedNext');
if (sanctuaryGuidedNextBtn) sanctuaryGuidedNextBtn.addEventListener('click', advanceSanctuaryGuidedStep);

const sanctuary = $('sanctuary');
if (sanctuary) {
  sanctuary.addEventListener('click', function(e) {
    if (e.target === this) leaveSanctuary();
  });
}

// ─── CONFESSION INPUT ──────────────────────────
const confInput = $('confInput');
if (confInput) {
  confInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = this.value.trim();
      if (!text) {
        toast('Speak your confession');
        return;
      }
      burnConfession(text);
      this.value = '';
    }
  });
}

// ─── STREAK ─────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString();
  if (D.lastPrayerDate === today) return;
  if (D.lastPrayerDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    D.streak = (D.lastPrayerDate === yesterday.toDateString()) ? (D.streak || 0) + 1 : 1;
  } else {
    D.streak = 1;
  }
  D.lastPrayerDate = today;
}

// ─── SUBMIT PRAYER ──────────────────────────────
function submitPrayer() {
  const input = $('mainInput');
  const text = input.value.trim();
  if (!text) {
    toast('Write your prayer');
    return;
  }

  const mode = MODES[currentModeIndex];

  if (mode.name === 'confession') {
    burnConfession(text);
    input.value = '';
    return;
  }

  const entry = {
    id: Date.now(),
    text: text,
    mode: mode.name,
    city: D.currentCity ? D.currentCity.name : 'Global',
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: []
  };

  D.entries.unshift(entry);
  updateStreak();

  saveLocal();
  renderDNA();
  toast('Prayer lifted · ' + mode.name);
  input.value = '';
  vibrate();

  enterSanctuary(mode.name);
}

const submitBtn = $('submitBtn');
if (submitBtn) submitBtn.addEventListener('click', submitPrayer);

const mainInputSubmit = $('mainInput');
if (mainInputSubmit) {
  mainInputSubmit.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitPrayer();
    }
  });
}

// ─── PRAY FOR MAP POINT ──────────────────────────
window.prayForMapPoint = function(id) {
  const point = PRAYER_POINTS.find(p => p.id === id) || LIVE_CRISES.find(p => p.id === id);
  if (!point) {
    toast('Point not found');
    return;
  }

  const entry = {
    id: Date.now(),
    text: 'Prayed for: ' + point.country + ' - ' + point.prayer,
    mode: 'intercession',
    city: point.country,
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: ['intercession', point.level.toLowerCase()],
    location: point.country
  };

  D.entries.unshift(entry);
  updateStreak();

  saveLocal();
  renderDNA();

  mapCounts[id] = (mapCounts[id] || 0) + 1;
  try {
    localStorage.setItem('palal_map_counts', JSON.stringify(mapCounts));
  } catch (e) {}

  toast('Prayed for ' + point.country);
  vibrate();

  D.currentCity = { name: point.country, weather: getCityWeather(), headline: point.prayer };
  selectedCity = { name: point.country };

  const verseText = $('verseText');
  const verseRef = $('verseRef');
  const cityContext = $('cityContext');
  if (verseText) verseText.textContent = '"' + point.prayer + '"';
  if (verseRef) verseRef.textContent = point.country;
  if (cityContext) cityContext.textContent = point.country + ' · ' + point.level;

  const mapPanel = $('mapPanel');
  const stageAxis = $('stageAxis');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');

  const dnaPanel = $('dnaPanel');
  if (dnaPanel && dnaPanel.classList.contains('open')) {
    dnaPanel.classList.remove('open');
  }

  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navPray = $('navPray');
  if (navPray) navPray.classList.add('active');

  const intercessionIndex = MODES.findIndex(m => m.name === 'intercession');
  if (intercessionIndex !== -1) {
    currentModeIndex = intercessionIndex;
    updateMode();
  }

  setTimeout(() => {
    const mainInput2 = $('mainInput');
    if (mainInput2) mainInput2.focus();
  }, 300);

  enterSanctuary('intercession');
};

// ─── DOCK NAVIGATION ────────────────────────────
const navWorld = $('navWorld');
if (navWorld) {
  navWorld.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    exitPrayerToMap();
    if (mapInstance) {
      mapInstance.setView([20, 0], 2);
      setTimeout(() => mapInstance.invalidateSize(), 300);
    }
    
    const dnaPanel = $('dnaPanel');
    const requestsPanel = $('requestsPanel');
   // ─── ADD THIS ───
    const tawPanel = document.getElementById('tawPanel');
    if (dnaPanel && dnaPanel.classList.contains('open')) dnaPanel.classList.remove('open');
    if (requestsPanel && requestsPanel.classList.contains('open')) requestsPanel.classList.remove('open');
    if (tawPanel && tawPanel.classList.contains('open')) tawPanel.classList.remove('open');
    hideCountryTooltip();
  });
}
const navPray = $('navPray');
if (navPray) {
  navPray.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    
    if (dnaPanel && dnaPanel.classList.contains('open')) dnaPanel.classList.remove('open');
    if (requestsPanel && requestsPanel.classList.contains('open')) requestsPanel.classList.remove('open');
    if (!selectedCity && D.currentCity) {
      enterPrayerWithCity();
      return;
    }
    if (!selectedCity) {
      toast('Tap a city on the map first');
      exitPrayerToMap();
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      const navWorld2 = $('navWorld');
      if (navWorld2) navWorld2.classList.add('active');
      return;
    }
    enterPrayerWithCity();
  });
}

const navDNA = $('navDNA');
if (navDNA) {
  navDNA.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    const requestsPanel = $('requestsPanel');
// ─── ADD THESE 3 LINES ───
    const tawPanel = document.getElementById('tawPanel');
    if (tawPanel && tawPanel.classList.contains('open')) {
      tawPanel.classList.remove('open');
    }
    // ─── END ADD ───    
    renderDNA();
    const dnaPanel = $('dnaPanel');
    if (dnaPanel) dnaPanel.classList.toggle('open');
  });
}

const closeDNA = $('closeDNA');
if (closeDNA) {
  closeDNA.addEventListener('click', function() {
    const dnaPanel = $('dnaPanel');
    if (dnaPanel) dnaPanel.classList.remove('open');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navWorld2 = $('navWorld');
    if (navWorld2) navWorld2.classList.add('active');
  });
}

const APP_TEXT_SCALE_BY_SIZE = { small: 0.85, medium: 1, large: 1.15 };
function applyAppTextSize(size) {
  const scale = APP_TEXT_SCALE_BY_SIZE[size] || 1;
  document.documentElement.style.setProperty('--app-text-scale', scale);
  document.querySelectorAll('.dna-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === size));
  // Re-measure the mode carousel now that its font size may have changed.
  const track = $('modeTrack');
  const win = $('modeWindow');
  if (track && win) track.style.transform = `translateX(${-currentModeIndex * win.getBoundingClientRect().width}px)`;
}
const dnaSizeToggle = $('dnaSizeToggle');
if (dnaSizeToggle) {
  dnaSizeToggle.addEventListener('click', function(e) {
    const btn = e.target.closest('.dna-size-btn');
    if (!btn) return;
    D.appTextSize = btn.dataset.size;
    saveLocal();
    applyAppTextSize(D.appTextSize);
  });
}
applyAppTextSize(D.appTextSize || 'medium');

const dnaSearchInput = $('dnaSearchInput');
if (dnaSearchInput) {
  dnaSearchInput.addEventListener('input', function() {
    dnaSearchQuery = dnaSearchInput.value;
    renderDNA();
  });
}

const dnaFilterRow = $('dnaFilterRow');
if (dnaFilterRow) {
  dnaFilterRow.addEventListener('click', function(e) {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    dnaFilterRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    dnaModeFilter = chip.dataset.filter;
    renderDNA();
  });
}

const closeDnaDetailBtn = $('closeDnaDetail');
if (closeDnaDetailBtn) closeDnaDetailBtn.addEventListener('click', closeDnaDetail);

const dnaDetailAnsweredToggle = $('dnaDetailAnsweredToggle');
if (dnaDetailAnsweredToggle) {
  dnaDetailAnsweredToggle.addEventListener('click', function() {
    dnaDetailPendingAnswered = !dnaDetailPendingAnswered;
    updateDnaDetailAnsweredUI(dnaDetailPendingAnswered);
  });
}

const dnaDetailPrayAgain = $('dnaDetailPrayAgain');
if (dnaDetailPrayAgain) {
  dnaDetailPrayAgain.addEventListener('click', function() {
    if (dnaDetailId != null) prayEntryAgain(dnaDetailId);
  });
}

const dnaDetailDelete = $('dnaDetailDelete');
if (dnaDetailDelete) {
  dnaDetailDelete.addEventListener('click', function() {
    if (dnaDetailId == null) return;
    deleteEntry(dnaDetailId);
    closeDnaDetail();
  });
}

const dnaDetailSave = $('dnaDetailSave');
if (dnaDetailSave) {
  dnaDetailSave.addEventListener('click', function() {
    const entry = D.entries.find(e => e.id === dnaDetailId);
    if (!entry) return;
    const themeEl = $('dnaDetailTheme');
    const testimonyEl = $('dnaDetailTestimony');
    entry.theme = themeEl ? themeEl.value.trim().toLowerCase() : entry.theme;
    entry.testimony = testimonyEl ? testimonyEl.value.trim() : entry.testimony;
    entry.answered = dnaDetailPendingAnswered;
    saveLocal();
    renderDNA();
    closeDnaDetail();
    toast('Prayer updated');
  });
}

const navRequests = $('navRequests');
if (navRequests) {
  navRequests.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    const dnaPanel = $('dnaPanel');
// ─── ADD THESE 3 LINES ───
    const tawPanel = document.getElementById('tawPanel');
    if (tawPanel && tawPanel.classList.contains('open')) {
      tawPanel.classList.remove('open');
    }
    // ─── END ADD ───    
    if (dnaPanel && dnaPanel.classList.contains('open')) dnaPanel.classList.remove('open');
    renderRequests();
    const requestsPanel = $('requestsPanel');
    if (requestsPanel) requestsPanel.classList.toggle('open');
  });
}// ─── CLOSE REQUESTS ──────────────────────────────
const closeRequests = document.getElementById('closeRequests');
if (closeRequests) {
  closeRequests.addEventListener('click', function() {
    const requestsPanel = document.getElementById('requestsPanel');
    if (requestsPanel) {
      requestsPanel.classList.remove('open');
    }
    // Reset dock highlighting
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navWorld = document.getElementById('navWorld');
    if (navWorld) navWorld.classList.add('active');
  });
}

// ─── ADD THIS ENTIRE BLOCK ───
// ─── CLOSE TAW BUTTON ────────────────────────────
const closeTaw = document.getElementById('closeTaw');
if (closeTaw) {
  closeTaw.addEventListener('click', function() {
    const tawPanel = document.getElementById('tawPanel');
    if (tawPanel) {
      tawPanel.classList.remove('open');
      tawPanel.style.display = 'none';
      tawPanel.style.pointerEvents = 'none';
    }
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navWorld = document.getElementById('navWorld');
    if (navWorld) navWorld.classList.add('active');
  });
}
// ─── END ADD ───

// ─── TAW NAVIGATION ─────────────────────────────
const navTaw = document.getElementById('navTaw');
if (navTaw) {
  navTaw.addEventListener('click', async function() {
    // Close sanctuary if open
    if (isSanctuaryActive) leaveSanctuary();
    
    // Close other panels
    const dnaPanel = document.getElementById('dnaPanel');
    const requestsPanel = document.getElementById('requestsPanel');
    const guidedPanel = document.getElementById('guidedPanel');
    const tawPanel = document.getElementById('tawPanel');
    
    if (dnaPanel) dnaPanel.classList.remove('open');
    if (requestsPanel) requestsPanel.classList.remove('open');
    if (guidedPanel) guidedPanel.classList.remove('open');
    
    // Toggle TAW
    if (tawPanel) {
      const isOpen = tawPanel.classList.contains('open');
      
      if (isOpen) {
        // Close TAW
        tawPanel.classList.remove('open');
        tawPanel.style.display = 'none';
        tawPanel.style.pointerEvents = 'none';
      } else {
        // Open TAW
        tawPanel.style.display = 'block';
        tawPanel.style.pointerEvents = 'auto';
        tawPanel.classList.add('open');
        
        // Initialize the game - CRITICAL FIX
        const tawWordEl = document.getElementById('tawWord');
        if (tawWordEl) tawWordEl.textContent = 'Loading…';
        window.TAW_NAMES = await window.getTawNames();
        window.rebuildTawIndexes();
        window.tawTeardown();
        window.tawInitMode('chain');
        window.syncTawUI();
        // Focus the input
        const tawInput = document.getElementById('tawInput');
        if (tawInput) {
          setTimeout(() => tawInput.focus(), 300);
        }
      }
      
      // Update dock
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    }
  });
}

// ─── SCRIPTURE BLOCK TAP ────────────────────────
const scriptureBlock = $('scriptureBlock');
if (scriptureBlock) {
  scriptureBlock.addEventListener('click', function() {
    const mode = MODES[currentModeIndex];
    toast(mode.name + ' · ' + mode.ref);
  });
}

// ─── MAP LEGEND ──────────────────────────────────
const legendToggle = document.getElementById('legendToggle');
const legendContent = document.getElementById('legendContent');

if (legendToggle && legendContent) {
  legendToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    legendContent.classList.toggle('open');
    legendToggle.classList.toggle('open');
    legendToggle.textContent = legendContent.classList.contains('open') ? '✦ Close' : '✦ Legend';
  });

  document.addEventListener('click', function(e) {
    const legend = document.getElementById('mapLegend');
    if (legend && !legend.contains(e.target)) {
      legendContent.classList.remove('open');
      legendToggle.classList.remove('open');
      legendToggle.textContent = '✦ Legend';
    }
  });
}

// ─── TUTORIAL — SPOTLIGHT WALKTHROUGH ───────────
const TUTORIAL_SEEN_KEY = 'palal_tutorial_seen_v4';

(function() {
  const STEPS = [
    { target: null, pos: 'center', icon: '✦', title: 'Welcome to Palal', body: 'A sacred space to pray, listen, and stand in the gap. Let\'s take a quick look around.' },
    { target: '#modeWindow', pos: 'below', icon: '◈', title: 'Choose your mode', body: 'Petition, Lament, Thanksgiving, Adoration, or Confession — swipe to choose how you come before God today.' },
    { target: '#nexusBtn', pos: 'below', icon: '✦', title: 'Hold to enter', body: 'Type your prayer, then press and hold the circle until it fills. You\'ll enter the Sanctuary — a still space with rotating scripture.' },
    { target: '#scriptureBlock', pos: 'above', icon: '✦', title: 'Living scripture', body: 'A verse aligned with your current mode appears here. Tap it any time for a new one.' },
    { target: '#mainInput', pos: 'above', icon: '✦', title: 'Lay it down', body: 'Type what\'s on your heart, then hold the circle to lift it in prayer. Every prayer is saved to your DNA.' },
    { target: '#navWorld', pos: 'above', icon: '◉', title: 'World', body: 'See persecuted nations, conflict zones, and live global crises on the map. Tap any dot to pray for that place.' },
    { target: '#navDNA', pos: 'above', icon: '✦', title: 'Prayer DNA', body: 'Your full prayer journal. Link prayers by theme to see how your prayer life connects and grows over time.' },
    { target: '#navRequests', pos: 'above', icon: '✦', title: 'Requests', body: 'Keep a living list of the people and needs you\'re carrying. Tap a request to enter Sanctuary for it.' },
    { target: '#navTaw', pos: 'above', icon: '✦', title: 'TAW', body: 'A Bible-name word game, right inside your prayer time — a playful way to build scripture familiarity.' },
    { target: null, pos: 'center', icon: '✦', title: 'You\'re ready', body: 'Begin with what\'s on your heart. Palal will hold it and help you see how God answers over time.' }
  ];

  let step = 0;
  let built = false;
  let backdrop, spotlight, pulse, card;

  function build() {
    if (built) return;
    backdrop = document.createElement('div'); backdrop.className = 'tut-backdrop';
    spotlight = document.createElement('div'); spotlight.className = 'tut-spotlight';
    pulse = document.createElement('div'); pulse.className = 'tut-pulse';
    card = document.createElement('div'); card.className = 'tut-card';
    card.innerHTML = '<div class="tut-step-row"><div class="tut-step-pips" id="tutPips"></div><button class="tut-skip" id="tutSkip">skip tour</button></div><div class="tut-icon" id="tutIcon"></div><div class="tut-title" id="tutTitle"></div><div class="tut-body" id="tutBody"></div><div class="tut-footer"><button class="tut-back" id="tutBack">Back</button><button class="tut-next" id="tutNext">Next</button></div>';
    document.body.appendChild(backdrop);
    document.body.appendChild(spotlight);
    document.body.appendChild(pulse);
    document.body.appendChild(card);
    document.getElementById('tutNext').addEventListener('click', function() {
      if (step < STEPS.length - 1) { step++; renderStep(); } else { closeTutorial(); }
    });
    document.getElementById('tutBack').addEventListener('click', function() {
      if (step > 0) { step--; renderStep(); }
    });
    document.getElementById('tutSkip').addEventListener('click', closeTutorial);
    window.addEventListener('resize', function() {
      if (card.style.display !== 'none') renderStep();
    });
    built = true;
  }

  function renderStep() {
    const s = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const pips = document.getElementById('tutPips');
    if (pips) {
      pips.innerHTML = STEPS.map(function(_, i) {
        let cls = 'tut-pip';
        if (i < step) cls += ' done';
        if (i === step) cls += ' active';
        return '<div class="' + cls + '"></div>';
      }).join('');
    }
    document.getElementById('tutIcon').textContent = s.icon || '';
    document.getElementById('tutTitle').textContent = s.title;
    document.getElementById('tutBody').textContent = s.body;
    document.getElementById('tutNext').textContent = isLast ? 'Begin' : 'Next →';
    document.getElementById('tutBack').style.visibility = step === 0 ? 'hidden' : 'visible';

    const vw = window.innerWidth, vh = window.innerHeight, cw = 272, ch = 220;

    if (!s.target || s.pos === 'center') {
      spotlight.style.cssText = 'top:50%;left:50%;width:0;height:0;border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,0.65);';
      pulse.style.display = 'none';
      card.style.left = ((vw - cw) / 2) + 'px';
      card.style.top = ((vh - ch) / 2 - 20) + 'px';
      return;
    }

    const el = document.querySelector(s.target);
    if (!el) { step < STEPS.length - 1 ? (step++, renderStep()) : closeTutorial(); return; }
    const r = el.getBoundingClientRect();
    const pad = 10;
    const isCircle = el.id === 'nexusBtn';
    spotlight.className = 'tut-spotlight' + (isCircle ? ' circle' : '');
    spotlight.style.top = (r.top - pad) + 'px';
    spotlight.style.left = (r.left - pad) + 'px';
    spotlight.style.width = (r.width + pad * 2) + 'px';
    spotlight.style.height = (r.height + pad * 2) + 'px';
    spotlight.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.65)';

    if (isCircle) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, pr = Math.max(r.width, r.height) / 2 + pad + 4;
      pulse.style.cssText = 'display:block;width:' + (pr * 2) + 'px;height:' + (pr * 2) + 'px;top:' + (cy - pr) + 'px;left:' + (cx - pr) + 'px;border-radius:50%;';
    } else {
      pulse.style.display = 'none';
    }

    const spaceBelow = vh - r.bottom - 20, spaceAbove = r.top - 20;
    let cardTop = Math.max(20, Math.min(r.top - ch - 32, vh - ch - 60));
    if (s.pos === 'above' && spaceAbove > ch + 40) cardTop = r.top - ch - 32;
    else if (spaceBelow > ch + 40) cardTop = r.bottom + 28;
    else if (spaceAbove > ch + 40) cardTop = r.top - ch - 32;
    card.style.left = Math.max(12, Math.min(r.left + r.width / 2 - cw / 2, vw - cw - 12)) + 'px';
    card.style.top = Math.max(20, cardTop) + 'px';
  }

  function startTutorial() {
    build();
    step = 0;
    card.style.display = 'block';
    spotlight.style.display = 'block';
    backdrop.style.opacity = '1';
    backdrop.style.pointerEvents = 'auto';
    renderStep();
  }

  function closeTutorial() {
    if (!built) return;
    card.style.display = 'none';
    spotlight.style.display = 'none';
    pulse.style.display = 'none';
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
    try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (e) {}
  }

  window.startTutorial = startTutorial;
  window.closeTutorial = closeTutorial;
})();

// ─── SIGN IN / LOGOUT ────────────────────────────
const signInGoogle = $('signInGoogle');
if (signInGoogle) {
  signInGoogle.addEventListener('click', function() {
    toast('Sign in with Google (coming soon)');
  });
}

const logoutBtn = $('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    toast('Signed out');
    const userInfo = $('userInfo');
    const signInGoogle2 = $('signInGoogle');
    if (userInfo) userInfo.classList.remove('show');
    if (signInGoogle2) signInGoogle2.style.display = '';
  });
}

// ═══════════════════════════════════════════════
//  NAME SYSTEMS - MESSIAH & GOD (CLEAN VERSION)
// ═══════════════════════════════════════════════

// ─── MESSIAH NAME ──────────────────────────────
function getMessiahName() {
  return D.messiahName || 'Yeshua';
}

function replaceMessiahName(text) {
  if (!text) return text;
  const name = getMessiahName();
  return text
    .replace(/Yahusha/g, name)
    .replace(/Yeshua/g, name)
    .replace(/Jesus/g, name)
    .replace(/Messiah/g, name)
    .replace(/Christ/g, name);
}

function updateMessiahNameInUI() {
  const name = getMessiahName();
  document.querySelectorAll('.scripture-verse, .preview-verse, .sol-verse, .about-verse')
    .forEach(el => {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = replaceMessiahName(el.dataset.originalText);
    });
  document.querySelectorAll('.about-messiah-name, .about-messiah-name-dynamic')
    .forEach(el => { el.textContent = name; });
  const aboutHebrew = $('aboutHebrew');
  if (aboutHebrew) {
    const data = {
      'Yahusha': 'יָהוּשׁוּעַ',
      'Yeshua': 'יֵשׁוּעַ',
      'Jesus': 'Ἰησοῦς',
      'The Messiah': 'מָשִׁיחַ'
    };
    aboutHebrew.textContent = data[name] || 'יֵשׁוּעַ';
  }
}

// ─── GOD NAME ──────────────────────────────────
function getGodName() {
  return D.godName || 'Yahuah';
}

function replaceGodName(text) {
  if (!text) return text;
  const name = getGodName();
  return text
    .replace(/LORD/g, name)
    .replace(/Lord/g, name)
    .replace(/Yahweh/g, name)
    .replace(/Yahuah/g, name)
    .replace(/Abba/g, name)
    .replace(/Elohim/g, name)
    .replace(/יהוה/g, name)
    .replace(/יָהוּה/g, name);
}

function updateGodNameInUI() {
  const name = getGodName();
  document.querySelectorAll('.scripture-verse, .preview-verse, .sol-verse, .about-verse, #aboutVerse')
    .forEach(el => {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = replaceGodName(el.dataset.originalText);
    });
  document.querySelectorAll('.scripture-cite, .sol-ref, .about-verse-ref, .preview-ref, #aboutVerseRef')
    .forEach(el => {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = replaceGodName(el.dataset.originalText);
    });
  const aboutGodName = document.getElementById('aboutGodName');
  if (aboutGodName) aboutGodName.textContent = name;
  const godHebrewMap = {
    'Yahuah': 'יָהוּה',
    'Yahweh': 'יַהְוֶה',
    'Abba': 'אַבָּא',
    'Elohim': 'אֱלֹהִים',
    'LORD': ''
  };
  const aboutGodHebrew = document.getElementById('aboutGodHebrew');
  if (aboutGodHebrew) aboutGodHebrew.textContent = godHebrewMap[name] || '';
}

// ─── SETTINGS ──────────────────────────────────
function openSettings() {
  const panel = $('settingsPanel');
  if (panel) {
    panel.classList.add('open');
    updateSettingsUI();
  }
}

function closeSettings() {
  const panel = $('settingsPanel');
  if (panel) {
    panel.classList.remove('open');
  }
}

function updateSettingsUI() {
  // Messiah name
  const currentName = getMessiahName();
  document.querySelectorAll('input[name="messiahName"]').forEach(input => {
    input.checked = input.value === currentName;
  });
  // God name
  const currentGodName = getGodName();
  document.querySelectorAll('input[name="godName"]').forEach(input => {
    input.checked = input.value === currentGodName;
  });
  // Preview verse
  const previewVerse = $('previewVerse');
  if (previewVerse) {
    if (!previewVerse.dataset.originalText) {
      previewVerse.dataset.originalText = previewVerse.textContent;
    }
    previewVerse.textContent = replaceMessiahName(previewVerse.dataset.originalText);
  }
  // Update preset highlights
  updatePresetHighlight();
}

function initSettings() {
  const panel = $('settingsPanel');
  const closeBtn = $('settingsClose');
  const settingsLink = $('settingsLink');
  
  if (settingsLink) {
    settingsLink.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openSettings();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeSettings();
    });
  }
  
  // Messiah name radio buttons
  document.querySelectorAll('input[name="messiahName"]').forEach(input => {
    input.addEventListener('change', function() {
      if (this.checked) {
        D.messiahName = this.value;
        saveLocal();
        updateMessiahNameInUI();
        toast('✦ Messiah name updated to ' + this.value);
        updateSettingsUI();
      }
    });
  });
  
  // God name radio buttons
  document.querySelectorAll('input[name="godName"]').forEach(input => {
    input.addEventListener('change', function() {
      if (this.checked) {
        D.godName = this.value;
        saveLocal();
        updateGodNameInUI();
        toast('✦ God name updated to ' + this.value);
        updateSettingsUI();
      }
    });
  });
  
  // Initialize presets
  initPresets();
  
  // About button
  const aboutBtn = $('aboutBtn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', function() {
      closeSettings();
      openAbout();
    });
  }
  
  // Settings link in DNA panel
  const settingsLinkDNA = $('settingsLinkDNA');
  if (settingsLinkDNA) {
    settingsLinkDNA.addEventListener('click', function() {
      const dnaPanel = $('dnaPanel');
      if (dnaPanel) dnaPanel.classList.remove('open');
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      const navWorld2 = $('navWorld');
      if (navWorld2) navWorld2.classList.add('active');
      openSettings();
    });
  }
  
  // Replay tutorial button
  const replayBtn = document.getElementById('replayTutorialBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', function() {
      closeSettings();
      localStorage.removeItem(TUTORIAL_SEEN_KEY);
      startTutorial();
    });
  }
}

// ─── ABOUT MODAL ──────────────────────────────
function openAbout() {
  const modal = $('aboutModal');
  if (modal) {
    modal.classList.add('show');
    const name = getMessiahName();
    document.querySelectorAll('.about-messiah-name, .about-messiah-name-dynamic')
      .forEach(el => { el.textContent = name; });
    const godName = getGodName();
    const aboutGodName = document.getElementById('aboutGodName');
    if (aboutGodName) aboutGodName.textContent = godName;
  }
}

function closeAbout() {
  const modal = $('aboutModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function initAboutModal() {
  const closeBtn = $('aboutClose');
  const modal = $('aboutModal');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAbout);
  }
  
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeAbout();
    });
  }
}

// ─── PRAY WITH OTHERS ──────────────────────────
function prayWithOthers(countryName) {
  const entry = {
    id: Date.now(),
    text: 'Praying with others for: ' + countryName,
    mode: 'intercession',
    city: countryName,
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: ['intercession', 'community'],
    isCommunityPrayer: true
  };
  
  D.entries.unshift(entry);
  updateStreak();
  saveLocal();
  renderDNA();

  toast('🤝 Praying with others for ' + countryName);
  vibrate();
}

// ─── PRAY WITH OTHERS BUTTON ──────────────────
const prayWithBtn = document.getElementById('modalPrayWithBtn');
if (prayWithBtn) {
  prayWithBtn.addEventListener('click', function() {
    const modal = document.getElementById('countryModal');
    const name = modal.dataset.name;
    if (!name) return;
    closeCountryModal();
    prayWithOthers(name);
  });
}

// ═══════════════════════════════════════════════
//  GUIDED PALAL - COMPLETE
// ═══════════════════════════════════════════════

// ─── GUIDED PRAYER DATA ──────────────────────────

const GUIDED_PRAYERS = {
  morning: {
    name: 'Morning Guide',
    icon: '◈',
    scriptures: [
      { text: 'O LORD, in the morning you hear my voice; in the morning I prepare a sacrifice for you and watch.', ref: 'Psalm 5:3' },
      { text: 'O God, you are my God; earnestly I seek you; my soul thirsts for you.', ref: 'Psalm 63:1' },
      { text: 'Satisfy us in the morning with your steadfast love, that we may rejoice and be glad all our days.', ref: 'Psalm 90:14' },
      { text: 'Trust in the LORD with all your heart, and do not lean on your own understanding.', ref: 'Proverbs 3:5-6' },
      { text: 'Let me hear in the morning of your steadfast love, for in you I trust.', ref: 'Psalm 143:8' },
      { text: 'Let the words of my mouth and the meditation of my heart be acceptable in your sight, O LORD, my rock and my redeemer.', ref: 'Psalm 19:14' },
      { text: 'Give us this day our daily bread.', ref: 'Matthew 6:11' },
      { text: 'This is the day that the LORD has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' }
    ]
  },
  evening: {
    name: 'Evening Guide',
    icon: '◈',
    scriptures: [
      { text: 'In peace I will both lie down and sleep; for you alone, O LORD, make me dwell in safety.', ref: 'Psalm 4:8' },
      { text: 'Let my prayer be counted as incense before you, and the lifting up of my hands as the evening sacrifice!', ref: 'Psalm 141:2' },
      { text: 'If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.', ref: '1 John 1:9' },
      { text: 'Create in me a clean heart, O God, and renew a right spirit within me.', ref: 'Psalm 51:10' },
      { text: 'He who dwells in the shelter of the Most High will rest in the shadow of the Almighty.', ref: 'Psalm 91:1-2' },
      { text: 'He who keeps Israel will neither slumber nor sleep.', ref: 'Psalm 121:4' },
      { text: 'Cast all your anxieties on him, because he cares for you.', ref: '1 Peter 5:7' },
      { text: 'I will both lie down and sleep in peace, for you alone make me dwell in safety.', ref: 'Psalm 4:8' }
    ]
  },
  food: {
    name: 'Mealtime Guide',
    icon: '◈',
    scriptures: [
      { text: 'You cause the grass to grow for the livestock and plants for man to cultivate, that he may bring forth food from the earth.', ref: 'Psalm 104:14-15' },
      { text: 'He gives food to all flesh, for his steadfast love endures forever.', ref: 'Psalm 136:25' },
      { text: 'Give us this day our daily bread.', ref: 'Matthew 6:11' },
      { text: 'And you shall eat and be full, and you shall bless the LORD your God for the good land he has given you.', ref: 'Deuteronomy 8:10' },
      { text: 'Man shall not live by bread alone, but by every word that comes from the mouth of God.', ref: 'Matthew 4:4' },
      { text: 'I am the bread of life; whoever comes to me shall not hunger.', ref: 'John 6:35' }
    ]
  },
  jabez: {
    name: 'Jabez Guide',
    icon: '◈',
    scriptures: [
      { text: 'Jabez called upon the God of Israel, saying, "Oh that you would bless me and enlarge my border!"', ref: '1 Chronicles 4:10' },
      { text: '"And that your hand might be with me, and that you would keep me from harm so that it might not bring me pain!"', ref: '1 Chronicles 4:10' },
      { text: 'And God granted what he asked.', ref: '1 Chronicles 4:10' },
      { text: 'Lord, bless me indeed. Enlarge my territory. Let your hand be with me. Keep me from evil.', ref: 'Personalized Jabez Prayer' }
    ]
  },
  messiah: {
    name: "The Lord's Prayer",
    icon: '☩',
    scriptures: [
      { text: 'Our Father in heaven, hallowed be your name.', ref: 'Matthew 6:9' },
      { text: 'Your kingdom come, your will be done, on earth as it is in heaven.', ref: 'Matthew 6:10' },
      { text: 'Give us this day our daily bread.', ref: 'Matthew 6:11' },
      { text: 'And forgive us our debts, as we also have forgiven our debtors.', ref: 'Matthew 6:12' },
      { text: 'And lead us not into temptation, but deliver us from evil.', ref: 'Matthew 6:13' },
      { text: 'For yours is the kingdom, and the power, and the glory, forever. Amen.', ref: 'Matthew 6:13' }
    ]
  },
  solomon: {
    name: 'Prayer of Solomon',
    icon: '♛',
    scriptures: [
      { text: 'O LORD my God, you have made your servant king in place of David my father, although I am but a little child. I do not know how to go out or come in.', ref: '1 Kings 3:7' },
      { text: 'Give your servant an understanding heart to judge your people, and to discern between good and evil. For who is able to judge this great people of yours?', ref: '1 Kings 3:9' },
      { text: 'Because you have asked this, and have not asked for yourself long life or riches or the life of your enemies, but have asked for yourself understanding to discern what is right, behold, I now do according to your word.', ref: '1 Kings 3:11-12' },
      { text: 'But will God indeed dwell with man on the earth? Behold, heaven and the highest heaven cannot contain you, how much less this house that I have built!', ref: '2 Chronicles 6:18' },
      { text: 'Now, O my God, let your eyes be open and your ears attentive to the prayer of this place.', ref: '2 Chronicles 6:40' },
      { text: 'O LORD God, do not turn away the face of your anointed one! Remember your steadfast love for David your servant.', ref: '2 Chronicles 6:42' }
    ]
  }
};

let currentGuidedPrayer = 'morning';
let currentGuidedStep = 0;
let guidedTotalSteps = 0;

// ─── ENTER GUIDED PRAYER DIRECTLY ──────────────
function enterGuidedPrayer(prayerId) {
  if (!GUIDED_PRAYERS[prayerId]) return;

  // Set current guided prayer — resume where we left off if this prayer
  // is already active, instead of restarting it from step 0.
  const resuming = D._guidedActive && D._guidedPrayer === prayerId;
  currentGuidedPrayer = prayerId;
  currentGuidedStep = resuming ? (D._guidedStep || 0) : 0;

  // Get the prayer data
  const prayer = GUIDED_PRAYERS[prayerId];
  const scripture = prayer.scriptures[currentGuidedStep];
  
  // Replace names in scripture
  let text = scripture.text;
  text = replaceGodName(text);
  text = replaceMessiahName(text);
  
  // Set the sanctuary verse
  const solVerse = $('solVerse');
  const solRef = $('solRef');
  if (solVerse) solVerse.textContent = '"' + text + '"';
  if (solRef) solRef.textContent = '— ' + scripture.ref;
  
  // CLOSE THE GUIDED PANEL FIRST
  const panel = $('guidedPanel');
  if (panel) panel.classList.remove('open');
  
  // Reset dock highlighting
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navWorld2 = $('navWorld');
  if (navWorld2) navWorld2.classList.add('active');

  // Store guided state (must be set before enterSanctuary() so it knows
  // to keep showing this guided step instead of a generic mode scripture)
  D._guidedActive = true;
  D._guidedPrayer = prayerId;
  D._guidedStep = currentGuidedStep;
  saveLocal();

  // Enter sanctuary
  enterSanctuary('petition');

  // Update the guided panel display (for when reopened)
  renderGuidedPrayers();
  
  toast('✦ Entering Sanctuary with ' + prayer.name);
}

// ─── RENDER GUIDED PRAYERS ──────────────────────
function renderGuidedPrayers() {
  const container = $('guidedContent');
  if (!container) return;

  const prayer = GUIDED_PRAYERS[currentGuidedPrayer];
  if (!prayer) return;

  const total = prayer.scriptures.length;
  guidedTotalSteps = total;

  const progress = $('guidedProgress');
  const verse = $('guidedVerse');
  const ref = $('guidedRef');
  const prevBtn = $('guidedPrev');
  const nextBtn = $('guidedNext');

  if (progress) progress.textContent = (currentGuidedStep + 1) + ' / ' + total;
  
  const scripture = prayer.scriptures[currentGuidedStep];
  if (verse) {
    let text = scripture.text;
    text = replaceGodName(text);
    text = replaceMessiahName(text);
    verse.textContent = '"' + text + '"';
  }
  if (ref) {
    let text = scripture.ref;
    text = replaceGodName(text);
    text = replaceMessiahName(text);
    ref.textContent = '— ' + text;
  }

  if (prevBtn) prevBtn.disabled = currentGuidedStep === 0;
  if (nextBtn) nextBtn.disabled = currentGuidedStep >= total - 1;

  document.querySelectorAll('.guided-card').forEach(card => {
    card.classList.toggle('active', card.dataset.prayer === currentGuidedPrayer);
  });

  document.querySelectorAll('.guided-card .guided-action').forEach(el => {
    const card = el.closest('.guided-card');
    if (card && card.dataset.prayer === currentGuidedPrayer) {
      el.textContent = '[ Active ]';
    } else {
      el.textContent = '[ Enter ]';
    }
  });
}

// ─── SELECT GUIDED PRAYER ───────────────────────
function selectGuidedPrayer(prayerId) {
  enterGuidedPrayer(prayerId);
}

// ─── NAVIGATE GUIDED PRAYERS ────────────────────
function nextGuidedStep() {
  const prayer = GUIDED_PRAYERS[currentGuidedPrayer];
  if (currentGuidedStep < prayer.scriptures.length - 1) {
    currentGuidedStep++;
    const scripture = prayer.scriptures[currentGuidedStep];
    let text = scripture.text;
    text = replaceGodName(text);
    text = replaceMessiahName(text);
    
    const solVerse = $('solVerse');
    const solRef = $('solRef');
    if (solVerse) solVerse.textContent = '"' + text + '"';
    if (solRef) solRef.textContent = '— ' + scripture.ref;
    
    D._guidedStep = currentGuidedStep;
    saveLocal();
    
    renderGuidedPrayers();
  }
}

function prevGuidedStep() {
  if (currentGuidedStep > 0) {
    currentGuidedStep--;
    const scripture = GUIDED_PRAYERS[currentGuidedPrayer].scriptures[currentGuidedStep];
    let text = scripture.text;
    text = replaceGodName(text);
    text = replaceMessiahName(text);
    
    const solVerse = $('solVerse');
    const solRef = $('solRef');
    if (solVerse) solVerse.textContent = '"' + text + '"';
    if (solRef) solRef.textContent = '— ' + scripture.ref;
    
    D._guidedStep = currentGuidedStep;
    saveLocal();

    renderGuidedPrayers();
  }
}

// ─── ADVANCE GUIDED PRAYER FROM WITHIN SANCTUARY ─
function advanceSanctuaryGuidedStep() {
  if (!D._guidedActive || !D._guidedPrayer || !GUIDED_PRAYERS[D._guidedPrayer]) return;

  const prayer = GUIDED_PRAYERS[D._guidedPrayer];
  const total = prayer.scriptures.length;
  const step = D._guidedStep || 0;

  if (step < total - 1) {
    const nextStep = step + 1;
    const scripture = prayer.scriptures[nextStep];
    let text = scripture.text;
    text = replaceGodName(text);
    text = replaceMessiahName(text);

    const solVerse = $('solVerse');
    const solRef = $('solRef');
    if (solVerse) solVerse.textContent = '"' + text + '"';
    if (solRef) solRef.textContent = '— ' + scripture.ref;

    currentGuidedPrayer = D._guidedPrayer;
    currentGuidedStep = nextStep;
    D._guidedStep = nextStep;
    saveLocal();
    renderGuidedPrayers();
  } else {
    D._guidedActive = false;
    D._guidedPrayer = null;
    D._guidedStep = 0;
    saveLocal();
    toast('✦ Guided prayer complete');
    renderGuidedPrayers();
  }

  updateSanctuaryGuidedNav();
}
window.advanceSanctuaryGuidedStep = advanceSanctuaryGuidedStep;

// ─── SYNC SANCTUARY NEXT-STEP BUTTON ─────────────
function updateSanctuaryGuidedNav() {
  const btn = $('sanctuaryGuidedNext');
  if (!btn) return;

  if (D._guidedActive && D._guidedPrayer && GUIDED_PRAYERS[D._guidedPrayer]) {
    const total = GUIDED_PRAYERS[D._guidedPrayer].scriptures.length;
    const step = D._guidedStep || 0;
    btn.classList.add('visible');
    btn.textContent = (step < total - 1) ? `Next · ${step + 2} / ${total}` : 'Amen';
  } else {
    btn.classList.remove('visible');
    btn.textContent = '';
  }
}
window.updateSanctuaryGuidedNav = updateSanctuaryGuidedNav;

// ─── PRAY GUIDED PRAYER ─────────────────────────
function prayGuidedPrayer() {
  const prayer = GUIDED_PRAYERS[currentGuidedPrayer];
  const scripture = prayer.scriptures[currentGuidedStep];

  let text = scripture.text;
  text = replaceGodName(text);
  text = replaceMessiahName(text);

  // Mark this prayer as the active guided prayer, then enter the Sanctuary
  // so the rest of the guided flow happens in the immersive view.
  D._guidedActive = true;
  D._guidedPrayer = currentGuidedPrayer;
  D._guidedStep = currentGuidedStep;
  saveLocal();

  const panel = $('guidedPanel');
  if (panel) panel.classList.remove('open');
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navWorld3 = $('navWorld');
  if (navWorld3) navWorld3.classList.add('active');

  if (!isSanctuaryActive) enterSanctuary('petition');

  const entry = {
    id: Date.now(),
    text: text,
    mode: 'petition',
    city: D.currentCity ? D.currentCity.name : 'Global',
    timestamp: new Date().toISOString(),
    answered: false,
    testimony: '',
    solSec: 0,
    tags: ['guided', currentGuidedPrayer],
    isGuided: true
  };

  D.entries.unshift(entry);
  updateStreak();
  saveLocal();
  renderDNA();

  toast('✦ Guided prayer lifted');
  vibrate();

  if (currentGuidedStep < prayer.scriptures.length - 1) {
    setTimeout(() => {
      currentGuidedStep++;
      const nextScripture = prayer.scriptures[currentGuidedStep];
      let nextText = nextScripture.text;
      nextText = replaceGodName(nextText);
      nextText = replaceMessiahName(nextText);
      
      const solVerse = $('solVerse');
      const solRef = $('solRef');
      if (solVerse) solVerse.textContent = '"' + nextText + '"';
      if (solRef) solRef.textContent = '— ' + nextScripture.ref;
      
      D._guidedStep = currentGuidedStep;
      saveLocal();
      
      renderGuidedPrayers();
    }, 1200);
  } else {
    toast('✦ All prayers complete!');
    setTimeout(() => {
      D._guidedActive = false;
      D._guidedPrayer = null;
      D._guidedStep = 0;
      saveLocal();
    }, 2000);
  }
}

// ─── INIT GUIDED PRAYERS ────────────────────────
function initGuidedPrayers() {
  // Card click handlers - DIRECT open
  document.querySelectorAll('.guided-card').forEach(card => {
    card.addEventListener('click', function(e) {
      e.stopPropagation();
      const prayerId = this.dataset.prayer;
      if (prayerId && GUIDED_PRAYERS[prayerId]) {
        // Directly enter sanctuary with this prayer
        enterGuidedPrayer(prayerId);
      }
    });
  });

  const prevBtn = $('guidedPrev');
  const nextBtn = $('guidedNext');
  const prayBtn = $('guidedPrayBtn');

  if (prevBtn) prevBtn.addEventListener('click', prevGuidedStep);
  if (nextBtn) nextBtn.addEventListener('click', nextGuidedStep);
  if (prayBtn) prayBtn.addEventListener('click', prayGuidedPrayer);

  renderGuidedPrayers();
}

// ─── OPEN GUIDED PANEL ──────────────────────────
function openGuidedPanel() {
  const panel = $('guidedPanel');
  if (panel) {
    // If sanctuary is active, leave it first
    if (isSanctuaryActive) {
      leaveSanctuary();
    }
    renderGuidedPrayers();
    panel.classList.add('open');
  }
}

function closeGuidedPanel() {
  const panel = $('guidedPanel');
  if (panel) {
    panel.classList.remove('open');
  }
  // Reset dock highlighting
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const navWorld2 = $('navWorld');
  if (navWorld2) navWorld2.classList.add('active');
}

// ─── DOCK NAVIGATION - GUIDED ──────────────────
const navGuided = $('navGuided');
if (navGuided) {
  navGuided.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    
    const dnaPanel = $('dnaPanel');
    const requestsPanel = $('requestsPanel');
    if (dnaPanel && dnaPanel.classList.contains('open')) dnaPanel.classList.remove('open');
    if (requestsPanel && requestsPanel.classList.contains('open')) requestsPanel.classList.remove('open');
    
    openGuidedPanel();
  });
}

// ─── CLOSE GUIDED BUTTON ────────────────────────
const closeGuidedBtn = $('closeGuided');
if (closeGuidedBtn) {
  closeGuidedBtn.addEventListener('click', function() {
    closeGuidedPanel();
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navWorld2 = $('navWorld');
    if (navWorld2) navWorld2.classList.add('active');
  });
}

// ─── PRESETS - INIT ──────────────────────────────
function initPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const god = this.dataset.god;
      const messiah = this.dataset.messiah;
      
      D.godName = god;
      document.querySelectorAll('input[name="godName"]').forEach(input => {
        input.checked = input.value === god;
      });
      
      D.messiahName = messiah;
      document.querySelectorAll('input[name="messiahName"]').forEach(input => {
        input.checked = input.value === messiah;
      });
      
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      saveLocal();
      updateGodNameInUI();
      updateMessiahNameInUI();
      updateSettingsUI();
      
      const nameEl = this.querySelector('.preset-name');
      const subEl = this.querySelector('.preset-sub');
      const label = nameEl ? nameEl.textContent : '';
      const sub = subEl ? subEl.textContent : '';
      toast('✦ Preset applied: ' + label + ' ' + sub);
    });
  });
}

// ─── UPDATE PRESET HIGHLIGHT ────────────────────
function updatePresetHighlight() {
  const currentGod = getGodName();
  const currentMessiah = getMessiahName();
  
  document.querySelectorAll('.preset-btn').forEach(btn => {
    const god = btn.dataset.god;
    const messiah = btn.dataset.messiah;
    btn.classList.toggle('active', god === currentGod && messiah === currentMessiah);
  });
}

// ─── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  applyTheme(D.theme || 'light');

  buildModeTrack();
  updateMode();
  renderDNA();
  renderRequests();
  initMap();
  initMapIncenseFeed();

  if (D.confessions) {
    D.confessions.forEach(() => addAshMark());
  }
  const note = $('confNote');
  if (note) note.textContent = (D.confBurnt || 0);

  // Initialize Name Systems
  initSettings();
  initAboutModal();
  updateMessiahNameInUI();
  updateGodNameInUI();
  updateSettingsUI();

  // Initialize Guided Prayers
  initGuidedPrayers();

  // Restore guided state if active
  if (D._guidedActive && D._guidedPrayer) {
    currentGuidedPrayer = D._guidedPrayer;
    currentGuidedStep = D._guidedStep || 0;
    const prayer = GUIDED_PRAYERS[currentGuidedPrayer];
    if (prayer) {
      const scripture = prayer.scriptures[currentGuidedStep];
      let text = scripture.text;
      text = replaceGodName(text);
      text = replaceMessiahName(text);
      const solVerse = $('solVerse');
      const solRef = $('solRef');
      if (solVerse) solVerse.textContent = '"' + text + '"';
      if (solRef) solRef.textContent = '— ' + scripture.ref;
    }
  }

  // Show tutorial on first launch
  if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
    setTimeout(function() {
      startTutorial();
    }, 600);
  }

  console.log('✨ Palal v2.0 loaded with Name Systems & Guided Prayers');
  console.log('Messiah name:', getMessiahName());
  console.log('God name:', getGodName());
});

window.addEventListener('resize', function() {
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
  // ─── CLICK OUTSIDE TO CLOSE CITY OVERLAY ───
  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('cityOverlay');
    if (overlay && overlay.classList.contains('show')) {
      // If click is outside the overlay and outside map markers, close it
      if (!overlay.contains(e.target) && !e.target.closest('.leaflet-marker-icon')) {
        overlay.classList.remove('show');
      }
    }
  });
});


// ─── EXPOSE GLOBALLY ────────────────────────────
window.toast = toast;
window.openCountryModal = openCountryModal;
window.closeCountryModal = closeCountryModal;
window.submitRequest = submitRequest;
window.prayForRequest = prayForRequest;
window.prayForCountry = prayForCountry;
window.deleteEntry = deleteEntry;
window.prayForMapPoint = prayForMapPoint;
window.getMessiahName = getMessiahName;
window.replaceMessiahName = replaceMessiahName;
window.updateMessiahNameInUI = updateMessiahNameInUI;
window.getGodName = getGodName;
window.replaceGodName = replaceGodName;
window.updateGodNameInUI = updateGodNameInUI;
window.prayWithOthers = prayWithOthers;
window.replayTutorial = function() {
  localStorage.removeItem(TUTORIAL_SEEN_KEY);
  startTutorial();
};
window.selectGuidedPrayer = selectGuidedPrayer;
window.nextGuidedStep = nextGuidedStep;
window.prevGuidedStep = prevGuidedStep;
window.prayGuidedPrayer = prayGuidedPrayer;
// ═══════════════════════════════════════════════
//  TAW — Bible Name Game (Integrated)
//  Uses Palal's design tokens and toast system
// ═══════════════════════════════════════════════

(function() {
  'use strict';

  // ─── TAW DOM REFS ─────────────────────────────
  const tawPanel = document.getElementById('tawPanel');
  const tawWord = document.getElementById('tawWord');
  const tawSub = document.getElementById('tawSub');
  const tawInput = document.getElementById('tawInput');
  const tawReqLetter = document.getElementById('tawReqLetter');
  const tawReqCount = document.getElementById('tawReqCount');
  const tawScore = document.getElementById('tawScore');
  const tawStrikeDots = document.querySelectorAll('.taw-strike-dot');
  const tawModesMenu = document.getElementById('tawModesMenu');
  const tawModeChips = document.querySelectorAll('.taw-mode-chip');
  const tawGameOver = document.getElementById('tawGameOver');
  const tawGoTitle = document.getElementById('tawGoTitle');
  const tawGoSub = document.getElementById('tawGoSub');
  const tawGoPoints = document.getElementById('tawGoPoints');
  const tawGoNames = document.getElementById('tawGoNames');
  const tawGoBooks = document.getElementById('tawGoBooks');
  const tawGoStreak = document.getElementById('tawGoStreak');
  const tawGoBtn = document.getElementById('tawGoBtn');

  const tawHintBtn = document.getElementById('tawHintBtn');
  const tawSkipBtn = document.getElementById('tawSkipBtn');
  const tawModesBtn = document.getElementById('tawModesBtn');
// ─── BIBLE NAMES DATA ────────────────────────────
// taw-names.json: 1,814 biblical names mapped to the books they appear in,
// derived from theographic-bible-metadata (CC BY-SA 4.0, robertrouse/theographic-bible-metadata).

const TAW_BACKUP_NAMES = {
  "adam":["Genesis"], "eve":["Genesis"], "noah":["Genesis"], "abraham":["Genesis"],
  "sarah":["Genesis"], "isaac":["Genesis"], "jacob":["Genesis"], "joseph":["Genesis"],
  "moses":["Exodus"], "aaron":["Exodus"], "joshua":["Joshua"], "ruth":["Ruth"],
  "samuel":["1 Samuel"], "saul":["1 Samuel"], "david":["1 Samuel"], "solomon":["1 Kings"],
  "elijah":["1 Kings"], "elisha":["2 Kings"], "esther":["Esther"], "job":["Job"],
  "isaiah":["Isaiah"], "jeremiah":["Jeremiah"], "daniel":["Daniel"], "jonah":["Jonah"],
  "mary":["Luke"], "john":["John"], "peter":["Matthew"], "paul":["Acts"],
  "timothy":["1 Timothy"], "james":["James"], "jude":["Jude"]
};

async function loadBibleNames() {
  const response = await fetch('taw-names.json');
  if (!response.ok) throw new Error('Failed to load taw-names.json: ' + response.status);
  const data = await response.json();
  if (!data || Object.keys(data).length < 20) throw new Error('taw-names.json returned too few names');
  return data;
}

async function getTawNames() {
  try {
    return await loadBibleNames();
  } catch (e) {
    console.warn('TAW: using backup name list —', e.message);
    return TAW_BACKUP_NAMES;
  }
}
window.getTawNames = getTawNames;
  // ─── TAW STATE ──────────────────────────────────
  const TAW_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
    "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
    "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
    "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
    "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
  ];

  const SHORT_BOOKS = new Set([
    'Obadiah', 'Jude', 'Jonah', 'Nahum', 'Habakkuk', 'Zephaniah',
    'Haggai', 'Malachi', 'Philemon', '2 John', '3 John', 'Ruth', 'Esther'
  ]);

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // ─── TAW NAME DATABASE ──────────────────────────
  // Populated at runtime via getTawNames() (API with local backup)
  let TAW_NAMES = {};

  // Build indexes
  const tawNameIndexByLetter = {};
  const tawNameIndexByBook = {};

  function rebuildTawIndexes() {
    ALPHABET.forEach(l => tawNameIndexByLetter[l.toLowerCase()] = []);
    TAW_BOOKS.forEach(b => tawNameIndexByBook[b] = []);

    for (const [name, books] of Object.entries(TAW_NAMES)) {
      const firstLetter = name.charAt(0).toLowerCase();
      if (tawNameIndexByLetter[firstLetter]) tawNameIndexByLetter[firstLetter].push(name);
      books.forEach(book => {
        if (tawNameIndexByBook[book]) tawNameIndexByBook[book].push(name);
      });
    }
  }
  window.rebuildTawIndexes = rebuildTawIndexes;

  // ─── TAW MODES ──────────────────────────────────
  const TAW_MODES = {
    CHAIN: 'chain',
    STORM: 'storm',
    COLLECTOR: 'collector',
    ALPHABET: 'alphabet',
    TIMEATTACK: 'timeattack'
  };

  const STARTER_NAMES = ["Adam", "Abraham", "Moses", "David", "Isaiah", "Daniel", "Peter", "Paul", "Ruth", "John"];

  // ─── TAW GAME STATE ─────────────────────────────
  let tawGameActive = false;
  let tawCurrentMode = TAW_MODES.CHAIN;
  let tawCurrentName = "";
  let tawUsedNames = new Set();
  let tawUsedNameList = [];
  let tawCompletedBooks = new Set();
  let tawBookContribution = {};
  let tawStrikes = 0;
  let tawStreak = 0;
  let tawPoints = 0;
  let tawSkips = 3;
  let tawHints = 3;
  let tawAlphabetIndex = 0;
  let tawStormLetter = '';
  let tawCollectorIndex = 0;
  let tawTimer = 60;
  let tawTimerInterval = null;
  let tawDeadEndLetter = null;
  let tawLastBook = null;
  let tawSameBookCount = 0;
  let tawIsTimeAttack = false;

  // ─── TAW HELPERS ────────────────────────────────
  function getTawEntryBooks(nameLower) {
    return TAW_NAMES[nameLower] || null;
  }

  function getTawTargetBook(nameLower, completed) {
    const books = getTawEntryBooks(nameLower);
    if (!books) return null;
    for (let i = 0; i < books.length; i++) {
      if (!completed.has(books[i])) return books[i];
    }
    return books[0];
  }

  function getTawChainLetter(name, deadEnd) {
    if (deadEnd) return deadEnd;
    if (!name) return null;
    const lower = name.toLowerCase();
    let letter = lower.slice(-1);
    if (lower.endsWith('ah')) letter = 'a';
    return letter;
  }

 // ─── TAW SYNC UI ─────────────────────────────────
function syncTawUI() {
  // Update the main word display
  tawWord.textContent = tawCurrentName || 'TAW';
  tawWord.classList.remove('pop');
  if (tawCurrentName) setTimeout(() => tawWord.classList.add('pop'), 10);

  // Update the sub title (book name)
  if (tawCurrentName) {
    const book = getTawTargetBook(tawCurrentName.toLowerCase(), tawCompletedBooks);
    tawSub.textContent = book ? book : 'Complete';
  } else {
    tawSub.textContent = '—';
  }

  // Update score
  tawScore.textContent = `${tawCompletedBooks.size} / 66`;

  // Update requirement display
  let reqChar = '—';
  let countText = '0 remaining';
  
  if (tawCurrentMode === TAW_MODES.CHAIN && tawCurrentName) {
    reqChar = getTawChainLetter(tawCurrentName, tawDeadEndLetter);
    if (reqChar && tawNameIndexByLetter[reqChar]) {
      const rem = tawNameIndexByLetter[reqChar].filter(n => !tawUsedNames.has(n)).length || 0;
      countText = `${rem} remaining`;
    } else {
      countText = 'No names available';
    }
  } else if (tawCurrentMode === TAW_MODES.STORM) {
    reqChar = tawStormLetter || '?';
    if (tawNameIndexByLetter[reqChar]) {
      const rem = tawNameIndexByLetter[reqChar].filter(n => !tawUsedNames.has(n)).length || 0;
      countText = `${rem} remaining`;
    } else {
      countText = 'No names available';
    }
  } else if (tawCurrentMode === TAW_MODES.COLLECTOR) {
    reqChar = '◆';
    countText = TAW_BOOKS[tawCollectorIndex] || 'Complete';
  } else if (tawCurrentMode === TAW_MODES.ALPHABET) {
    reqChar = ALPHABET[tawAlphabetIndex] || '✓';
    countText = tawAlphabetIndex >= ALPHABET.length ? 'Complete' : `${26 - tawAlphabetIndex} left`;
  } else if (tawCurrentMode === TAW_MODES.TIMEATTACK) {
    reqChar = '◈';
    countText = `${tawTimer}s`;
  }
  
  tawReqLetter.textContent = typeof reqChar === 'string' ? reqChar.toUpperCase() : reqChar;
  tawReqCount.textContent = countText;

  // Update strike dots
  tawStrikeDots.forEach((dot, idx) => {
    dot.className = 'taw-strike-dot';
    if (idx < tawStrikes) {
      dot.classList.add('filled');
      if (idx === tawStrikes - 1) dot.classList.add('danger');
    }
  });

   // Modes
  tawModeChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.tawMode === tawCurrentMode);
  });
}

function tawToast(message) {
    if (window.toast) {
      window.toast(message);
    } else {
      console.log('TAW:', message);
    }
  }

  // ─── TAW CORE LOGIC ─────────────────────────────
  function tawAddStrike() {
    tawStrikes++;
    syncTawUI();
    if (tawStrikes >= 3) {
      tawToast('Game Over — 3 Strikes');
      tawHandleGameOver('3 Strikes', false);
      return true;
    }
    tawToast(`Strike ${tawStrikes}/3`);
    return false;
  }

  function tawHandleGameOver(reason, victory = false) {
    tawGameActive = false;
    if (tawTimerInterval) { clearInterval(tawTimerInterval); tawTimerInterval = null; }
    tawGoTitle.textContent = victory ? 'Victory' : 'Journey Ended';
    tawGoSub.textContent = victory ? 'The path is complete.' : reason || 'The path has closed.';
    tawGoPoints.textContent = tawPoints;
    tawGoNames.textContent = tawUsedNameList.length;
    tawGoBooks.textContent = `${tawCompletedBooks.size}/66`;
    tawGoStreak.textContent = tawStreak;
    tawGameOver.classList.add('visible');
    syncTawUI();
  }

  function tawTeardown() {
    tawGameActive = false;
    if (tawTimerInterval) { clearInterval(tawTimerInterval); tawTimerInterval = null; }
    tawUsedNames.clear();
    tawUsedNameList = [];
    tawCompletedBooks.clear();
    tawBookContribution = {};
    TAW_BOOKS.forEach(b => tawBookContribution[b] = 0);
    tawStrikes = 0;
    tawStreak = 0;
    tawPoints = 0;
    tawSkips = 3;
    tawHints = 3;
    tawAlphabetIndex = 0;
    tawStormLetter = '';
    tawCollectorIndex = 0;
    tawTimer = 60;
    tawDeadEndLetter = null;
    tawCurrentName = "";
    tawIsTimeAttack = false;
    tawLastBook = null;
    tawSameBookCount = 0;
    tawGameOver.classList.remove('visible');
    syncTawUI();
  }

  function tawInitMode(mode) {
    TAW_NAMES = window.TAW_NAMES || {};
    tawTeardown();
    tawCurrentMode = mode;
    tawGameActive = true;

    if (mode === TAW_MODES.CHAIN) {
      const seed = STARTER_NAMES[Math.floor(Math.random() * STARTER_NAMES.length)];
      tawCommitEntry(seed.toLowerCase(), true);
    } else if (mode === TAW_MODES.STORM) {
      tawStormLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)].toLowerCase();
      syncTawUI();
    } else if (mode === TAW_MODES.COLLECTOR) {
      tawCollectorIndex = 0;
      syncTawUI();
    } else if (mode === TAW_MODES.ALPHABET) {
      tawAlphabetIndex = 0;
      syncTawUI();
    } else if (mode === TAW_MODES.TIMEATTACK) {
      tawIsTimeAttack = true;
      tawTimer = 60;
      syncTawUI();
      tawTimerInterval = setInterval(() => {
        tawTimer--;
        syncTawUI();
        if (tawTimer <= 0) {
          clearInterval(tawTimerInterval);
          tawTimerInterval = null;
          tawToast('Time Expired');
          tawHandleGameOver('Time Expired', false);
        }
      }, 1000);
    }

    tawInput.focus();
    tawToast(`Mode: ${mode.toUpperCase()}`);
  }

  function tawCommitEntry(nameLower, isInitialSeed = false) {
    const displayForm = nameLower.charAt(0).toUpperCase() + nameLower.slice(1);
    tawUsedNames.add(nameLower);
    tawUsedNameList.push(displayForm);
    tawCurrentName = displayForm;

    const mappedBook = getTawTargetBook(nameLower, tawCompletedBooks);
    if (mappedBook) {
      if (tawLastBook === mappedBook) {
        tawSameBookCount++;
        if (tawSameBookCount >= 3) {
          tawToast('3 same books in a row — Strike');
          tawAddStrike();
          tawSameBookCount = 0;
          tawLastBook = null;
        }
      } else {
        tawSameBookCount = 1;
        tawLastBook = mappedBook;
      }

      tawBookContribution[mappedBook] = (tawBookContribution[mappedBook] || 0) + 1;
      const limit = SHORT_BOOKS.has(mappedBook) ? 1 : 3;
      if (tawBookContribution[mappedBook] >= limit && !tawCompletedBooks.has(mappedBook)) {
        tawCompletedBooks.add(mappedBook);
        tawPoints += 5;
        tawSkips += 1;
        tawToast(`Book Complete: ${mappedBook}`);
      }
    } else {
      tawLastBook = null;
      tawSameBookCount = 0;
    }

    if (!isInitialSeed) {
      tawStreak++;
      tawPoints += 10 + (tawStreak > 5 ? 5 : 0);
    }

    // Mode-specific logic
    if (tawCurrentMode === TAW_MODES.CHAIN) {
      let trail = nameLower.slice(-1);
      if (nameLower.endsWith('ah')) trail = 'a';
      const hasOptions = tawNameIndexByLetter[trail]?.some(n => !tawUsedNames.has(n));
      if (!hasOptions) {
        const viable = ALPHABET
          .map(l => l.toLowerCase())
          .filter(l => tawNameIndexByLetter[l]?.some(n => !tawUsedNames.has(n)));
        tawDeadEndLetter = viable.length ? viable[Math.floor(Math.random() * viable.length)] : null;
        if (tawDeadEndLetter) {
          tawToast(`"${trail.toUpperCase()}" dry — try "${tawDeadEndLetter.toUpperCase()}"`);
        }
      } else {
        tawDeadEndLetter = null;
      }
    } else if (tawCurrentMode === TAW_MODES.STORM) {
      tawStormLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)].toLowerCase();
    } else if (tawCurrentMode === TAW_MODES.COLLECTOR) {
      if (mappedBook === TAW_BOOKS[tawCollectorIndex]) {
        tawCompletedBooks.add(TAW_BOOKS[tawCollectorIndex]);
        tawCollectorIndex++;
        if (tawCollectorIndex >= TAW_BOOKS.length) {
          tawHandleGameOver('All Books Gathered', true);
        }
      }
    } else if (tawCurrentMode === TAW_MODES.ALPHABET) {
      tawAlphabetIndex++;
      if (tawAlphabetIndex >= ALPHABET.length) {
        tawHandleGameOver('Alphabet Complete', true);
      }
    }

    if (tawCompletedBooks.size >= TAW_BOOKS.length) {
      tawHandleGameOver('Perfect Canon', true);
    }

    syncTawUI();
  }

  function tawProcessInput() {
    if (!tawGameActive) return;
    const raw = tawInput.value.trim().toLowerCase();
    tawInput.value = '';
    if (!raw) return;

    // Check if name exists
    if (!TAW_NAMES[raw]) {
      tawToast('Name not found');
      tawInput.classList.add('invalid');
      setTimeout(() => tawInput.classList.remove('invalid'), 400);
      tawAddStrike();
      return;
    }

    if (tawUsedNames.has(raw)) {
      tawToast('Already used');
      tawInput.classList.add('invalid');
      setTimeout(() => tawInput.classList.remove('invalid'), 400);
      tawAddStrike();
      return;
    }

    // Mode validation
    let pass = false;
    if (tawCurrentMode === TAW_MODES.CHAIN) {
      pass = raw.charAt(0) === getTawChainLetter(tawCurrentName, tawDeadEndLetter);
    } else if (tawCurrentMode === TAW_MODES.STORM) {
      pass = raw.charAt(0) === tawStormLetter;
    } else if (tawCurrentMode === TAW_MODES.COLLECTOR) {
      pass = TAW_NAMES[raw].includes(TAW_BOOKS[tawCollectorIndex]);
    } else if (tawCurrentMode === TAW_MODES.ALPHABET) {
      pass = raw.charAt(0) === ALPHABET[tawAlphabetIndex].toLowerCase();
    } else if (tawCurrentMode === TAW_MODES.TIMEATTACK) {
      pass = true;
    }

    if (!pass) {
      tawToast('Letter constraint violation');
      tawInput.classList.add('invalid');
      setTimeout(() => tawInput.classList.remove('invalid'), 400);
      tawAddStrike();
      return;
    }

    tawCommitEntry(raw);
    tawToast(raw.toUpperCase());
  }

  function tawUseSkip() {
    if (!tawGameActive) return;
    if (tawSkips > 0) {
      tawSkips--;
      tawStreak = 0;
      // Bypass
      if (tawCurrentMode === TAW_MODES.CHAIN) {
        const target = getTawChainLetter(tawCurrentName, tawDeadEndLetter);
        const fallbackList = (target && tawNameIndexByLetter[target]) || STARTER_NAMES.map(n => n.toLowerCase());
        const found = fallbackList.find(n => !tawUsedNames.has(n));
        if (found) tawCommitEntry(found, true);
      } else if (tawCurrentMode === TAW_MODES.STORM) {
        tawStormLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)].toLowerCase();
      } else if (tawCurrentMode === TAW_MODES.COLLECTOR) {
        tawCollectorIndex++;
        if (tawCollectorIndex >= TAW_BOOKS.length) tawHandleGameOver('All Books Gathered', true);
      } else if (tawCurrentMode === TAW_MODES.ALPHABET) {
        tawAlphabetIndex++;
        if (tawAlphabetIndex >= ALPHABET.length) tawHandleGameOver('Alphabet Complete', true);
      }
      tawToast('Skip used');
      syncTawUI();
    } else {
      tawToast('No skips — Strike');
      tawAddStrike();
    }
  }

  function tawUseHint() {
    if (!tawGameActive || tawHints <= 0) {
      tawToast('No hints left');
      return;
    }
    let targetPool = [];
    if (tawCurrentMode === TAW_MODES.CHAIN) {
      targetPool = tawNameIndexByLetter[getTawChainLetter(tawCurrentName, tawDeadEndLetter)];
    } else if (tawCurrentMode === TAW_MODES.STORM) {
      targetPool = tawNameIndexByLetter[tawStormLetter];
    } else if (tawCurrentMode === TAW_MODES.COLLECTOR) {
      targetPool = tawNameIndexByBook[TAW_BOOKS[tawCollectorIndex]];
    } else if (tawCurrentMode === TAW_MODES.ALPHABET) {
      targetPool = tawNameIndexByLetter[ALPHABET[tawAlphabetIndex].toLowerCase()];
    } else if (tawCurrentMode === TAW_MODES.TIMEATTACK) {
      targetPool = Object.keys(TAW_NAMES);
    }
    const match = targetPool?.find(n => !tawUsedNames.has(n));
    if (match) {
      tawHints--;
      tawToast(`Hint: ${match.toUpperCase()}`);
      syncTawUI();
    } else {
      tawToast('No names left');
    }
  }

  // ─── TAW EVENT LISTENERS ────────────────────────
  
  tawInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tawProcessInput();
  });

  tawModesBtn.addEventListener('click', () => {
    tawModesMenu.classList.toggle('visible');
  });

  tawModeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      tawModesMenu.classList.remove('visible');
      const mode = chip.dataset.tawMode;
      if (tawGameActive && !confirm('Switch mode? Progress lost.')) return;
      tawInitMode(mode);
    });
  });

  tawHintBtn.addEventListener('click', tawUseHint);
  tawSkipBtn.addEventListener('click', tawUseSkip);
  tawGoBtn.addEventListener('click', () => tawInitMode(tawCurrentMode));
// ─── TAW PANEL TOGGLE ────────────────────────────
function toggleTaw() {
  const panel = document.getElementById('tawPanel');
  if (!panel) return;
  
  const isOpen = panel.classList.contains('open');
  
  // Close any other open panels
  const dnaPanel = document.getElementById('dnaPanel');
  const requestsPanel = document.getElementById('requestsPanel');
  const guidedPanel = document.getElementById('guidedPanel');
  
  if (dnaPanel) dnaPanel.classList.remove('open');
  if (requestsPanel) requestsPanel.classList.remove('open');
  if (guidedPanel) guidedPanel.classList.remove('open');
  
  if (isOpen) {
    panel.classList.remove('open');
    panel.style.display = 'none';
    panel.style.pointerEvents = 'none';
  } else {
    panel.style.display = 'block';
    panel.style.pointerEvents = 'auto';
    panel.classList.add('open');
    
    // Initialize the game
    tawTeardown();
    tawInitMode('chain');
    syncTawUI();
    
    const tawInput = document.getElementById('tawInput');
    if (tawInput) setTimeout(() => tawInput.focus(), 300);
  }
  
  // Update dock
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  const nav = document.getElementById('navTaw');
  if (nav) nav.classList.add('active');
}

  // ─── INIT ────────────────────────────────────────
// Only initialize TAW when the panel is opened, not on load
// tawInitMode(TAW_MODES.CHAIN); // ← COMMENT THIS OUT

console.log('✦ TAW integrated into Palal');

// ─── EXPOSE TAW GLOBALLY ─────────────────────────
window.tawTeardown = tawTeardown;
window.tawInitMode = tawInitMode;
window.syncTawUI = syncTawUI;
window.tawProcessInput = tawProcessInput;
window.tawUseHint = tawUseHint;
window.tawUseSkip = tawUseSkip;
window.toggleTaw = toggleTaw;
window.TAW_MODES = TAW_MODES;
//.script.js 
})();
