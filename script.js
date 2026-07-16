
    // ═══════════════════════════════════════════════
    //  PALAL — PRAYER INTELLIGENCE
    //  COMPLETE WITH ALL FIXES
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
      theme: 'dark',
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
      globalCounter: 12847
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
      $('themeBtn').textContent = th === 'dark' ? '◐' : '◑';
      saveLocal();
      renderDNA();
    }
    $('themeBtn').addEventListener('click', function() { applyTheme(D.theme === 'dark' ? 'light' : 'dark'); });

    // ─── COUNTRY DATA ────────────────────────────────
    const COUNTRY_PROFILES = {
      'af': { name: 'Afghanistan', population: 38928346, christian: 0.1, unreached: 99.9, freedomScore: 10,
        prayerPoints: ['Believers facing severe persecution', 'Afghan diaspora finding Christ', 'Peace and stability'],
        alerts: ['Severe food insecurity', 'Religious freedom crisis'] },
      'in': { name: 'India', population: 1428627663, christian: 2.3, unreached: 35.0, freedomScore: 51,
        prayerPoints: ['Dalit communities facing oppression', 'Church planting in northern states', 'Persecution in Manipur'],
        alerts: ['Manipur violence', 'Food crisis in Bihar'] },
      'ng': { name: 'Nigeria', population: 218541212, christian: 49.0, unreached: 10.0, freedomScore: 40,
        prayerPoints: ['Christians facing violence in north', 'Boko Haram victims', 'Church unity'],
        alerts: ['Conflict in north', 'Food insecurity'] },
      'pk': { name: 'Pakistan', population: 231402117, christian: 1.5, unreached: 97.0, freedomScore: 28,
        prayerPoints: ['Blasphemy law victims', 'Underground church', 'Minority rights'],
        alerts: ['Blasphemy accusations', 'Economic crisis'] },
      'ir': { name: 'Iran', population: 87923043, christian: 0.5, unreached: 99.0, freedomScore: 18,
        prayerPoints: ['Underground church growth', 'Prisoners of faith', 'Youth seeking truth'],
        alerts: ['House church crackdowns', 'Economic hardship'] },
      'kp': { name: 'North Korea', population: 25969398, christian: 0.1, unreached: 100.0, freedomScore: 3,
        prayerPoints: ['Underground believers', 'Prison camps', 'Open doors for aid workers'],
        alerts: ['Severe persecution', 'Food crisis'] },
      'cn': { name: 'China', population: 1412176000, christian: 4.0, unreached: 30.0, freedomScore: 20,
        prayerPoints: ['House church leaders', 'Bible shortages', 'Underground seminary training'],
        alerts: ['Church closures', 'Religious repression'] },
      'sa': { name: 'Saudi Arabia', population: 34110000, christian: 2.0, unreached: 95.0, freedomScore: 15,
        prayerPoints: ['Migrant workers finding Christ', 'Open doors for fellowship', 'Royal family'],
        alerts: ['Labor rights abuses', 'Religious restrictions'] },
      'sy': { name: 'Syria', population: 17070135, christian: 5.0, unreached: 80.0, freedomScore: 30,
        prayerPoints: ['Church rebuilding', 'Refugee families', 'Civil war survivors'],
        alerts: ['Ongoing conflict', 'Displacement crisis'] },
      'ua': { name: 'Ukraine', population: 43633801, christian: 80.0, unreached: 5.0, freedomScore: 60,
        prayerPoints: ['War victims', 'Church unity', 'Recovery and peace'],
        alerts: ['War in east', 'Displacement'] },
      'sd': { name: 'Sudan', population: 45996644, christian: 5.0, unreached: 85.0, freedomScore: 25,
        prayerPoints: ['Civilians in conflict', 'Famine victims', 'Church resilience'],
        alerts: ['Civil war', 'Famine risk'] },
      'ye': { name: 'Yemen', population: 29687900, christian: 0.1, unreached: 99.0, freedomScore: 15,
        prayerPoints: ['Believers in hiding', 'Famine victims', 'Children in crisis'],
        alerts: ['Civil war', 'Famine'] },
      'er': { name: 'Eritrea', population: 3601600, christian: 50.0, unreached: 30.0, freedomScore: 15,
        prayerPoints: ['Christians in prison', 'Church closures', 'Youth in exile'],
        alerts: ['Religious persecution', 'Forced conscription'] },
      'mm': { name: 'Myanmar', population: 54409794, christian: 8.0, unreached: 60.0, freedomScore: 30,
        prayerPoints: ['Civil war victims', 'Church in crisis', 'Kachin Christians'],
        alerts: ['Civil war', 'Earthquake recovery'] },
      've': { name: 'Venezuela', population: 28359623, christian: 85.0, unreached: 5.0, freedomScore: 35,
        prayerPoints: ['Economic collapse victims', 'Church relief efforts', 'Political reconciliation'],
        alerts: ['Earthquake recovery', 'Economic crisis'] },
      'ht': { name: 'Haiti', population: 11447569, christian: 85.0, unreached: 3.0, freedomScore: 40,
        prayerPoints: ['Violence victims', 'Church relief work', 'Children in crisis'],
        alerts: ['Gang violence', 'Displacement'] },
      'sb': { name: 'South Sudan', population: 11193725, christian: 60.0, unreached: 30.0, freedomScore: 35,
        prayerPoints: ['Civil war victims', 'Famine survivors', 'Church peacemakers'],
        alerts: ['Famine risk', 'Civil war'] },
      'ps': { name: 'Palestine', population: 5101414, christian: 1.0, unreached: 90.0, freedomScore: 40,
        prayerPoints: ['Gaza Christians', 'Hospitality workers', 'Peacemakers'],
        alerts: ['Gaza crisis', 'Food insecurity'] },
      'gb': { name: 'United Kingdom', population: 67326569, christian: 46.0, unreached: 10.0, freedomScore: 90,
        prayerPoints: ['Church decline', 'Revival in youth', 'Multicultural churches'],
        alerts: ['Cost of living crisis'] },
      'us': { name: 'United States', population: 331893745, christian: 63.0, unreached: 5.0, freedomScore: 90,
        prayerPoints: ['Cultural division', 'Church unity', 'Revival in cities'],
        alerts: ['Political polarization'] },
      'br': { name: 'Brazil', population: 213993437, christian: 88.0, unreached: 2.0, freedomScore: 70,
        prayerPoints: ['Amazon missions', 'Poverty relief', 'Church growth'],
        alerts: ['Deforestation crisis'] },
      'ke': { name: 'Kenya', population: 53771296, christian: 85.0, unreached: 5.0, freedomScore: 55,
        prayerPoints: ['Flood victims', 'Church planting', 'Youth evangelism'],
        alerts: ['Flood crisis'] },
      'td': { name: 'Chad', population: 16425864, christian: 35.0, unreached: 50.0, freedomScore: 40,
        prayerPoints: ['Unreached peoples', 'Church growth', 'Refugee ministry'],
        alerts: ['Food crisis', 'Refugees'] },
      'et': { name: 'Ethiopia', population: 117876227, christian: 63.0, unreached: 20.0, freedomScore: 45,
        prayerPoints: ['Landslide victims', 'Church unity', 'Peace in Tigray'],
        alerts: ['Landslides', 'Conflict'] },
      'cd': { name: 'DRC', population: 92377993, christian: 85.0, unreached: 5.0, freedomScore: 35,
        prayerPoints: ['Conflict victims', 'Church relief', 'Ebola survivors'],
        alerts: ['Civil war', 'Displacement'] },
    };

    // ─── REAL-TIME ALERTS ──────────────────────────────
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
      { name: 'Gijon', lat: 43.5357, lng: -5.6615 }
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

    // ─── MAP ─────────────────────────────────────────
    let homeCity = null;
    let selectedCity = null;
    let mapInstance = null;
    let mapInitialized = false;
    let cityMarkers = [];
    let mapCounts = {};
    let tooltipTimeout = null;

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
      { id: 101, country: 'Turkey / Syria', lat: 37.5, lng: 37.0, level: 'Disaster',
        prayer: 'Pray for communities recovering from the earthquake.' },
      { id: 102, country: 'Morocco', lat: 31.2, lng: -8.0, level: 'Disaster',
        prayer: 'Pray for earthquake survivors in the High Atlas region.' },
      { id: 103, country: 'Libya', lat: 32.0, lng: 22.6, level: 'Disaster',
        prayer: 'Pray for those displaced after flooding in Derna.' },
      { id: 104, country: 'Afghanistan', lat: 35.0, lng: 69.5, level: 'Disaster',
        prayer: 'Pray for Afghan communities struck by earthquakes.' },
      { id: 105, country: 'Papua New Guinea', lat: -6.3, lng: 143.9, level: 'Disaster',
        prayer: 'Pray for those affected by landslides and flooding.' },
      { id: 201, country: 'Sudan', lat: 15.5, lng: 32.5, level: 'Hunger',
        prayer: 'Pray for 19.5 million people in crisis.' },
      { id: 202, country: 'South Sudan', lat: 7.8, lng: 30.0, level: 'Hunger',
        prayer: 'Pray for 7.8 million in crisis.' },
      { id: 203, country: 'Yemen', lat: 15.5, lng: 48.5, level: 'Hunger',
        prayer: 'Pray for 18.3 million in crisis.' },
      { id: 204, country: 'Palestine (Gaza)', lat: 31.5, lng: 34.4, level: 'Hunger',
        prayer: 'Pray for 1.6 million acutely food insecure.' },
      { id: 301, country: 'Global Housing Crisis', lat: 0, lng: 0, level: 'Displacement',
        prayer: 'Pray for 3.4 billion people lacking adequate housing.' },
      { id: 302, country: 'Palestine (Gaza)', lat: 31.5, lng: 34.4, level: 'Displacement',
        prayer: 'Pray for 1.9 million internally displaced in Gaza.' },
      { id: 303, country: 'Venezuela', lat: 10.5, lng: -66.9, level: 'Displacement',
        prayer: 'Pray for those displaced by the earthquakes.' },
      { id: 304, country: 'Haiti', lat: 18.9, lng: -72.3, level: 'Displacement',
        prayer: 'Pray for those displaced by violence in Haiti.' },
      { id: 305, country: 'Sudan', lat: 15.5, lng: 32.5, level: 'Displacement',
        prayer: 'Pray for over 10 million people displaced in Sudan.' }
    ];

    // ─── COUNTRY CAPITALS ────────────────────────────
    const COUNTRY_CAPITALS = {
      'af': { name: 'Kabul', lat: 34.5553, lng: 69.2075 },
      'in': { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
      'ng': { name: 'Abuja', lat: 9.0765, lng: 7.3986 },
      'pk': { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
      'ir': { name: 'Tehran', lat: 35.6892, lng: 51.3890 },
      'kp': { name: 'Pyongyang', lat: 39.0392, lng: 125.7625 },
      'cn': { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
      'sa': { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
      'sy': { name: 'Damascus', lat: 33.5138, lng: 36.2765 },
      'ua': { name: 'Kyiv', lat: 50.4501, lng: 30.5234 },
      'sd': { name: 'Khartoum', lat: 15.5007, lng: 32.5599 },
      'ye': { name: 'Sanaa', lat: 15.3694, lng: 44.1910 },
      'er': { name: 'Asmara', lat: 15.3229, lng: 38.9251 },
      'mm': { name: 'Naypyidaw', lat: 19.7633, lng: 96.0785 },
      've': { name: 'Caracas', lat: 10.4806, lng: -66.9036 },
      'ht': { name: 'Port-au-Prince', lat: 18.5944, lng: -72.3074 },
      'sb': { name: 'Juba', lat: 4.8594, lng: 31.5713 },
      'ps': { name: 'Ramallah', lat: 31.9078, lng: 35.2004 },
      'gb': { name: 'London', lat: 51.5074, lng: -0.1278 },
      'us': { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
      'br': { name: 'Brasilia', lat: -15.7939, lng: -47.8828 },
      'ke': { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      'td': { name: 'N\'Djamena', lat: 12.1348, lng: 15.0557 },
      'et': { name: 'Addis Ababa', lat: 9.0320, lng: 38.7469 },
      'cd': { name: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
    };

    // ─── COUNTRY TOOLTIP ─────────────────────────────
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

      // Position centered above marker
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

    // ─── COUNTRY MODAL ───────────────────────────────
    function openCountryModal(countryCode) {
      hideCountryTooltip();
      const profile = COUNTRY_PROFILES[countryCode];
      if (!profile) return;

      const modal = $('countryModal');
      $('modalName').textContent = profile.name;
      $('modalSub').textContent = 'Population: ' + profile.population.toLocaleString() + ' · Christian: ' + profile
        .christian + '%';

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
            <div class="section">
              <div class="section-title">Data Sources</div>
              <div style="font-size:0.375rem;color:var(--ink-mid);opacity:0.4;line-height:1.6;font-weight:300;">
                Conflict data: ACLED · Food security: HDX / WFP · Displacement: UNHCR · Religious freedom: Open Doors / USHRI
              </div>
            </div>
          `;
          break;
      }

      body.innerHTML = html;
    }

    // ─── MODAL TAB SWITCHING ─────────────────────────
    document.querySelectorAll('.country-modal-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const modal = $('countryModal');
        const countryCode = modal.dataset.country;
        document.querySelectorAll('.country-modal-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderModalTab(this.dataset.tab, countryCode);
      });
    });

    $('countryModalClose').addEventListener('click', closeCountryModal);
    $('countryModal').addEventListener('click', function(e) {
      if (e.target === this) closeCountryModal();
    });

    $('modalPrayBtn').addEventListener('click', function() {
      const modal = $('countryModal');
      const name = modal.dataset.name;
      if (!name) return;
      closeCountryModal();

      const city = { name: name, weather: getCityWeather(), headline: getCityHeadline(name) };
      selectedCity = city;
      D.currentCity = city;

      $('verseText').textContent = '"Pray for ' + name + ', for ' + city.headline.toLowerCase() + '."';
      $('verseRef').textContent = name;
      $('cityContext').textContent = name + ' · ' + city.weather.temp + '° ' + city.weather.condition;

      $('mapPanel').classList.add('hidden');
      $('stageAxis').classList.remove('hidden');
      $('globalCounter').classList.add('hidden');

      toast('Praying for ' + name);

      D.currentCity = { name, weather: city.weather, headline: city.headline };
      saveLocal();

      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navPray').classList.add('active');

      setTimeout(() => $('mainInput').focus(), 300);
    });

    // ─── REQUESTS ─────────────────────────────────────
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

      $('identityLabel').textContent = identity;
      $('streakLabel').textContent = '· ' + streak;

      if (total === 0 && conf === 0) {
        container.innerHTML =
          `<div class="dna-metrics">
            <div class="dna-metric"><span class="value">0</span><span class="label">Prayers</span></div>
            <div class="dna-metric"><span class="value">0</span><span class="label">Burnt</span></div>
            <div class="dna-metric"><span class="value">0m</span><span class="label">Stillness</span></div>
          </div>
          <div class="dna-empty">Start praying to see your DNA.</div>`;
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

      // ─── COUNTRY MARKERS ON CAPITALS ────────────────
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

        // Store reference to DOM element for tooltip positioning
        marker.on('add', function() {
          this._icon._countryCode = code;
        });

        // ─── HOVER → CENTERED TOOLTIP ─────────────────
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

        // ─── CLICK → MODAL ────────────────────────────
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

      // ─── PRAYER POINT MARKERS ──────────────────────
      PRAYER_POINTS.forEach(point => {
        const markerEl = document.createElement('div');
        const count = mapCounts[point.id] || 0;
        markerEl.className = 'custom-marker ' + (markerClassMap[point.level] || 'monitored') + (count > 0 ?
          ' has-prayers' : '');
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

      // ─── CITY MARKERS ──────────────────────────────
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

    // ─── PRAY FOR COUNTRY ─────────────────────────────
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

      $('verseText').textContent = '"' + profile.prayerPoints[0] + '"';
      $('verseRef').textContent = profile.name;
      $('cityContext').textContent = profile.name;

      $('mapPanel').classList.add('hidden');
      $('stageAxis').classList.remove('hidden');
      $('globalCounter').classList.add('hidden');

      if ($('dnaPanel').classList.contains('open')) {
        $('dnaPanel').classList.remove('open');
      }

      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navPray').classList.add('active');

      setTimeout(() => $('mainInput').focus(), 300);

      enterSanctuary('intercession');
    };

    // ─── CITY FUNCTIONS ──────────────────────────────
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

      $('cityName').textContent = city.name;
      $('cityTemp').textContent = weather.temp + '°';
      $('cityWeather').textContent = weather.condition;
      $('cityHeadline').textContent = '"' + headline + '"';
      $('cityMeta').textContent = prayerCount + ' prayers · ' + Math.floor(prayerCount / 20) + ' intercessors';

      const homeBadge = $('cityHomeBadge');
      if (homeCity && homeCity.name === city.name) {
        homeBadge.textContent = 'home';
      } else {
        homeBadge.textContent = '';
      }

      selectedCity = city;
      D.currentCity = { name: city.name, weather, headline, prayerCount };

      const overlay = $('cityOverlay');
      overlay.classList.add('show');

      overlay.onclick = function(e) {
        if (e.target.closest('.city-close-overlay')) return;
        enterPrayerWithCity();
      };
    }

    function hideCityOverlay() {
      $('cityOverlay').classList.remove('show');
    }

    $('closeOverlayBtn').addEventListener('click', function(e) {
      e.stopPropagation();
      hideCityOverlay();
    });

    function enterPrayerWithCity() {
      if (!selectedCity && !D.currentCity) return;

      const city = selectedCity || D.currentCity;
      const name = city.name || 'Your City';
      const weather = city.weather || getCityWeather();
      const headline = city.headline || getCityHeadline(name);

      $('verseText').textContent = '"Pray for ' + name + ', for ' + headline.toLowerCase() + '."';
      $('verseRef').textContent = name;
      $('cityContext').textContent = name + ' · ' + weather.temp + '° ' + weather.condition;

      $('mapPanel').classList.add('hidden');
      $('stageAxis').classList.remove('hidden');
      $('globalCounter').classList.add('hidden');

      hideCityOverlay();

      toast('Praying for ' + name);

      D.currentCity = { name, weather, headline };
      saveLocal();

      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navPray').classList.add('active');

      setTimeout(() => $('mainInput').focus(), 300);
    }

    function exitPrayerToMap() {
      $('mapPanel').classList.remove('hidden');
      $('stageAxis').classList.add('hidden');
      $('globalCounter').classList.remove('hidden');
      if (mapInstance) {
        setTimeout(function() { mapInstance.invalidateSize(); }, 300);
        if (!selectedCity) {
          mapInstance.setView([20, 0], 2);
        }
      }
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navWorld').classList.add('active');
    }

    // ─── PRAYER MODES ─────────────────────────────────
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
      $('modeIndicator').innerHTML =
        `<span class="symbol">${mode.symbol}</span> ${mode.name}`;
      $('verseText').textContent = mode.verse;
      $('verseRef').textContent = mode.ref;
      $('mainInput').placeholder = mode.placeholder;
      $('mainInput').value = '';
      $('nexusHint').textContent = mode.name === 'confession' ? 'hold to confess' : 'hold to enter';
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

    $('mainInput').addEventListener('input', updateCharCounter);

    $('prevMode').addEventListener('click', function() {
      currentModeIndex = (currentModeIndex - 1 + MODES.length) % MODES.length;
      updateMode();
      vibrate();
    });

    $('nextMode').addEventListener('click', function() {
      currentModeIndex = (currentModeIndex + 1) % MODES.length;
      updateMode();
      vibrate();
    });

    // ─── NEXUS BUTTON ────────────────────────────────
    const nexusBtn = $('nexusBtn');

    nexusBtn.addEventListener('mousedown', startHold);
    nexusBtn.addEventListener('touchstart', startHold, { passive: true });
    nexusBtn.addEventListener('mouseup', endHold);
    nexusBtn.addEventListener('touchend', endHold, { passive: true });
    nexusBtn.addEventListener('mouseleave', endHold);

    function startHold(e) {
      e.preventDefault();
      isHolding = true;
      progressValue = 0;
      $('nexusHint').textContent = 'holding…';
      $('nexusHint').classList.add('active');
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
        $('nexusHint').textContent = Math.floor(progressValue / 10) + '/10';
      }, 50);
    }

    function endHold() {
      isHolding = false;
      clearInterval(progressInterval);
      if (!isSanctuaryActive) {
        $('nexusHint').textContent = 'hold to enter';
        $('nexusHint').classList.remove('active');
        if (progressRing) {
          progressRing.style.transition = 'stroke-dashoffset 0.3s ease';
          progressRing.style.strokeDashoffset = 421;
        }
      }
    }

    // ─── SANCTUARY ────────────────────────────────────
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
      $('solVerse').textContent = scripture[0];
      $('solRef').textContent = scripture[1];
      const menu = $('sanctuaryModeMenu');
      if (menu) menu.classList.remove('open');
      updateSanctuaryForConfession(modeId === 'confession');
      toast(mode.name + ' mode');
    }

    function toggleModeMenu() {
      const menu = $('sanctuaryModeMenu');
      if (menu) menu.classList.toggle('open');
    }

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

    // ─── SANCTUARY ──────────────────────────────────
    function enterSanctuary(modeNameOverride) {
      isSanctuaryActive = true;
      const sanctuary = $('sanctuary');
      sanctuary.classList.add('active');

      const city = D.currentCity || { name: 'Your City' };
      $('solCityContext').textContent = city.name;

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
      $('solVerse').textContent = scripture[0];
      $('solRef').textContent = scripture[1];
      renderModeMenu();
      updateSanctuaryForConfession(currentSanctuaryMode === 'confession');

      sanctuaryTimer = 0;
      $('solTimer').textContent = '0s';
      clearInterval(sanctuaryInterval);
      sanctuaryInterval = setInterval(function() {
        sanctuaryTimer++;
        $('solTimer').textContent = sanctuaryTimer + 's';
      }, 1000);

      if (progressRing) {
        progressRing.style.transition = 'stroke-dashoffset 0.3s ease';
        progressRing.style.strokeDashoffset = 421;
      }
      $('nexusHint').textContent = 'in sanctuary';
      $('nexusHint').classList.add('active');
      $('mainInput').blur();

      toast('Entering sanctuary…');
    }

    function leaveSanctuary() {
      isSanctuaryActive = false;
      const sanctuary = $('sanctuary');
      sanctuary.classList.remove('active');
      clearInterval(sanctuaryInterval);
      const menu = $('sanctuaryModeMenu');
      if (menu) menu.classList.remove('open');
      const capsule = $('confCapsule');
      if (capsule) capsule.classList.remove('visible');

      D.totalSolSec = (D.totalSolSec || 0) + sanctuaryTimer;
      saveLocal();
      renderDNA();

      toast('Returned from sanctuary (' + sanctuaryTimer + 's)');
      $('nexusHint').textContent = 'hold to enter';
      $('nexusHint').classList.remove('active');
      $('solTimer').textContent = '0s';
    }

    $('leaveBtn').addEventListener('click', leaveSanctuary);
    $('sanctuary').addEventListener('click', function(e) {
      if (e.target === this) leaveSanctuary();
    });

    // ─── CONFESSION INPUT ───────────────────────────
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

    $('submitBtn').addEventListener('click', submitPrayer);
    $('mainInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPrayer();
      }
    });

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

      $('verseText').textContent = '"' + point.prayer + '"';
      $('verseRef').textContent = point.country;
      $('cityContext').textContent = point.country + ' · ' + point.level;

      $('mapPanel').classList.add('hidden');
      $('stageAxis').classList.remove('hidden');
      $('globalCounter').classList.add('hidden');

      if ($('dnaPanel').classList.contains('open')) {
        $('dnaPanel').classList.remove('open');
      }

      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navPray').classList.add('active');

      const intercessionIndex = MODES.findIndex(m => m.name === 'intercession');
      if (intercessionIndex !== -1) {
        currentModeIndex = intercessionIndex;
        updateMode();
      }

      setTimeout(() => $('mainInput').focus(), 300);

      enterSanctuary('intercession');
    };

    // ─── HELP ────────────────────────────────────────
    $('helpBtn').addEventListener('click', function() {
      toast('Tap a city → Pray · Double-tap → Set home · Hold crown → Sanctuary');
    });

    // ─── DOCK NAVIGATION ────────────────────────────
    $('navWorld').addEventListener('click', function() {
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (isSanctuaryActive) leaveSanctuary();
      exitPrayerToMap();
      if (mapInstance) {
        mapInstance.setView([20, 0], 2);
        setTimeout(() => mapInstance.invalidateSize(), 300);
      }
      if ($('dnaPanel').classList.contains('open')) {
        $('dnaPanel').classList.remove('open');
      }
      if ($('requestsPanel').classList.contains('open')) {
        $('requestsPanel').classList.remove('open');
      }
      hideCountryTooltip();
    });

    $('navPray').addEventListener('click', function() {
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (isSanctuaryActive) leaveSanctuary();
      if ($('dnaPanel').classList.contains('open')) {
        $('dnaPanel').classList.remove('open');
      }
      if ($('requestsPanel').classList.contains('open')) {
        $('requestsPanel').classList.remove('open');
      }
      if (!selectedCity && D.currentCity) {
        enterPrayerWithCity();
        return;
      }
      if (!selectedCity) {
        toast('Tap a city on the map first');
        exitPrayerToMap();
        document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
        $('navWorld').classList.add('active');
        return;
      }
      enterPrayerWithCity();
    });

    $('navDNA').addEventListener('click', function() {
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (isSanctuaryActive) leaveSanctuary();
      if ($('requestsPanel').classList.contains('open')) {
        $('requestsPanel').classList.remove('open');
      }
      renderDNA();
      $('dnaPanel').classList.toggle('open');
    });

    $('closeDNA').addEventListener('click', function() {
      $('dnaPanel').classList.remove('open');
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navWorld').classList.add('active');
    });

    $('navRequests').addEventListener('click', function() {
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (isSanctuaryActive) leaveSanctuary();
      if ($('dnaPanel').classList.contains('open')) {
        $('dnaPanel').classList.remove('open');
      }
      renderRequests();
      $('requestsPanel').classList.toggle('open');
    });

    $('closeRequests').addEventListener('click', function() {
      $('requestsPanel').classList.remove('open');
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
      $('navWorld').classList.add('active');
    });

    $('settingsLink').addEventListener('click', function() {
      toast('Settings coming soon');
    });

    // ─── SCRIPTURE BLOCK TAP ────────────────────────
    $('scriptureBlock').addEventListener('click', function() {
      const mode = MODES[currentModeIndex];
      toast(mode.name + ' · ' + mode.ref);
    });

    // ─── EXPOSE GLOBALLY ────────────────────────────
    window.toast = toast;
    window.switchSanctuaryMode = switchSanctuaryMode;
    window.toggleModeMenu = toggleModeMenu;
    window.prayForMapPoint = prayForMapPoint;
    window.openCountryModal = openCountryModal;
    window.closeCountryModal = closeCountryModal;
    window.submitRequest = submitRequest;
    window.prayForRequest = prayForRequest;
    window.prayForCountry = prayForCountry;
    window.deleteEntry = deleteEntry;

    // ─── INIT ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function() {
      applyTheme(D.theme || 'dark');
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

      console.log('Palal loaded — Prayer Intelligence');
      console.log('5 modes: ' + MODES.map(m => capitalize(m.name)).join(', '));
      console.log('Countries loaded: ' + Object.keys(COUNTRY_PROFILES).length);
      console.log('Requests: ' + (D.requests || []).length);
      console.log('Entries: ' + D.entries.length);
    });

    window.addEventListener('resize', function() {
      if (mapInstance) {
        setTimeout(() => mapInstance.invalidateSize(), 200);
      }
    });

    $('signInGoogle').addEventListener('click', function() {
      toast('Sign in with Google (coming soon)');
    });

    $('logoutBtn').addEventListener('click', function() {
      toast('Logged out');
      $('userInfo').style.display = 'none';
      $('signInGoogle').style.display = 'block';
    });
  