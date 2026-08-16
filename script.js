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
  globalCounter: 12847,
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
let tooltipTimeout = null;

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
    const globalCounter = $('globalCounter');
    if (mapPanel) mapPanel.classList.add('hidden');
    if (stageAxis) stageAxis.classList.remove('hidden');
    if (globalCounter) globalCounter.classList.add('hidden');

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

  D.globalCounter = (D.globalCounter || 12847) + 1;
  saveLocal();
  const counter = document.querySelector('.global-counter .num');
  if (counter) counter.textContent = D.globalCounter.toLocaleString();

  toast('Prayed for this request');
  vibrate();
};

// ─── DNA ─────────────────────────────────────────
function renderDNA() {
  const container = $('dnaContent');
  if (!container) return;

  const total = D.entries.length;
  const answered = D.entries.filter(e => e.answered).length;
  const conf = D.confBurnt || 0;
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

  if (total === 0 && conf === 0) {
    container.innerHTML = `
      <div class="dna-metrics">
        <div class="dna-metric"><span class="value">0</span><span class="label">Prayers</span></div>
        <div class="dna-metric"><span class="value">0</span><span class="label">Burnt</span></div>
        <div class="dna-metric"><span class="value">0m</span><span class="label">Stillness</span></div>
      </div>
      <div class="dna-empty">Start praying to see your DNA.</div>
    `;
    renderSpiderweb();
    return;
  }

  let entriesHTML = '';
  const displayEntries = D.entries.slice(0, 15);

  if (displayEntries.length > 0) {
    entriesHTML = `<div style="margin-top:0.75rem;border-top:0.5px solid var(--gold-line);padding-top:0.75rem;">
      <div style="font-size:0.4375rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--ink-mid);opacity:0.4;margin-bottom:0.5rem;">Recent Prayers</div>`;

    displayEntries.forEach((entry, idx) => {
      const modeEmoji = {
        petition: '◈',
        confession: '◐',
        thanksgiving: '✧',
        intercession: '✦',
        lament: '◌',
        adoration: '◉'
      } [entry.mode] || '◈';

      const isAnswered = entry.answered ? '✓ answered' : '';
      const cityText = entry.city && entry.city !== 'Global' ? entry.city : '';
      const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '';
      const safeText = escapeHtml(entry.text.length > 70 ? entry.text.slice(0, 70) + '…' : entry.text);
      const safeMode = escapeHtml(entry.mode);
      const safeCity = escapeHtml(cityText);
      const safeTestimony = entry.testimony ? escapeHtml(entry.testimony) : '';

      entriesHTML += `
        <div class="dna-entry" onclick="toggleDNADetail(${idx})">
          <button class="dna-delete" onclick="event.stopPropagation();deleteEntry(${idx})" aria-label="Delete prayer">✕</button>
          <div class="dna-text">"${safeText}"</div>
          <div class="dna-meta">
            <span class="mode-badge">${modeEmoji} ${safeMode}</span>
            ${isAnswered ? '<span class="answered-tag">✓ answered</span>' : ''}
            <span class="city-tag">${safeCity ? '· ' + safeCity : ''}</span>
            <span style="opacity:0.4;">${date}</span>
          </div>
          <div class="dna-testimony ${entry.testimony ? 'show' : ''}" id="testimony_${idx}">
            "${safeTestimony}"
            <div class="from">— testimony</div>
          </div>
          <div class="dna-actions ${entry.testimony ? 'show' : ''}" id="actions_${idx}">
            <button class="primary" onclick="event.stopPropagation();toggleAnswer(${idx})">${entry.answered ? 'Mark unanswered' : 'Mark answered'}</button>
            <button onclick="event.stopPropagation();toggleTestimonyInput(${idx})">${entry.testimony ? 'Edit testimony' : 'Add testimony'}</button>
            <button class="danger" onclick="event.stopPropagation();deleteEntry(${idx})">Delete</button>
          </div>
          <input class="dna-testimony-input ${entry.testimony ? 'show' : ''}" id="testimonyInput_${idx}" placeholder="Write your testimony…" value="${safeTestimony}" onfocus="this.select()" />
          <div style="display:${entry.testimony ? 'none' : 'block'};margin-top:0.25rem;">
            <button class="primary" style="background:none;border:0.5px solid var(--gold-line);border-radius:99px;padding:0.125rem 0.5rem;font-size:0.3125rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-mid);cursor:pointer;min-height:28px;" onclick="event.stopPropagation();saveTestimony(${idx})">Save testimony</button>
          </div>
        </div>
      `;
    });

    if (D.entries.length > 15) {
      entriesHTML += `<div style="font-size:0.375rem;color:var(--ink-mid);opacity:0.3;text-align:center;padding-top:0.5rem;">+ ${D.entries.length - 15} more prayers</div>`;
    }

    entriesHTML += `</div>`;
  }

  container.innerHTML = `
    <div class="dna-metrics">
      <div class="dna-metric"><span class="value">${total}</span><span class="label">Prayers</span></div>
      <div class="dna-metric"><span class="value">${answered}</span><span class="label">Answered</span></div>
      <div class="dna-metric"><span class="value">${conf}</span><span class="label">Burnt</span></div>
      <div class="dna-metric"><span class="value">${Math.floor(sol/60)}m</span><span class="label">Stillness</span></div>
    </div>
    <div class="dna-empty" style="font-size:0.5rem;opacity:0.4;border-bottom:0.5px solid var(--gold-line);padding-bottom:0.75rem;">
      ${total} prayers · ${answered} answered · ${streak} day streak
    </div>
    ${entriesHTML}
  `;

  renderSpiderweb();
}

