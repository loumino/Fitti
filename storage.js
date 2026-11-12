'use strict';
/*
 * FitLog – Datenschicht
 * ---------------------
 * Alle Daten liegen in EINEM Objekt (state) und werden im localStorage des Browsers gespeichert.
 * Die ganze App greift nur über "Store" auf die Daten zu (get / save / exportJson / importJson / reset).
 * Soll später eine Datenbank oder Synchronisierung ergänzt werden (z. B. Supabase, Firebase),
 * muss nur diese Datei erweitert werden – die restliche App bleibt unverändert.
 *
 * Datenmodell:
 *  settings  { name, restTimer, restSeconds, lastExport, goalKg }
 *  plans     [ { id, name, type, exercises: [ { id, name, sets } ] } ]
 *            type fehlt = Kraftsport; sonst 'run' | 'bike' | 'swim' (dann zusätzlich targetMin, targetDist, desc)
 *  body      [ { date, kg, note } ]   (ein Eintrag pro Tag)
 *  mobilityLog [ { id, date, progId, title, minutes } ]
 *  schedule  [ planId|null ×7 ]   (Index 0 = Montag … 6 = Sonntag)
 *  overrides { "YYYY-MM-DD": planId | "rest" }   (kurzfristige Änderungen einzelner Tage)
 *  workouts  [ { id, date, planId, planName, startedAt, endedAt, completed, quick, manual, prs,
 *                sport ('run'|'bike'|'swim', fehlt = Kraftsport),
 *                cardio { durationMin, distance, notes }   (nur Ausdauer)
 *                exercises: [ { id, name, note, done, sets: [ { kg, reps, done, sk, sr } ] } ] } ]
 *  activeId  id des gerade laufenden Trainings oder null
 */
const Store = (function () {
  const KEY = 'fitlog.data.v1';
  const BACKUP_KEY = 'fitlog.backup.v1';
  let state = null;
  let api = { onError: null };

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function defaultState() {
    const mk = (name, list) => ({ id: uid(), name, exercises: list.map(n => ({ id: uid(), name: n, sets: 3 })) });
    const ob = mk('Oberkörper', ['Bankdrücken', 'Rudern', 'Schulterdrücken', 'Bizepscurls', 'Trizepsdrücken']);
    const ub = mk('Unterkörper', ['Kniebeugen', 'Beinpresse', 'Beinstrecker', 'Beinbeuger', 'Wadenheben']);
    return {
      version: 1,
      settings: { name: '', restTimer: true, restSeconds: 90, lastExport: null, goalKg: null },
      plans: [ob, ub],
      schedule: [ob.id, ub.id, null, ob.id, ub.id, null, null],
      overrides: {},
      workouts: [],
      body: [],
      mobilityLog: [],
      activeId: null
    };
  }

  function migrate(s) {
    const d = defaultState();
    s.version = s.version || 1;
    s.settings = Object.assign({}, d.settings, s.settings || {});
    s.plans = Array.isArray(s.plans) ? s.plans : [];
    s.schedule = Array.isArray(s.schedule) ? s.schedule.slice(0, 7) : [];
    while (s.schedule.length < 7) s.schedule.push(null);
    s.overrides = s.overrides && typeof s.overrides === 'object' ? s.overrides : {};
    s.workouts = Array.isArray(s.workouts) ? s.workouts : [];
    s.workouts.forEach(w => { w.exercises = w.exercises || []; w.exercises.forEach(e => { e.sets = e.sets || []; }); });
    s.plans.forEach(p => { p.exercises = p.exercises || []; });
    s.body = Array.isArray(s.body) ? s.body : [];
    s.mobilityLog = Array.isArray(s.mobilityLog) ? s.mobilityLog : [];
    s.activeId = s.activeId || null;
    return s;
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* Speicher nicht verfügbar */ }
    if (raw) {
      try {
        state = migrate(JSON.parse(raw));
        try { localStorage.setItem(BACKUP_KEY, raw); } catch (e) { /* ignorieren */ }
        return;
      } catch (e) {
        // Beschädigte Daten: Backup versuchen
        try {
          const b = localStorage.getItem(BACKUP_KEY);
          if (b) { state = migrate(JSON.parse(b)); return; }
        } catch (e2) { /* weiter */ }
      }
    }
    state = defaultState();
    save();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      if (api.onError) api.onError(e);
      return false;
    }
  }

  function exportJson() {
    state.settings.lastExport = new Date().toISOString();
    save();
    return JSON.stringify({ app: 'fitlog', exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  function importJson(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'Die Datei ist keine gültige Sicherung.' }; }
    const data = obj && obj.data ? obj.data : obj;
    if (!data || !Array.isArray(data.plans) || !Array.isArray(data.workouts)) {
      return { ok: false, error: 'Die Datei enthält keine FitLog-Daten.' };
    }
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ }
    state = migrate(data);
    save();
    return { ok: true, plans: state.plans.length, workouts: state.workouts.length };
  }

  function reset() {
    state = defaultState();
    save();
  }

  load();
  api.get = () => state;
  api.save = save;
  api.uid = uid;
  api.exportJson = exportJson;
  api.importJson = importJson;
  api.reset = reset;
  return api;
})();