// ─── SPIDERWEB DNA ──────────────────────────────
function renderSpiderweb() {
  const container = document.getElementById('dnaSpiderweb');
  if (!container) return;

  const home = homeCity || { name: 'Madrid', lat: 40.4168, lng: -3.7038 };
  const homeLat = home.lat;
  const homeLng = home.lng;

  const prayedCountries = D.entries
    .filter(e => e.city && e.city !== 'Global' && e.city !== 'Request' && e.city !== 'Heart')
    .map(e => {
      for (const [code, profile] of Object.entries(COUNTRY_PROFILES)) {
        if (profile.name === e.city) {
          const capital = COUNTRY_CAPITALS[code];
          if (capital) {
            return {
              name: e.city,
              lat: capital.lat,
              lng: capital.lng,
              count: 1
            };
          }
        }
      }
      return null;
    })
    .filter(Boolean);

  const aggregated = {};
  prayedCountries.forEach(c => {
    if (!aggregated[c.name]) {
      aggregated[c.name] = { ...c, count: 0 };
    }
    aggregated[c.name].count++;
  });
  const uniqueCountries = Object.values(aggregated);

  if (uniqueCountries.length === 0) {
    container.innerHTML = `<div style="font-size:0.5rem;color:var(--ink-mid);opacity:0.3;text-align:center;padding:1rem 0;">Pray for countries to see your prayer journey</div>`;
    return;
  }

  const totalDistance = uniqueCountries.reduce((sum, c) => {
    const dist = getDistance(homeLat, homeLng, c.lat, c.lng);
    return sum + dist;
  }, 0);

  const width = 260;
  const height = 200;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 70;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  svg += `<circle cx="${centerX}" cy="${centerY}" r="4" class="spiderweb-center" />`;
  svg += `<text x="${centerX}" y="${centerY + 16}" text-anchor="middle" class="spiderweb-label">${home.name}</text>`;

  const maxCount = Math.max(...uniqueCountries.map(c => c.count), 1);
  uniqueCountries.forEach((c, index) => {
    const angle = (index / uniqueCountries.length) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" class="spiderweb-line" />`;

    const dotSize = 3 + (c.count / maxCount) * 3;
    svg += `<circle cx="${x}" cy="${y}" r="${dotSize}" class="spiderweb-dot" />`;

    const label = c.name.length > 8 ? c.name.slice(0, 6) + '…' : c.name;
    const labelOffset = dotSize + 6;
    const lx = x + labelOffset * Math.cos(angle);
    const ly = y + labelOffset * Math.sin(angle);
    svg += `<text x="${lx}" y="${ly}" text-anchor="${angle > Math.PI/2 && angle < 3*Math.PI/2 ? 'end' : 'start'}" class="spiderweb-label">${label}</text>`;
  });

  svg += `</svg>`;

  const distanceKm = Math.round(totalDistance);
  const distanceDisplay = distanceKm > 1000 ? (distanceKm / 1000).toFixed(1) + 'k km' : distanceKm + ' km';

  container.innerHTML = `
    ${svg}
    <div style="font-size:0.4375rem;color:var(--gold);opacity:0.5;text-align:center;margin-top:0.25rem;">
      ✦ Prayers travelled <span style="font-weight:400;">${distanceDisplay}</span>
      · ${uniqueCountries.length} countries
    </div>
  `;
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ─── DNA INTERACTIONS ────────────────────────────
window.toggleDNADetail = function(idx) {
  const entry = D.entries[idx];
  if (!entry) return;
  const testimony = document.getElementById('testimony_' + idx);
  const actions = document.getElementById('actions_' + idx);
  if (testimony) testimony.classList.toggle('show');
  if (actions) actions.classList.toggle('show');
};

window.toggleAnswer = function(idx) {
  const entry = D.entries[idx];
  if (!entry) return;
  entry.answered = !entry.answered;
  saveLocal();
  renderDNA();
  toast(entry.answered ? '✓ Marked answered' : '○ Marked awaiting');
};

window.toggleTestimonyInput = function(idx) {
  const input = document.getElementById('testimonyInput_' + idx);
  if (!input) return;
  input.classList.toggle('show');
  if (input.classList.contains('show')) {
    input.focus();
    input.select();
  }
};

window.saveTestimony = function(idx) {
  const entry = D.entries[idx];
  if (!entry) return;
  const input = document.getElementById('testimonyInput_' + idx);
  if (!input) return;
  const testimony = input.value.trim();
  if (!testimony) {
    toast('Write a testimony first');
    return;
  }
  entry.testimony = testimony;
  if (!entry.answered) entry.answered = true;
  saveLocal();
  renderDNA();
  toast('Testimony saved');
};

window.deleteEntry = function(idx) {
  const entry = D.entries[idx];
  if (!entry) return;
  if (!confirm('Delete this prayer?')) return;
  D.entries.splice(idx, 1);
  saveLocal();
  renderDNA();
  toast('✕ Prayer deleted');
};

// ─── MAP ─────────────────────────────────────────
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

  const markerClassMap = {
    'Conflict': 'conflict',
    'Restricted': 'restricted',
    'Monitored': 'monitored',
    'Disaster': 'disaster',
    'Hunger': 'hunger',
    'Displacement': 'displacement'
  };

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
      <div style="font-size:11px;font-weight:400;color:var(--ink);">${profile.name}</div>
      <div style="font-size:6px;letter-spacing:0.15em;text-transform:uppercase;color:${alert ? 'var(--ember)' : 'var(--gold-dim)'};margin-bottom:4px;">${alert ? alert.type : 'No active alerts'}</div>
      <div style="font-size:8px;color:var(--ink-mid);margin-bottom:4px;">${profile.population.toLocaleString()} · ${profile.christian}% Christian</div>
      <button onclick="openCountryModal('${code}')" style="width:100%;padding:6px 0;background:var(--gold);color:var(--bg);border:none;border-radius:99px;font-size:6px;cursor:pointer;">View full profile</button>
      <button onclick="prayForCountry('${code}')" style="width:100%;padding:6px 0;background:var(--bg);color:var(--gold);border:0.5px solid var(--gold);border-radius:99px;font-size:6px;cursor:pointer;margin-top:3px;">Pray for this country</button>
      <div style="font-size:6px;color:var(--gold-dim);text-align:center;margin-top:4px;">${prayerCount} prayers</div>
    `, { minWidth: 160, maxWidth: 200 });
  });

  // Prayer point markers
  PRAYER_POINTS.forEach(point => {
    const markerEl = document.createElement('div');
    const count = mapCounts[point.id] || 0;
    markerEl.className = 'custom-marker ' + (markerClassMap[point.level] || 'monitored') + (count > 0 ? ' has-prayers' : '');
    const marker = L.marker([point.lat, point.lng], {
      icon: L.divIcon({ html: markerEl.outerHTML, className: '', iconSize: [10, 10], iconAnchor: [5, 5] }),
      riseOnHover: true,
    }).addTo(mapInstance);

    marker.bindPopup(`
      <div style="font-size:11px;font-weight:400;color:var(--ink);">${point.country}</div>
      <div style="font-size:6px;letter-spacing:0.15em;text-transform:uppercase;color:var(--ember);margin-bottom:4px;">${point.level}</div>
      <div style="font-size:8px;color:var(--ink-mid);font-style:italic;margin-bottom:8px;">"${point.prayer}"</div>
      <button onclick="prayForMapPoint(${point.id})" style="width:100%;padding:6px 0;background:var(--gold);color:var(--bg);border:none;border-radius:99px;font-size:6px;cursor:pointer;">Pray for this</button>
      <div style="font-size:6px;color:var(--gold-dim);text-align:center;margin-top:4px;">${count} intercessors</div>
    `, { minWidth: 160, maxWidth: 200 });
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

  if (navigator.geolocation && !homeCity) {
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
      if (nearest) {
        homeCity = nearest;
        D.homeCity = nearest;
        saveLocal();
        setTimeout(function() {
          mapInstance.setView([nearest.lat, nearest.lng], 10);
          showCityOverlay(nearest);
          updateHomeMarkers();
        }, 1000);
      }
    }, function() {
      mapInstance.setView([20, 0], 2);
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

  D.globalCounter = (D.globalCounter || 12847) + 1;
  saveLocal();
  const counter = document.querySelector('.global-counter .num');
  if (counter) counter.textContent = D.globalCounter.toLocaleString();

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
  const globalCounter = $('globalCounter');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');
  if (globalCounter) globalCounter.classList.add('hidden');

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
  const globalCounter = $('globalCounter');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');
  if (globalCounter) globalCounter.classList.add('hidden');

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
  const globalCounter = $('globalCounter');
  if (mapPanel) mapPanel.classList.remove('hidden');
  if (stageAxis) stageAxis.classList.add('hidden');
  if (globalCounter) globalCounter.classList.remove('hidden');
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

function updateMode() {
  const mode = MODES[currentModeIndex];
  const modeIndicator = $('modeIndicator');
  if (modeIndicator) {
    modeIndicator.innerHTML = `<span class="symbol">${mode.symbol}</span> ${mode.name}`;
  }
  const verseText = $('verseText');
  const verseRef = $('verseRef');
  const mainInput = $('mainInput');
  const nexusHint = $('nexusHint');
  if (verseText) verseText.textContent = mode.verse;
  if (verseRef) verseRef.textContent = mode.ref;
  if (mainInput) mainInput.placeholder = mode.placeholder;
  if (mainInput) mainInput.value = '';
  if (nexusHint) nexusHint.textContent = mode.name === 'confession' ? 'hold to confess' : 'hold to enter';
  progressValue = 0;
  if (progressRing) {
    progressRing.style.strokeDashoffset = 421;
  }
  updateCharCounter();
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
  return map[mode] || ['"Be still, and know that I am God."', 'Psalm 46:10'];
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

function hideAllAlerts() {
  const ticker = document.getElementById('mapTicker');
  if (ticker) ticker.style.display = 'none';
}

function showAllAlerts() {
  const ticker = document.getElementById('mapTicker');
  if (ticker) ticker.style.display = 'block';
}

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
  const scripture = getScriptureForMode(currentSanctuaryMode);
  const solVerse = $('solVerse');
  const solRef = $('solRef');
  if (solVerse) solVerse.textContent = scripture[0];
  if (solRef) solRef.textContent = scripture[1];
  renderModeMenu();
  updateSanctuaryForConfession(currentSanctuaryMode === 'confession');

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

  if (D.currentCity) {
    D.globalCounter = (D.globalCounter || 12847) + 1;
    saveLocal();
    const counter = document.querySelector('.global-counter .num');
    if (counter) counter.textContent = D.globalCounter.toLocaleString();
  }

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
  const point = PRAYER_POINTS.find(p => p.id === id);
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
  const globalCounter = $('globalCounter');
  if (mapPanel) mapPanel.classList.add('hidden');
  if (stageAxis) stageAxis.classList.remove('hidden');
  if (globalCounter) globalCounter.classList.add('hidden');

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
    if (dnaPanel && dnaPanel.classList.contains('open')) {
      dnaPanel.classList.remove('open');
    }
    if (requestsPanel && requestsPanel.classList.contains('open')) {
      requestsPanel.classList.remove('open');
    }
    hideCountryTooltip();
  });
}

const navPray = $('navPray');
if (navPray) {
  navPray.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    const dnaPanel = $('dnaPanel');
    const requestsPanel = $('requestsPanel');
    if (dnaPanel && dnaPanel.classList.contains('open')) {
      dnaPanel.classList.remove('open');
    }
    if (requestsPanel && requestsPanel.classList.contains('open')) {
      requestsPanel.classList.remove('open');
    }
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
    if (requestsPanel && requestsPanel.classList.contains('open')) {
      requestsPanel.classList.remove('open');
    }
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

const navRequests = $('navRequests');
if (navRequests) {
  navRequests.addEventListener('click', function() {
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (isSanctuaryActive) leaveSanctuary();
    const dnaPanel = $('dnaPanel');
    if (dnaPanel && dnaPanel.classList.contains('open')) {
      dnaPanel.classList.remove('open');
    }
    renderRequests();
    const requestsPanel = $('requestsPanel');
    if (requestsPanel) requestsPanel.classList.toggle('open');
  });
}

const closeRequests = $('closeRequests');
if (closeRequests) {
  closeRequests.addEventListener('click', function() {
    const requestsPanel = $('requestsPanel');
    if (requestsPanel) requestsPanel.classList.remove('open');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const navWorld2 = $('navWorld');
    if (navWorld2) navWorld2.classList.add('active');
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

// ─── TUTORIAL ─────────────────────────────────────
let currentTutStep = 0;
const TUTORIAL_TOTAL = 5;
const TUTORIAL_SEEN_KEY = 'palal_tutorial_seen_v4';

function showTutStep(n) {
  for (let i = 0; i < TUTORIAL_TOTAL; i++) {
    const step = document.getElementById('tutStep' + i);
    const dot = document.getElementById('tutDot' + i);
    if (step) step.classList.toggle('active', i === n);
    if (dot) dot.classList.toggle('active', i === n);
  }
  const nextBtn = document.getElementById('tutNext');
  if (nextBtn) {
    nextBtn.textContent = n === TUTORIAL_TOTAL - 1 ? 'Start Praying ✦' : 'Next →';
  }
  currentTutStep = n;
}

function closeTutorial() {
  const overlay = document.getElementById('tutorialOverlay');
  if (overlay) overlay.classList.remove('active');
  localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
}

const tutNext = document.getElementById('tutNext');
if (tutNext) {
  tutNext.addEventListener('click', function() {
    if (currentTutStep < TUTORIAL_TOTAL - 1) {
      showTutStep(currentTutStep + 1);
    } else {
      closeTutorial();
    }
  });
}

const tutSkip = document.getElementById('tutSkip');
if (tutSkip) {
  tutSkip.addEventListener('click', closeTutorial);
}

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
    toast('Logged out');
    const userInfo = $('userInfo');
    const signInGoogle2 = $('signInGoogle');
    if (userInfo) userInfo.style.display = 'none';
    if (signInGoogle2) signInGoogle2.style.display = 'block';
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
      localStorage.removeItem('palal_tutorial_seen_v4');
      const overlay = document.getElementById('tutorialOverlay');
      if (overlay) {
        overlay.classList.add('active');
        showTutStep(0);
      }
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
  
  D.globalCounter = (D.globalCounter || 12847) + 1;
  saveLocal();
  
  const counter = document.querySelector('.global-counter .num');
  if (counter) counter.textContent = D.globalCounter.toLocaleString();
  
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
    name: "Messiah's Guide",
    icon: '☩',
    scriptures: [
      { text: 'Our Father in heaven, hallowed be your name.', ref: 'Matthew 6:9' },
      { text: 'Your kingdom come, your will be done, on earth as it is in heaven.', ref: 'Matthew 6:10' },
      { text: 'Give us this day our daily bread.', ref: 'Matthew 6:11' },
      { text: 'And forgive us our debts, as we also have forgiven our debtors.', ref: 'Matthew 6:12' },
      { text: 'And lead us not into temptation, but deliver us from evil.', ref: 'Matthew 6:13' },
      { text: 'For yours is the kingdom, and the power, and the glory, forever. Amen.', ref: 'Matthew 6:13' }
    ]
  }
};

let currentGuidedPrayer = 'morning';
let currentGuidedStep = 0;
let guidedTotalSteps = 0;

// ─── ENTER GUIDED PRAYER DIRECTLY ──────────────
function enterGuidedPrayer(prayerId) {
  if (!GUIDED_PRAYERS[prayerId]) return;
  
  // Set current guided prayer
  currentGuidedPrayer = prayerId;
  currentGuidedStep = 0;
  
  // Get the prayer data
  const prayer = GUIDED_PRAYERS[prayerId];
  const scripture = prayer.scriptures[0];
  
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
  
  // Enter sanctuary
  enterSanctuary('petition');
  
  // Store guided state
  D._guidedActive = true;
  D._guidedPrayer = prayerId;
  D._guidedStep = 0;
  saveLocal();
  
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

// ─── PRAY GUIDED PRAYER ─────────────────────────
function prayGuidedPrayer() {
  const prayer = GUIDED_PRAYERS[currentGuidedPrayer];
  const scripture = prayer.scriptures[currentGuidedStep];
  
  let text = scripture.text;
  text = replaceGodName(text);
  text = replaceMessiahName(text);

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

  D.globalCounter = (D.globalCounter || 12847) + 1;
  saveLocal();
  const counter = document.querySelector('.global-counter .num');
  if (counter) counter.textContent = D.globalCounter.toLocaleString();

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

  updateMode();
  renderDNA();
  renderRequests();
  initMap();

  const counter = document.querySelector('.global-counter .num');
  if (counter && D.globalCounter) {
    counter.textContent = D.globalCounter.toLocaleString();
  }

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
  if (!localStorage.getItem('palal_tutorial_seen_v4')) {
    setTimeout(function() {
      const overlay = document.getElementById('tutorialOverlay');
      if (overlay) {
        overlay.classList.add('active');
        showTutStep(0);
      }
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
  localStorage.removeItem('palal_tutorial_seen_v4');
  const overlay = document.getElementById('tutorialOverlay');
  if (overlay) {
    overlay.classList.add('active');
    showTutStep(0);
  }
};
window.selectGuidedPrayer = selectGuidedPrayer;
window.nextGuidedStep = nextGuidedStep;
window.prevGuidedStep = prevGuidedStep;
window.prayGuidedPrayer = prayGuidedPrayer;
//.script.js 