'use strict';
/* FitLog – App-Logik (Oberfläche). Datenzugriff ausschließlich über Store (storage.js). */
(function () {
  const S = Store;
  const DAYS_S = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const DAYS_L = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const SUGGEST = ['Bankdrücken', 'Schrägbankdrücken', 'Kniebeugen', 'Kreuzheben', 'Rudern', 'Latziehen', 'Klimmzüge', 'Schulterdrücken',
    'Seitheben', 'Bizepscurls', 'Hammercurls', 'Trizepsdrücken', 'Dips', 'Liegestütze', 'Beinpresse', 'Beinstrecker', 'Beinbeuger',
    'Wadenheben', 'Ausfallschritte', 'Rumänisches Kreuzheben', 'Hip Thrust', 'Fliegende', 'Face Pulls', 'Bauchpresse', 'Plank'];

  const IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    run: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l3 8M9 6h3"/>',
    swim: '<path d="M3 17c2 0 2-2 4.5-2s2.5 2 4.5 2 2.5-2 4.5-2 2.5 2 4.5 2"/><path d="M3 21c2 0 2-2 4.5-2s2.5 2 4.5 2 2.5-2 4.5-2 2.5 2 4.5 2"/><circle cx="16" cy="6" r="2"/><path d="M5 13l5-3 3 2 3-1"/>',
    scale: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 10a4.5 4.5 0 019 0M12.5 10l2-2.5"/>',
    mobility: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v6M6 10l6-2.5 6 2.5M9 21l3-7.5 3 7.5"/>'
  };
  const icon = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>';

  const $ = s => document.querySelector(s);

  /* ---------- Hilfsfunktionen ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseYmd = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const wd = d => (d.getDay() + 6) % 7; // Montag = 0
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
  const startOfWeek = d => addDays(d, -wd(d));
  const fmtKg = n => (Number(n) || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const fmtShort = ds => { const d = parseYmd(ds); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; };
  const fmtLong = ds => { const d = parseYmd(ds); return DAYS_L[wd(d)] + ', ' + d.getDate() + '. ' + MONTHS[d.getMonth()]; };
  const fmtLongY = ds => fmtLong(ds) + ' ' + parseYmd(ds).getFullYear();
  const fmtDur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? m + ' Min' : Math.floor(m / 60) + ' Std ' + (m % 60) + ' Min'; };
  const fmtTime = ts => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const keyName = n => String(n || '').trim().toLowerCase();
  const num = v => { const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };

  /* ---------- Datenabfragen ---------- */
  const planById = id => S.get().plans.find(p => p.id === id) || null;
  function planForDate(ds) {
    const s = S.get();
    if (Object.prototype.hasOwnProperty.call(s.overrides, ds)) {
      const v = s.overrides[ds];
      return v === 'rest' ? null : planById(v);
    }
    return planById(s.schedule[wd(parseYmd(ds))]);
  }
  const completedList = () => S.get().workouts.filter(w => w.completed)
    .sort((a, b) => a.date === b.date ? (a.endedAt || 0) - (b.endedAt || 0) : (a.date < b.date ? -1 : 1));
  const doneOn = ds => S.get().workouts.filter(w => w.completed && w.date === ds);
  const activeWorkout = () => { const s = S.get(); return s.workouts.find(w => w.id === s.activeId && !w.completed) || null; };
  /* Sportarten: Kraftsport (Standard) sowie Laufen, Radfahren, Schwimmen */
  const SPORTS = {
    strength: { label: 'Kraftsport', icon: 'dumbbell', unit: '' },
    run: { label: 'Laufen', icon: 'run', unit: 'km' },
    bike: { label: 'Radfahren', icon: 'bike', unit: 'km' },
    swim: { label: 'Schwimmen', icon: 'swim', unit: 'm' }
  };
  const sportOf = x => { const k = x && (x.sport || x.type); return SPORTS[k] ? k : 'strength'; }; // Training: sport, Plan: type
  const isCardio = x => sportOf(x) !== 'strength';
  const fmtPace = pm => { const s = Math.round(pm * 60); return Math.floor(s / 60) + ':' + pad(s % 60); };
  function cardioTempo(w) {
    const c = w.cardio || {}, sp = sportOf(w), d = num(c.distance), m = num(c.durationMin);
    if (!(d > 0 && m > 0)) return null;
    if (sp === 'run') return { val: fmtPace(m / d), unit: 'min/km' };
    if (sp === 'bike') return { val: fmtKg(Math.round(d / (m / 60) * 10) / 10), unit: 'km/h' };
    if (sp === 'swim') return { val: fmtPace(m / (d / 100)), unit: 'min/100 m' };
    return null;
  }
  function cardioLine(w) {
    const c = w.cardio || {}, sp = sportOf(w), parts = [];
    if (num(c.durationMin) > 0) parts.push(fmtDur(num(c.durationMin) * 60000));
    if (num(c.distance) > 0) parts.push(fmtKg(num(c.distance)) + ' ' + SPORTS[sp].unit);
    const t = cardioTempo(w); if (t) parts.push(t.val + ' ' + t.unit);
    return parts.join(' · ');
  }
  function planInfo(p) {
    if (!isCardio(p)) return (p.exercises || []).length + ' Übungen';
    const parts = [SPORTS[p.type].label];
    if (num(p.targetDist) > 0) parts.push(fmtKg(num(p.targetDist)) + ' ' + SPORTS[p.type].unit);
    if (num(p.targetMin) > 0) parts.push(num(p.targetMin) + ' Min');
    return parts.join(' · ');
  }
  const wDur = w => {
    if (!w.completed) return null;
    if (w.cardio && num(w.cardio.durationMin) > 0) return num(w.cardio.durationMin) * 60000;
    return (!w.quick && !w.manual && w.endedAt && w.startedAt) ? w.endedAt - w.startedAt : null;
  };
  const wMeta = w => isCardio(w) ? (cardioLine(w) || SPORTS[sportOf(w)].label) : wSets(w) + ' Sätze' + (wDur(w) ? ' · ' + fmtDur(wDur(w)) : '');
  const wSets = w => w.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const wVolume = w => w.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).reduce((b, s) => b + num(s.kg) * num(s.reps), 0), 0);

  function bestSet(e) {
    let best = null;
    e.sets.forEach(s => {
      if (!s.done || !(num(s.reps) > 0)) return;
      const c = { kg: num(s.kg), reps: num(s.reps) };
      if (!best || c.kg > best.kg || (c.kg === best.kg && c.reps > best.reps)) best = c;
    });
    return best;
  }

  function countBetween(a, b) { // a,b als ymd, inklusive
    return S.get().workouts.filter(w => w.completed && w.date >= a && w.date <= b).length;
  }
  function weekStreak() {
    const set = new Set(completedList().map(w => ymd(startOfWeek(parseYmd(w.date)))));
    let d = startOfWeek(new Date());
    if (!set.has(ymd(d))) d = addDays(d, -7);
    let n = 0;
    while (set.has(ymd(d))) { n++; d = addDays(d, -7); }
    return n;
  }
  function adherence() {
    const today = new Date(); const todayS = ymd(today);
    let total = 0, ok = 0;
    for (let i = 27; i >= 0; i--) {
      const ds = ymd(addDays(today, -i));
      if (!planForDate(ds)) continue;
      const done = doneOn(ds).length > 0;
      if (ds < todayS || done) { total++; if (done) ok++; }
    }
    return total ? Math.round(ok / total * 100) : null;
  }

  function lastSetsFor(name, excludeId, beforeDate) {
    const list = completedList().reverse();
    for (const w of list) {
      if (w.id === excludeId) continue;
      if (beforeDate && w.date > beforeDate) continue;
      const ex = w.exercises.find(e => keyName(e.name) === keyName(name));
      if (ex) {
        const sets = ex.sets.filter(s => s.done && num(s.reps) > 0);
        if (sets.length) return sets.map(s => ({ kg: num(s.kg), reps: num(s.reps) }));
      }
    }
    return null;
  }

  function makeEx(name, count) {
    const last = lastSetsFor(name);
    const n = last ? last.length : (count || 3);
    const sets = [];
    for (let i = 0; i < n; i++) {
      const l = last ? last[i] : null;
      sets.push({ kg: '', reps: '', done: false, sk: l ? l.kg : null, sr: l ? l.reps : null });
    }
    return { id: S.uid(), name: name, note: '', done: false, sets: sets };
  }

  function computePRs(w) {
    const prs = [];
    const others = completedList().filter(o => o.id !== w.id && o.date <= w.date);
    w.exercises.forEach(e => {
      const best = bestSet(e);
      if (!best || !best.kg) return;
      let prior = 0, has = false;
      others.forEach(o => o.exercises.forEach(oe => {
        if (keyName(oe.name) === keyName(e.name)) {
          const b = bestSet(oe);
          if (b) { has = true; prior = Math.max(prior, b.kg); }
        }
      }));
      if (has && best.kg > prior) prs.push({ name: e.name, kg: best.kg, reps: best.reps });
    });
    return prs;
  }

  /* ---------- Körperdaten und Beweglichkeit: Hilfsfunktionen ---------- */
  const progById = id => Mobi.progById(id);
  const bodyList = () => S.get().body.filter(b => num(b.kg) > 0).sort((a, b) => a.date < b.date ? -1 : 1);
  const bodyOn = ds => S.get().body.find(b => b.date === ds) || null;
  const lastWeight = () => { const l = bodyList(); return l.length ? l[l.length - 1] : null; };

  /* ---------- UI-Zustand ---------- */
  const ui = {
    view: 'home', calMode: 'month', calCursor: new Date(), progEx: null, planId: null, workoutId: null, noteOpen: {}, histAll: false,
    bodyDate: null, bodyRange: '30', bodyAll: false, mobCat: 'Alle', progId: null, mobIdx: 0, mobSide: 1
  };
  const W = () => S.get().workouts.find(w => w.id === ui.workoutId) || null;

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  S.onError = () => toast('⚠️ Speichern fehlgeschlagen! Bitte exportiere deine Daten.');

  /* ---------- Navigation ---------- */
  function go(view, opts, push) {
    ui.view = view; Object.assign(ui, opts || {});
    if (push !== false) history.pushState({ view: ui.view, planId: ui.planId, workoutId: ui.workoutId, progId: ui.progId }, '');
    closeSheet(true);
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('popstate', e => {
    const s = e.state || { view: 'home' };
    ui.view = s.view; ui.planId = s.planId || null; ui.workoutId = s.workoutId || null; ui.progId = s.progId || null;
    mob.end = 0;
    closeSheet(true); render();
  });

  function renderNav() {
    const items = [['home', 'Start', 'home'], ['plans', 'Pläne', 'dumbbell'], ['calendar', 'Kalender', 'calendar'], ['progress', 'Fortschritt', 'chart'], ['mobility', 'Mobility', 'mobility'], ['body', 'Körper', 'scale']];
    const cur = ui.view === 'planEdit' ? 'plans' : (ui.view === 'mobProgram' || ui.view === 'mobPlay') ? 'mobility' : ui.view;
    $('#nav').innerHTML = '<div class="inner">' + items.map(i =>
      '<button class="' + (cur === i[0] ? 'on' : '') + '" data-a="nav" data-v="' + i[0] + '">' + icon(i[2]) + '<span>' + i[1] + '</span></button>').join('') + '</div>';
  }

  function render() {
    if (ui.view === 'workout' && !W()) ui.view = 'home';
    if (ui.view === 'planEdit' && !planById(ui.planId)) ui.view = 'plans';
    if ((ui.view === 'mobProgram' || ui.view === 'mobPlay') && !progById(ui.progId)) ui.view = 'mobility';
    const y = window.scrollY;
    document.body.classList.toggle('in-workout', ui.view === 'workout' || ui.view === 'mobPlay');
    const views = { home: viewHome, plans: viewPlans, planEdit: viewPlanEdit, calendar: viewCalendar, progress: viewProgress, settings: viewSettings, workout: viewWorkout, body: viewBody, mobility: viewMobility, mobProgram: viewMobProgram, mobPlay: viewMobPlay };
    $('#view').innerHTML = (views[ui.view] || viewHome)();
    renderNav(); renderTimer();
    window.scrollTo(0, y);
  }

  /* ---------- Sheets ---------- */
  function openSheet(html) {
    $('#modal-root').innerHTML = '<div class="backdrop" data-a="closeSheet"></div><div class="sheet">' + html + '</div>';
    document.body.classList.add('sheet-open');
  }
  function closeSheet(noRender) {
    const r = $('#modal-root');
    if (!r.innerHTML) return;
    r.innerHTML = ''; document.body.classList.remove('sheet-open');
    if (!noRender) render();
  }
  const sheetHead = t => '<div class="sheet-h"><h2>' + t + '</h2><button class="icon-btn" data-a="closeSheet" aria-label="Schließen">' + icon('x') + '</button></div>';

  /* ---------- Diagramme ---------- */
  function barChart(vals, labels, fmt) {
    const w = 320, h = 120, max = Math.max(1, ...vals), bw = w / vals.length;
    let s = '<svg viewBox="0 0 ' + w + ' ' + (h + 22) + '" class="chart">';
    vals.forEach((v, i) => {
      const bh = v / max * (h - 22), x = i * bw + bw * 0.2;
      s += '<rect x="' + x + '" y="' + (h - Math.max(bh, 3)) + '" width="' + (bw * 0.6) + '" height="' + Math.max(bh, 3) + '" rx="4" class="' + (v ? 'bar' : 'bar0') + '"/>';
      if (v) s += '<text x="' + (x + bw * 0.3) + '" y="' + (h - bh - 5) + '" class="clbl" text-anchor="middle">' + (fmt ? fmt(v) : v) + '</text>';
      s += '<text x="' + (x + bw * 0.3) + '" y="' + (h + 15) + '" class="clbl2" text-anchor="middle">' + esc(labels[i]) + '</text>';
    });
    return s + '</svg>';
  }
  function lineChart(pts, emptyMsg) {
    if (pts.length < 2) return '<p class="muted">' + (emptyMsg || 'Für ein Diagramm werden mindestens 2 Trainings mit dieser Übung benötigt.') + '</p>';
    const w = 320, h = 150, px = 38, py = 16, pr = 10;
    const ys = pts.map(p => p.y); let mn = Math.min(...ys), mx = Math.max(...ys);
    if (mn === mx) { mn -= 1; mx += 1; }
    const X = i => px + (w - px - pr) * (i / (pts.length - 1));
    const Y = v => py + (h - 2 * py) * (1 - (v - mn) / (mx - mn));
    let s = '<svg viewBox="0 0 ' + w + ' ' + (h + 18) + '" class="chart">';
    [mn, (mn + mx) / 2, mx].forEach(v => {
      s += '<line x1="' + px + '" x2="' + (w - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/>';
      s += '<text x="' + (px - 6) + '" y="' + (Y(v) + 4) + '" class="clbl2" text-anchor="end">' + fmtKg(Math.round(v * 10) / 10) + '</text>';
    });
    s += '<polyline class="ln" points="' + pts.map((p, i) => X(i) + ',' + Y(p.y)).join(' ') + '"/>';
    pts.forEach((p, i) => { s += '<circle class="pt" cx="' + X(i) + '" cy="' + Y(p.y) + '" r="3.5"/>'; });
    s += '<text x="' + px + '" y="' + (h + 12) + '" class="clbl2" text-anchor="start">' + esc(pts[0].label) + '</text>';
    s += '<text x="' + (w - pr) + '" y="' + (h + 12) + '" class="clbl2" text-anchor="end">' + esc(pts[pts.length - 1].label) + '</text>';
    return s + '</svg>';
  }

  function timeChart(pts, goal) {
    if (pts.length < 2) return '<p class="muted">Ab zwei Einträgen im gewählten Zeitraum siehst du hier den Verlauf.</p>';
    const w = 320, h = 150, px = 38, py = 16, pr = 10;
    const ys = pts.map(p => p.y); if (goal > 0) ys.push(goal);
    let mn = Math.min(...ys), mx = Math.max(...ys);
    const padv = Math.max(0.5, (mx - mn) * 0.12); mn -= padv; mx += padv;
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const X = t => px + (w - px - pr) * ((t - t0) / ((t1 - t0) || 1));
    const Y = v => py + (h - 2 * py) * (1 - (v - mn) / (mx - mn));
    let s = '<svg viewBox="0 0 ' + w + ' ' + (h + 18) + '" class="chart">';
    [mn, (mn + mx) / 2, mx].forEach(v => {
      s += '<line x1="' + px + '" x2="' + (w - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/>';
      s += '<text x="' + (px - 6) + '" y="' + (Y(v) + 4) + '" class="clbl2" text-anchor="end">' + fmtKg(Math.round(v * 10) / 10) + '</text>';
    });
    if (goal > 0) s += '<line x1="' + px + '" x2="' + (w - pr) + '" y1="' + Y(goal) + '" y2="' + Y(goal) + '" class="gl"/><text x="' + (w - pr) + '" y="' + (Y(goal) - 4) + '" class="clbl3" text-anchor="end">Ziel</text>';
    s += '<polyline class="ln" points="' + pts.map(p => X(p.t) + ',' + Y(p.y)).join(' ') + '"/>';
    pts.forEach(p => { s += '<circle class="pt" cx="' + X(p.t) + '" cy="' + Y(p.y) + '" r="3"/>'; });
    s += '<text x="' + px + '" y="' + (h + 12) + '" class="clbl2" text-anchor="start">' + esc(pts[0].label) + '</text>';
    s += '<text x="' + (w - pr) + '" y="' + (h + 12) + '" class="clbl2" text-anchor="end">' + esc(pts[pts.length - 1].label) + '</text>';
    return s + '</svg>';
  }

  function cardioSection() {
    const list = completedList().filter(isCardio);
    let h = '<div class="section-t">Ausdauer</div>';
    if (!list.length) return h + '<div class="card"><p class="muted" style="margin:0">Hier erscheinen Distanz, Zeit und Tempo, sobald du Laufen, Radfahren oder Schwimmen abgeschlossen hast.</p></div>';
    const sports = ['run', 'bike', 'swim'].filter(k => list.some(w => sportOf(w) === k));
    if (sports.indexOf(ui.cardioSport) < 0) ui.cardioSport = sports[0];
    const sp = ui.cardioSport, u = SPORTS[sp].unit, items = list.filter(w => sportOf(w) === sp);
    const cv = w => w.cardio || {};
    const dist = items.reduce((a, w) => a + num(cv(w).distance), 0);
    const mins = items.reduce((a, w) => a + num(cv(w).durationMin), 0);
    const both = items.filter(w => num(cv(w).distance) > 0 && num(cv(w).durationMin) > 0);
    const bd = both.reduce((a, w) => a + num(cv(w).distance), 0), bm = both.reduce((a, w) => a + num(cv(w).durationMin), 0);
    const tempo = cardioTempo({ sport: sp, cardio: { distance: bd, durationMin: bm } });
    h += '<div class="card"><div class="chips" style="margin-bottom:12px">' + sports.map(k => '<button class="chip ' + (k === sp ? 'on' : '') + '" data-a="cardioSport" data-s="' + k + '">' + SPORTS[k].label + '</button>').join('') + '</div>' +
      '<div class="grid3" style="margin-bottom:12px"><div class="stat"><b>' + items.length + '</b><span>Einheiten</span></div>' +
      '<div class="stat"><b>' + fmtKg(Math.round(dist * 10) / 10) + '</b><span>' + u + ' gesamt</span></div>' +
      '<div class="stat"><b>' + (mins ? (mins >= 600 ? Math.round(mins / 60) + ' h' : Math.round(mins) + ' Min') : '–') + '</b><span>Zeit gesamt</span></div></div>' +
      (tempo ? '<p class="muted" style="margin:0 0 10px">Ø Tempo: <b style="color:var(--tx)">' + tempo.val + ' ' + tempo.unit + '</b></p>' : '');
    const sw = startOfWeek(new Date()), vals = [], labels = [];
    for (let k = 7; k >= 0; k--) {
      const a = addDays(sw, -7 * k), from = ymd(a), to = ymd(addDays(a, 6));
      vals.push(Math.round(items.filter(w => w.date >= from && w.date <= to).reduce((t, w) => t + num(cv(w).distance), 0) * 10) / 10);
      labels.push(pad(a.getDate()) + '.' + pad(a.getMonth() + 1) + '.');
    }
    h += '<p class="muted" style="font-size:13px;margin:0 0 6px">Distanz pro Woche (' + u + ')</p>' + barChart(vals, labels, v => fmtKg(v)) +
      '<div style="margin-top:10px">' + items.slice(-5).reverse().map(w => '<div class="line"><span>' + fmtShort(w.date) + '</span><b>' + esc(cardioLine(w) || '–') + '</b></div>').join('') + '</div></div>';
    return h;
  }

  /* ---------- Ansicht: Startseite ---------- */
  function weeklyBars(n) {
    const sw = startOfWeek(new Date()), vals = [], labels = [];
    for (let k = n - 1; k >= 0; k--) {
      const a = addDays(sw, -7 * k);
      vals.push(countBetween(ymd(a), ymd(addDays(a, 6))));
      labels.push(pad(a.getDate()) + '.' + pad(a.getMonth() + 1) + '.');
    }
    return barChart(vals, labels);
  }

  function viewHome() {
    const s = S.get(), today = ymd(new Date()), plan = planForDate(today), done = doneOn(today), act = activeWorkout();
    const sw = startOfWeek(new Date());
    const weekDone = countBetween(ymd(sw), ymd(addDays(sw, 6)));
    let weekPlanned = 0;
    for (let i = 0; i < 7; i++) if (planForDate(ymd(addDays(sw, i)))) weekPlanned++;
    const name = s.settings.name ? ', ' + esc(s.settings.name) : '';
    let h = '<header class="top row between"><div class="grow"><p class="muted">' + fmtLong(today) + '</p><h1>Willkommen zurück' + name + '! 💪</h1></div>' +
      '<button class="icon-btn" data-a="nav" data-v="settings" aria-label="Einstellungen">' + icon('settings') + '</button></header>';

    h += '<section class="card hero">';
    if (act) {
      h += '<p class="label">Training läuft</p><h2>' + esc(act.planName) + '</h2><p class="muted">Gestartet um ' + fmtTime(act.startedAt) + ' Uhr</p>' +
        '<button class="btn primary big" data-a="resume">' + icon('play') + ' Training fortsetzen</button>';
    } else if (plan) {
      h += '<p class="label">Heutiges Training</p><h2>' + esc(plan.name) + '</h2><p class="muted">' + esc(planInfo(plan)) + '</p>';
      if (done.length) h += '<div class="doneBadge">' + icon('check') + ' Heute bereits trainiert</div><br>';
      h += '<button class="btn primary big" data-a="startPlan" data-plan="' + plan.id + '" data-date="' + today + '">' + icon('play') + ' Training starten</button>' +
        '<button class="btn block ghost" data-a="pickPlan" data-date="' + today + '">Anderes Training wählen</button>';
    } else {
      h += '<p class="label">Heute</p><h2>Ruhetag 😌</h2><p class="muted">Erholung gehört zum Training dazu.</p>';
      if (done.length) h += '<div class="doneBadge">' + icon('check') + ' Heute trotzdem trainiert</div><br>';
      h += '<button class="btn primary big" data-a="pickPlan" data-date="' + today + '">' + icon('play') + ' Trotzdem trainieren</button>';
    }
    h += '</section>';

    h += '<div class="grid3"><div class="stat"><b>' + weekDone + (weekPlanned ? '<small>/' + weekPlanned + '</small>' : '') + '</b><span>Diese Woche</span></div>' +
      '<div class="stat"><b>' + weekStreak() + '</b><span>Wochen-Serie 🔥</span></div>' +
      '<div class="stat"><b>' + completedList().length + '</b><span>Gesamt</span></div></div>';

    let next = null;
    for (let i = 1; i <= 28 && !next; i++) {
      const ds = ymd(addDays(new Date(), i)), p = planForDate(ds);
      if (p) next = { ds: ds, p: p };
    }
    const last = completedList().pop();
    h += '<div class="card"><div class="row between"><div class="grow"><p class="label" style="color:var(--ac2)">Nächstes Training</p>' +
      (next ? '<b>' + esc(next.p.name) + '</b><p class="muted" style="margin:0">' + fmtLong(next.ds) + '</p>' : '<p class="muted" style="margin:0">Noch nichts geplant – lege einen Wochenplan an.</p>') +
      '</div></div></div>';
    if (last) {
      h += '<button class="hist" data-a="openWorkout" data-id="' + last.id + '"><p class="label" style="color:var(--mu)">Zuletzt absolviert</p><b>' + esc(last.planName) + '</b>' +
        '<small>' + fmtLong(last.date) + ' · ' + esc(wMeta(last)) + '</small></button>';
    }
    const wl = lastWeight(), td = bodyOn(today);
    h += '<button class="hist" data-a="nav" data-v="body"><p class="label" style="color:var(--mu)">Körpergewicht</p>' +
      (td ? '<b>' + fmtKg(td.kg) + ' kg</b><small>Heute eingetragen ✓</small>' : '<b>' + (wl ? fmtKg(wl.kg) + ' kg' : 'Noch kein Eintrag') + '</b><small>' + (wl ? 'Zuletzt am ' + fmtShort(wl.date) + ' · ' : '') + 'Heute eintragen</small>') + '</button>';
    h += '<div class="section-t">Training der letzten 6 Wochen</div><div class="card">' + weeklyBars(6) + '</div>';
    return h;
  }

  /* ---------- Ansicht: Trainingspläne ---------- */
  function daysOfPlan(p) {
    const s = S.get(); const r = [];
    s.schedule.forEach((id, i) => { if (id === p.id) r.push(i); });
    return r;
  }
  function viewPlans() {
    const s = S.get(), today = ymd(new Date());
    let h = '<header class="top"><h1>Trainingspläne</h1></header>';
    h += '<div class="card"><div class="row between" style="margin-bottom:8px"><h3>Wochenplan</h3><button class="btn sm" data-a="schedEdit">' + icon('edit') + ' Ändern</button></div><div class="sched">' +
      DAYS_L.map((d, i) => { const p = planById(s.schedule[i]); return '<div><span>' + d.slice(0, 2) + '</span><span>' + (p ? esc(p.name) : '–') + '</span></div>'; }).join('') + '</div></div>';
    if (!s.plans.length) h += '<p class="muted">Noch keine Trainingspläne. Erstelle deinen ersten Plan!</p>';
    s.plans.forEach(p => {
      const days = daysOfPlan(p);
      const card = isCardio(p);
      h += '<section class="card"><div class="row between"><h3 class="row" style="gap:8px">' + icon(SPORTS[sportOf(p)].icon) + esc(p.name) + '</h3><span class="tag">' + esc(card ? SPORTS[p.type].label : p.exercises.length + ' Übungen') + '</span></div>' +
        '<div class="plan-chips">' + (days.length ? days.map(i => '<span class="chip static on">' + DAYS_S[i] + '</span>').join('') : '<span class="muted" style="font-size:13px">Keinem Wochentag zugeordnet</span>') + '</div>' +
        '<p class="muted" style="font-size:14px">' + (card ? esc(planInfo(p)) + (p.desc ? ' · ' + esc(p.desc) : '') : (p.exercises.slice(0, 4).map(e => esc(e.name)).join(', ') || 'Noch keine Übungen') + (p.exercises.length > 4 ? ' …' : '')) + '</p>' +
        '<div class="row wrap"><button class="btn sm primary" data-a="startPlan" data-plan="' + p.id + '" data-date="' + today + '">' + icon('play') + ' Starten</button>' +
        '<button class="btn sm" data-a="editPlan" data-id="' + p.id + '">' + icon('edit') + ' Bearbeiten</button>' +
        '<button class="btn sm ghost" data-a="dupPlan" data-id="' + p.id + '">Kopieren</button>' +
        '<button class="icon-btn sm danger" data-a="delPlan" data-id="' + p.id + '" aria-label="Löschen">' + icon('trash') + '</button></div></section>';
    });
    h += '<button class="btn primary big" data-a="newPlan">' + icon('plus') + ' Neuen Trainingsplan erstellen</button>';
    return h;
  }

  function newPlanSheet() {
    let h = sheetHead('Neuer Plan') + '<p class="muted">Welche Sportart soll der Plan haben?</p>';
    ['strength', 'run', 'bike', 'swim'].forEach(k => { h += '<button class="btn block" data-a="newPlanType" data-t="' + k + '">' + icon(SPORTS[k].icon) + ' ' + SPORTS[k].label + '</button>'; });
    openSheet(h);
  }

  function viewPlanEdit() {
    const p = planById(ui.planId), s = S.get(), card = isCardio(p);
    let h = '<div class="wk-top"><button class="icon-btn" data-a="nav" data-v="plans" aria-label="Zurück">' + icon('left') + '</button><div class="wk-title"><h1>Plan bearbeiten</h1></div></div>';
    h += '<div class="card"><label class="field" style="margin-top:0"><span>Name des Trainingsplans</span><input type="text" value="' + esc(p.name) + '" data-in="planName" maxlength="40" placeholder="z. B. ' + (card ? 'Lockerer Dauerlauf' : 'Oberkörper') + '"></label>' +
      '<div class="field"><span>Wochentage (wiederkehrend)</span><div class="chips">' +
      DAYS_S.map((d, i) => '<button class="chip ' + (s.schedule[i] === p.id ? 'on' : '') + '" data-a="togDay" data-d="' + i + '">' + d + '</button>').join('') + '</div></div></div>';
    if (card) {
      const u = SPORTS[p.type].unit;
      h += '<div class="section-t">' + SPORTS[p.type].label + '</div><div class="card"><div class="field" style="margin-top:0"><span>Sportart</span><div class="chips">' +
        ['run', 'bike', 'swim'].map(k => '<button class="chip ' + (p.type === k ? 'on' : '') + '" data-a="planType" data-t="' + k + '">' + SPORTS[k].label + '</button>').join('') + '</div></div>' +
        '<div class="grid2" style="margin:0"><label class="field" style="margin:12px 0 0"><span>Zieldistanz (' + u + ')</span><input type="text" inputmode="decimal" value="' + esc(p.targetDist || '') + '" data-in="planDist" placeholder="optional"></label>' +
        '<label class="field" style="margin:12px 0 0"><span>Zieldauer (Minuten)</span><input type="text" inputmode="numeric" value="' + esc(p.targetMin || '') + '" data-in="planMin" placeholder="optional"></label></div>' +
        '<label class="field"><span>Beschreibung</span><input type="text" value="' + esc(p.desc || '') + '" data-in="planDesc" maxlength="80" placeholder="z. B. locker, Gespräch möglich"></label></div>';
      h += '<button class="btn block" data-a="nav" data-v="plans">Fertig</button>';
      return h;
    }
    h += '<div class="section-t">Übungen</div><div class="card">';
    if (!p.exercises.length) h += '<p class="muted">Noch keine Übungen. Füge unten die erste hinzu.</p>';
    p.exercises.forEach((e, i) => {
      h += '<div class="exrow"><span class="num">' + (i + 1) + '</span><input type="text" value="' + esc(e.name) + '" data-in="exName" data-i="' + i + '" maxlength="60" aria-label="Übungsname">' +
        '<input type="number" inputmode="numeric" min="1" max="20" value="' + (e.sets || 3) + '" data-in="exSets" data-i="' + i + '" aria-label="Anzahl Sätze" title="Sätze">' +
        '<div class="btns"><button class="icon-btn sm" data-a="moveEx" data-i="' + i + '" data-dir="-1" ' + (i === 0 ? 'disabled' : '') + ' aria-label="Nach oben">' + icon('up') + '</button>' +
        '<button class="icon-btn sm" data-a="moveEx" data-i="' + i + '" data-dir="1" ' + (i === p.exercises.length - 1 ? 'disabled' : '') + ' aria-label="Nach unten">' + icon('down') + '</button>' +
        '<button class="icon-btn sm danger" data-a="delPlanEx" data-i="' + i + '" aria-label="Entfernen">' + icon('trash') + '</button></div></div>';
    });
    h += '<p class="muted" style="font-size:12px;margin:4px 0 0">Das Feld rechts neben dem Namen ist die Anzahl der Sätze.</p></div>';
    h += '<div class="row"><input id="newEx" type="text" list="sugg" placeholder="Neue Übung hinzufügen…" maxlength="60" class="grow"><button class="btn primary" data-a="addPlanEx">' + icon('plus') + '</button></div>';
    h += '<button class="btn block" data-a="nav" data-v="plans">Fertig</button>';
    return h;
  }

  /* ---------- Ansicht: Kalender ---------- */
  function dayStatus(ds, today) {
    const plan = planForDate(ds), done = doneOn(ds);
    let cls = '', mark = '', label = '';
    if (done.length) { cls = 'done'; mark = '<span class="mk ok">' + icon('check') + '</span>'; label = done[0].planName; }
    else if (plan && ds < today) { cls = 'missed'; mark = '<span class="mk miss">' + icon('x') + '</span>'; label = plan.name; }
    else if (plan) { cls = 'planned'; mark = '<span class="mk dot"></span>'; label = plan.name; }
    else { mark = '<span class="mk"></span>'; }
    return { plan: plan, done: done, cls: cls, mark: mark, label: label };
  }

  function viewCalendar() {
    const today = ymd(new Date()), cur = ui.calCursor;
    let title, body;
    if (ui.calMode === 'month') {
      title = MONTHS[cur.getMonth()] + ' ' + cur.getFullYear();
      const y = cur.getFullYear(), m = cur.getMonth(), lead = wd(new Date(y, m, 1)), dim = new Date(y, m + 1, 0).getDate();
      body = '<div class="cal-head">' + DAYS_S.map(d => '<span>' + d + '</span>').join('') + '</div><div class="cal-grid">';
      for (let i = 0; i < lead; i++) body += '<div class="cell blank"></div>';
      for (let d = 1; d <= dim; d++) {
        const ds = ymd(new Date(y, m, d)), st = dayStatus(ds, today);
        body += '<button class="cell ' + st.cls + (ds === today ? ' today' : '') + '" data-a="openDay" data-date="' + ds + '"><span class="dn">' + d + '</span>' + st.mark + '<span class="pn">' + esc(st.label) + '</span></button>';
      }
      body += '</div>';
    } else {
      const ws = startOfWeek(cur), we = addDays(ws, 6);
      title = ws.getDate() + '.' + (ws.getMonth() + 1) + '. – ' + we.getDate() + '.' + (we.getMonth() + 1) + '.' + we.getFullYear();
      body = '';
      for (let i = 0; i < 7; i++) {
        const d = addDays(ws, i), ds = ymd(d), st = dayStatus(ds, today);
        let sub = st.cls === 'done' ? 'Erledigt' + (isCardio(st.done[0]) && cardioLine(st.done[0]) ? ' · ' + cardioLine(st.done[0]) : wDur(st.done[0]) ? ' · ' + fmtDur(wDur(st.done[0])) : '') : st.cls === 'missed' ? 'Nicht absolviert' : st.cls === 'planned' ? 'Geplant' : 'Kein Training';
        body += '<button class="wrow ' + st.cls + (ds === today ? ' today' : '') + '" data-a="openDay" data-date="' + ds + '"><div class="wd"><b>' + DAYS_S[i] + '</b><span>' + d.getDate() + '.' + (d.getMonth() + 1) + '.</span></div>' +
          '<div class="wi"><b>' + (st.label ? esc(st.label) : 'Ruhetag') + '</b><small>' + sub + '</small></div>' + st.mark + '</button>';
      }
    }
    return '<header class="top row between"><h1>Kalender</h1><button class="btn sm" data-a="schedEdit">' + icon('edit') + ' Wochenplan</button></header>' +
      '<div class="seg" style="margin-bottom:12px"><button class="' + (ui.calMode === 'month' ? 'on' : '') + '" data-a="calMode" data-m="month">Monat</button><button class="' + (ui.calMode === 'week' ? 'on' : '') + '" data-a="calMode" data-m="week">Woche</button></div>' +
      '<div class="cal-nav"><button class="icon-btn" data-a="calPrev" aria-label="Zurück">' + icon('left') + '</button><h2>' + title + '</h2><button class="icon-btn" data-a="calNext" aria-label="Weiter">' + icon('right') + '</button></div>' +
      body +
      '<div class="legend"><span><i class="mk ok" style="display:inline-flex">' + icon('check') + '</i> Absolviert</span><span><i class="mk miss" style="display:inline-flex">' + icon('x') + '</i> Nicht absolviert</span><span><i class="mk dot"></i> Geplant</span></div>' +
      '<button class="btn block ghost" data-a="calToday">Heute</button>';
  }

  function workoutSummaryCard(w) {
    const d = wDur(w);
    let h = '<div class="wcard"><div class="row between"><b>' + icon('check') + ' ' + esc(w.planName) + '</b><span class="tag ac">' + (w.quick ? 'Abgehakt' : isCardio(w) ? esc(SPORTS[sportOf(w)].label) : wSets(w) + ' Sätze') + '</span></div>';
    if (d && !isCardio(w)) h += '<small>Dauer: ' + fmtDur(d) + '</small>';
    if (w.quick) h += '<small>Ohne Details abgehakt</small>';
    else if (isCardio(w)) {
      h += '<p style="margin:8px 0 4px">' + esc(cardioLine(w) || 'Keine Werte eingetragen') + '</p>' + (w.cardio && w.cardio.notes ? '<small>' + esc(w.cardio.notes) + '</small>' : '');
    } else {
      h += '<ul>' + w.exercises.map(e => {
        const sets = e.sets.filter(s => s.done);
        return sets.length ? '<li><b>' + esc(e.name) + '</b>: ' + sets.map(s => fmtKg(s.kg) + '×' + num(s.reps)).join(' · ') + '</li>' : '';
      }).join('') + '</ul>';
    }
    (w.prs || []).forEach(p => { h += '<span class="tag pr">🏆 ' + esc(p.name) + ' ' + fmtKg(p.kg) + ' kg</span> '; });
    h += '<button class="btn sm block" data-a="openWorkout" data-id="' + w.id + '">Ansehen / bearbeiten</button></div>';
    return h;
  }

  function openDay(ds) {
    const today = ymd(new Date()), s = S.get(), plan = planForDate(ds), done = doneOn(ds);
    const hasOv = Object.prototype.hasOwnProperty.call(s.overrides, ds);
    let h = sheetHead(fmtLongY(ds));
    h += '<p class="muted">' + (plan ? 'Geplant: <b style="color:var(--tx)">' + esc(plan.name) + '</b>' : 'Ruhetag / kein Training geplant') + (hasOv ? ' <span class="tag">angepasst</span>' : '') + '</p>';
    done.forEach(w => { h += workoutSummaryCard(w); });
    s.mobilityLog.filter(m => m.date === ds).forEach(m => { h += '<div class="wcard"><div class="row between"><b>' + icon('mobility') + ' ' + esc(m.title) + '</b><span class="tag">' + (m.minutes ? m.minutes + ' Min' : 'Beweglichkeit') + '</span></div></div>'; });
    if (ds <= today) {
      if (plan && !done.length) {
        h += '<button class="btn primary block" data-a="startPlan" data-plan="' + plan.id + '" data-date="' + ds + '">' + icon('play') + ' ' + (ds === today ? 'Training starten' : 'Training nachtragen') + '</button>';
        h += '<button class="btn block" data-a="quickDone" data-plan="' + plan.id + '" data-date="' + ds + '">' + icon('check') + ' Trainingstag direkt abhaken</button>';
      }
      h += '<button class="btn block ghost" data-a="pickPlan" data-date="' + ds + '">' + (done.length || plan ? 'Anderes / weiteres Training eintragen' : 'Training eintragen') + '</button>';
    }
    h += '<label class="field"><span>Plan für diesen Tag</span><select data-ch="dayplan" data-date="' + ds + '"><option value="">Standard (Wochenplan)</option><option value="rest"' + (hasOv && s.overrides[ds] === 'rest' ? ' selected' : '') + '>Ruhetag</option>' +
      s.plans.map(p => '<option value="' + p.id + '"' + (hasOv && s.overrides[ds] === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select></label>';
    if (plan) h += '<label class="field"><span>Dieses Training verschieben auf …</span><input type="date" data-ch="moveTo" data-date="' + ds + '"></label>';
    openSheet(h);
  }

  function pickPlanSheet(ds) {
    const s = S.get();
    let h = sheetHead('Training wählen') + '<p class="muted">' + fmtLong(ds) + '</p>';
    s.plans.forEach(p => { h += '<button class="btn block" data-a="startPlan" data-plan="' + p.id + '" data-date="' + ds + '">' + icon(SPORTS[sportOf(p)].icon) + ' ' + esc(p.name) + '</button>'; });
    h += '<p class="muted" style="margin:16px 0 6px">Freies Training (ohne Plan)</p><div class="typegrid">' +
      ['strength', 'run', 'bike', 'swim'].map(k => '<button class="btn" data-a="startFree" data-date="' + ds + '" data-sport="' + k + '">' + icon(SPORTS[k].icon) + ' ' + SPORTS[k].label + '</button>').join('') + '</div>';
    openSheet(h);
  }

  function schedSheet() {
    const s = S.get();
    let h = sheetHead('Wochenplan') + '<p class="muted">Welcher Plan soll an welchem Wochentag erscheinen? Änderungen werden sofort gespeichert.</p>';
    DAYS_L.forEach((d, i) => {
      h += '<label class="field"><span>' + d + '</span><select data-ch="sched" data-d="' + i + '"><option value="">Ruhetag</option>' +
        s.plans.map(p => '<option value="' + p.id + '"' + (s.schedule[i] === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select></label>';
    });
    h += '<button class="btn primary block" data-a="closeSheet">Fertig</button>';
    openSheet(h);
  }

  /* ---------- Ansicht: Fortschritt ---------- */
  function exerciseIndex() {
    const map = {};
    completedList().forEach(w => w.exercises.forEach(e => {
      const b = bestSet(e); if (!b) return;
      const k = keyName(e.name);
      if (!map[k]) map[k] = { name: e.name, sessions: [] };
      map[k].name = e.name;
      map[k].sessions.push({ date: w.date, kg: b.kg, reps: b.reps });
    }));
    return map;
  }

  function viewProgress() {
    const now = new Date(), sw = startOfWeek(now);
    const weekC = countBetween(ymd(sw), ymd(addDays(sw, 6)));
    const monthC = countBetween(ymd(new Date(now.getFullYear(), now.getMonth(), 1)), ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    const total = completedList().length, adh = adherence();
    let h = '<header class="top"><h1>Fortschritt</h1></header>';
    h += '<div class="grid2"><div class="stat"><b>' + weekC + '</b><span>Diese Woche</span></div><div class="stat"><b>' + monthC + '</b><span>Diesen Monat</span></div>' +
      '<div class="stat"><b>' + total + '</b><span>Einheiten gesamt</span></div><div class="stat"><b>' + (adh == null ? '–' : adh + '%') + '</b><span>Plan eingehalten (4 Wochen)</span></div></div>';
    h += '<div class="section-t">Trainings pro Woche</div><div class="card">' + weeklyBars(8) + '</div>';

    const idx = exerciseIndex(), keys = Object.keys(idx).sort((a, b) => idx[a].name.localeCompare(idx[b].name, 'de'));
    h += cardioSection();
    h += '<div class="section-t">Trainingsgewichte (Kraft)</div>';
    if (!keys.length) h += '<div class="card"><p class="muted" style="margin:0">Sobald du Sätze abgehakt hast, siehst du hier deine Entwicklung.</p></div>';
    else {
      if (!ui.progEx || !idx[ui.progEx]) ui.progEx = keys[0];
      const ex = idx[ui.progEx];
      h += '<div class="card"><select data-ch="progEx" aria-label="Übung wählen">' + keys.map(k => '<option value="' + esc(k) + '"' + (k === ui.progEx ? ' selected' : '') + '>' + esc(idx[k].name) + '</option>').join('') + '</select>' +
        '<div style="margin-top:12px">' + lineChart(ex.sessions.map(x => ({ label: fmtShort(x.date), y: x.kg }))) + '</div>' +
        '<div style="margin-top:10px">' + ex.sessions.slice(-8).reverse().map(x => '<div class="line"><span>' + fmtShort(x.date) + '</span><b>' + fmtKg(x.kg) + ' kg × ' + x.reps + '</b></div>').join('') + '</div></div>';
    }

    h += '<div class="section-t">Persönliche Bestleistungen 🏆</div><div class="card">';
    if (!keys.length) h += '<p class="muted" style="margin:0">Noch keine Daten.</p>';
    else {
      keys.map(k => {
        const ss = idx[k].sessions; let best = ss[0];
        ss.forEach(x => { if (x.kg > best.kg || (x.kg === best.kg && x.reps > best.reps)) best = x; });
        return { name: idx[k].name, best: best };
      }).sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach(r => {
        h += '<div class="pr-row"><span>' + esc(r.name) + '</span><b>' + fmtKg(r.best.kg) + ' kg × ' + r.best.reps + ' <small>(' + fmtShort(r.best.date) + ')</small></b></div>';
      });
    }
    h += '</div>';

    const hist = completedList().reverse();
    h += '<div class="section-t">Trainingshistorie</div>';
    if (!hist.length) h += '<div class="card"><p class="muted" style="margin:0">Noch keine abgeschlossenen Trainings.</p></div>';
    (ui.histAll ? hist : hist.slice(0, 10)).forEach(w => {
      const d = wDur(w);
      h += '<button class="hist" data-a="openWorkout" data-id="' + w.id + '"><b>' + esc(w.planName) + (w.prs && w.prs.length ? ' 🏆' : '') + '</b><small>' + fmtLongY(w.date) + (w.quick ? ' · abgehakt' : isCardio(w) ? ' · ' + esc(cardioLine(w) || SPORTS[sportOf(w)].label) : ' · ' + wSets(w) + ' Sätze · ' + fmtKg(Math.round(wVolume(w))) + ' kg Volumen' + (d ? ' · ' + fmtDur(d) : '')) + '</small></button>';
    });
    if (hist.length > 10 && !ui.histAll) h += '<button class="btn block ghost" data-a="histAll">Alle ' + hist.length + ' anzeigen</button>';
    return h;
  }

  /* ---------- Ansicht: Einstellungen ---------- */
  function viewSettings() {
    const s = S.get(), st = s.settings;
    const le = st.lastExport ? new Date(st.lastExport) : null;
    const old = !le || (Date.now() - le.getTime() > 30 * 86400000);
    let h = '<header class="top"><h1>Einstellungen</h1></header>';
    h += '<div class="card"><label class="field" style="margin-top:0"><span>Dein Name (optional)</span><input type="text" value="' + esc(st.name) + '" data-in="setName" maxlength="30" placeholder="z. B. Alex"></label>' +
      '<div class="switch"><span>Pausentimer automatisch starten<br><small>Nach jedem abgehakten Satz</small></span><input type="checkbox" data-ch="setTimer" ' + (st.restTimer ? 'checked' : '') + '></div>' +
      '<label class="field"><span>Pausendauer</span><select data-ch="setRest">' + [30, 45, 60, 90, 120, 150, 180, 240, 300].map(v => '<option value="' + v + '"' + (st.restSeconds === v ? ' selected' : '') + '>' + (v >= 60 ? Math.floor(v / 60) + ' Min' + (v % 60 ? ' ' + (v % 60) + ' s' : '') : v + ' Sek') + '</option>').join('') + '</select></label>' +
      '<p class="muted" style="margin:0">Gewichtseinheit: Kilogramm (kg)</p></div>';
    h += '<div class="section-t">Daten sichern</div><div class="card">' +
      '<p class="muted" style="font-size:14px">Deine Daten liegen nur auf diesem Gerät (im Browser). Sichere sie regelmäßig als Datei – so kannst du sie auch auf ein neues Handy übertragen.</p>' +
      (old ? '<div class="notice" style="margin-bottom:10px">' + (le ? 'Letzte Sicherung: ' + le.toLocaleDateString('de-DE') + '. ' : 'Du hast noch keine Sicherung erstellt. ') + 'Bitte jetzt eine Sicherung erstellen.</div>' : '<p class="muted" style="font-size:13px">Letzte Sicherung: ' + le.toLocaleDateString('de-DE') + '</p>') +
      '<button class="btn primary block" data-a="export">Daten exportieren (Datei)</button>' +
      '<button class="btn block" data-a="importPick">Daten importieren</button>' +
      '<input type="file" id="impFile" accept=".json,application/json" data-ch="import" hidden></div>';
    h += '<div class="section-t">Info</div><div class="card"><p style="margin:0 0 6px"><b>' + s.plans.length + '</b> Pläne · <b>' + completedList().length + '</b> abgeschlossene Trainings</p>' +
      '<p class="muted" style="font-size:14px;margin:0">App installieren: Android/Chrome – Menü ⋮ → „App installieren“. iPhone/Safari – Teilen → „Zum Home-Bildschirm“.</p></div>';
    h += '<button class="link-danger" data-a="resetAll">Alle Daten löschen</button>';
    return h;
  }

  /* ---------- Ansicht: Training ---------- */
  function durText(w) {
    if (w.completed) { const d = wDur(w); return d ? fmtDur(d) : '–'; }
    const sec = Math.floor((Date.now() - w.startedAt) / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60;
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s2);
  }

  function exerciseCard(w, e, ei) {
    const last = lastSetsFor(e.name, w.id, w.date);
    const noteKey = w.id + ':' + e.id;
    let h = '<section class="card ex ' + (e.done ? 'ex-done' : '') + '"><div class="ex-h"><h3>' + esc(e.name) + '</h3>' +
      '<button class="btn sm ' + (e.done ? 'on' : '') + '" data-a="toggleEx" data-e="' + ei + '">' + (e.done ? '✓ Abgeschlossen' : 'Abschließen') + '</button></div>';
    if (last) h += '<p class="hint">Letztes Mal: ' + last.map(x => fmtKg(x.kg) + ' kg × ' + x.reps).join(' · ') + '</p>';
    h += '<div class="sh"><span>Satz</span><span>kg</span><span>Wdh.</span><span>Erl.</span><span></span></div>';
    e.sets.forEach((s, si) => {
      h += '<div class="sr ' + (s.done ? 'srdone' : '') + '"><span class="sn">' + (si + 1) + '</span>' +
        '<input type="text" inputmode="decimal" autocomplete="off" aria-label="Gewicht in kg" placeholder="' + (s.sk != null ? fmtKg(s.sk) : '0') + '" value="' + (s.kg === '' ? '' : esc(String(s.kg).replace('.', ','))) + '" data-in="kg" data-e="' + ei + '" data-s="' + si + '">' +
        '<input type="text" inputmode="numeric" autocomplete="off" aria-label="Wiederholungen" placeholder="' + (s.sr != null ? s.sr : '0') + '" value="' + (s.reps === '' ? '' : esc(s.reps)) + '" data-in="reps" data-e="' + ei + '" data-s="' + si + '">' +
        '<button class="chk ' + (s.done ? 'on' : '') + '" data-a="toggleSet" data-e="' + ei + '" data-s="' + si + '" aria-label="Satz erledigt">' + icon('check') + '</button>' +
        '<button class="icon-btn sm" data-a="delSet" data-e="' + ei + '" data-s="' + si + '" aria-label="Satz löschen">' + icon('x') + '</button></div>';
    });
    h += '<div class="ex-f"><button class="btn sm" data-a="addSet" data-e="' + ei + '">' + icon('plus') + ' Satz</button>' +
      '<button class="btn sm ghost" data-a="noteToggle" data-e="' + ei + '">Notiz' + (e.note ? ' ✎' : '') + '</button>' +
      '<button class="icon-btn sm danger" data-a="delEx" data-e="' + ei + '" aria-label="Übung entfernen" style="margin-left:auto">' + icon('trash') + '</button></div>';
    if (e.note || ui.noteOpen[noteKey]) h += '<textarea data-in="note" data-e="' + ei + '" placeholder="Notiz zur Übung …" maxlength="500">' + esc(e.note) + '</textarea>';
    return h + '</section>';
  }

  function cardioStats(w, d) {
    const t = cardioTempo(w), c = w.cardio || {};
    return '<div class="grid3"><div class="stat"><b>' + (d ? Math.max(1, Math.round(d / 60000)) : '–') + '</b><span>Minuten</span></div>' +
      '<div class="stat"><b>' + (num(c.distance) > 0 ? fmtKg(num(c.distance)) : '–') + '</b><span>' + SPORTS[sportOf(w)].unit + '</span></div>' +
      '<div class="stat"><b>' + (t ? t.val : '–') + '</b><span>' + (t ? t.unit : 'Tempo') + '</span></div></div>';
  }
  function tempoText(w) { const t = cardioTempo(w); return t ? 'Ø Tempo: ' + t.val + ' ' + t.unit : ''; }

  function viewCardio() {
    const w = W(), done = w.completed, sp = sportOf(w), u = SPORTS[sp].unit, plan = planById(w.planId);
    const c = w.cardio || (w.cardio = { durationMin: '', distance: '', notes: '' });
    const val = v => (v === '' || v == null) ? '' : esc(String(v).replace('.', ','));
    let h = '<div class="wk-top"><button class="icon-btn" data-a="leave" aria-label="Zurück">' + icon('left') + '</button><div class="wk-title"><h1>' + esc(w.planName) + '</h1>' +
      '<p class="muted" style="margin:0">' + fmtLong(w.date) + '</p></div></div>';
    if (done) h += '<p class="notice">Abgeschlossenes Training – Änderungen werden automatisch gespeichert.</p>';
    if (plan && (plan.targetDist || plan.targetMin || plan.desc)) {
      h += '<div class="card"><p class="label">Ziel</p><b>' + esc(planInfo(plan)) + '</b>' + (plan.desc ? '<p class="muted" style="margin:4px 0 0">' + esc(plan.desc) + '</p>' : '') + '</div>';
    }
    h += '<section class="card">';
    if (!done && !w.manual) h += '<div class="stopw"><div><small>Zeit seit Start</small><br><b id="dur">' + durText(w) + '</b></div><button class="btn sm" data-a="cardioTime">Zeit übernehmen</button></div>';
    h += '<div class="cfield"><label class="field" style="margin:0"><span>Distanz (' + u + ')</span><input type="text" inputmode="decimal" autocomplete="off" data-in="cDist" value="' + val(c.distance) + '" placeholder="0"></label>' +
      '<label class="field" style="margin:0"><span>Dauer (Minuten)</span><input type="text" inputmode="numeric" autocomplete="off" data-in="cMin" value="' + val(c.durationMin) + '" placeholder="0"></label></div>' +
      '<div class="ccalc" id="ccalc">' + esc(tempoText(w)) + '</div>' +
      '<textarea data-in="cNotes" placeholder="Notiz (z. B. Strecke, Wetter, Gefühl) …" maxlength="500">' + esc(c.notes) + '</textarea></section>';
    h += '<button class="link-danger" data-a="discard">' + (done ? 'Training löschen' : 'Training verwerfen') + '</button>';
    h += '<div class="bottombar"><button class="btn primary big" style="margin:0" data-a="' + (done ? 'doneEdit' : 'finish') + '">' + icon('check') + ' ' + (done ? 'Fertig' : 'Training abschließen') + '</button></div>';
    return h;
  }

  function viewWorkout() {
    if (isCardio(W())) return viewCardio();
    const w = W(), done = w.completed;
    let h = '<div class="wk-top"><button class="icon-btn" data-a="leave" aria-label="Zurück">' + icon('left') + '</button><div class="wk-title"><h1>' + esc(w.planName) + '</h1>' +
      '<p class="muted" style="margin:0">' + fmtLong(w.date) + ' · <span id="dur">' + durText(w) + '</span></p></div>' +
      '<button class="icon-btn" data-a="timerManual" aria-label="Pausentimer">' + icon('timer') + '</button></div>';
    if (done) h += '<p class="notice">Abgeschlossenes Training – Änderungen werden automatisch gespeichert.</p>';
    if (done && w.prs && w.prs.length) h += '<p>' + w.prs.map(p => '<span class="tag pr">🏆 ' + esc(p.name) + ': ' + fmtKg(p.kg) + ' kg × ' + p.reps + '</span>').join(' ') + '</p>';
    if (!w.exercises.length) h += '<p class="muted">Noch keine Übungen – füge unten eine hinzu.</p>';
    w.exercises.forEach((e, ei) => { h += exerciseCard(w, e, ei); });
    h += '<button class="btn add" data-a="addExAsk">' + icon('plus') + ' Übung hinzufügen</button>';
    h += '<button class="link-danger" data-a="discard">' + (done ? 'Training löschen' : 'Training verwerfen') + '</button>';
    h += '<div class="bottombar"><button class="btn primary big" style="margin:0" data-a="' + (done ? 'doneEdit' : 'finish') + '">' + icon('check') + ' ' + (done ? 'Fertig' : 'Training abschließen') + '</button></div>';
    return h;
  }

  /* ---------- Ansicht: Körperdaten ---------- */
  function viewBody() {
    const s = S.get(), today = ymd(new Date()), ds = ui.bodyDate || today, cur = bodyOn(ds), list = bodyList(), last = lastWeight();
    const goal = num(s.settings.goalKg);
    let h = '<header class="top"><h1>Körperdaten</h1><p class="muted">Trage dein Gewicht täglich ein.</p></header>';
    h += '<section class="card"><div class="row between" style="margin-bottom:12px"><b>' + (ds === today ? 'Heute' : fmtLongY(ds)) + '</b>' +
      '<input type="date" value="' + ds + '" max="' + today + '" data-ch="bodyDate" aria-label="Datum" style="width:auto"></div>' +
      '<div class="bigfield"><button class="icon-btn" data-a="bodyStep" data-v="-0.1" aria-label="0,1 kg weniger">−</button>' +
      '<input id="bKg" type="text" inputmode="decimal" autocomplete="off" aria-label="Gewicht in kg" value="' + (cur ? esc(String(cur.kg).replace('.', ',')) : '') + '" placeholder="' + (last ? esc(fmtKg(last.kg)) : '0,0') + '">' +
      '<button class="icon-btn" data-a="bodyStep" data-v="0.1" aria-label="0,1 kg mehr">+</button></div>' +
      '<p class="muted" style="text-align:center;margin:6px 0 0">Kilogramm</p>' +
      '<label class="field"><span>Notiz (optional)</span><input id="bNote" type="text" maxlength="80" value="' + esc(cur ? cur.note : '') + '" placeholder="z. B. morgens nüchtern"></label>' +
      '<button class="btn primary big" style="margin-top:0" data-a="bodySave">' + icon('check') + (cur ? ' Änderung speichern' : ' Gewicht speichern') + '</button>' +
      (cur ? '<button class="link-danger" data-a="bodyDel">Eintrag löschen</button>' : '') + '</section>';
    if (list.length) {
      const first = list[0], diff = Math.round((num(last.kg) - num(first.kg)) * 10) / 10;
      const wk = list.filter(b => b.date >= ymd(addDays(new Date(), -6)));
      const avg = wk.length ? wk.reduce((a, b) => a + num(b.kg), 0) / wk.length : null;
      h += '<div class="grid3"><div class="stat"><b>' + fmtKg(last.kg) + '</b><span>Aktuell (kg)</span></div>' +
        '<div class="stat"><b>' + (diff > 0 ? '+' : '') + fmtKg(diff) + '</b><span>Seit Beginn (kg)</span></div>' +
        '<div class="stat"><b>' + (avg == null ? '–' : fmtKg(Math.round(avg * 10) / 10)) + '</b><span>Ø 7 Tage (kg)</span></div></div>';
    }
    const rng = ui.bodyRange, from = rng === 'all' ? '0000-00-00' : ymd(addDays(new Date(), -(+rng - 1)));
    const pts = list.filter(b => b.date >= from).map(b => ({ t: parseYmd(b.date).getTime(), y: num(b.kg), label: fmtShort(b.date) }));
    h += '<div class="section-t">Verlauf</div><div class="card"><div class="seg" style="margin-bottom:12px">' +
      [['30', '30 Tage'], ['90', '90 Tage'], ['all', 'Alles']].map(r => '<button class="' + (rng === r[0] ? 'on' : '') + '" data-a="bodyRange" data-r="' + r[0] + '">' + r[1] + '</button>').join('') + '</div>' + timeChart(pts, goal) + '</div>';
    h += '<div class="card"><label class="field" style="margin:0"><span>Zielgewicht (kg, optional)</span><input type="text" inputmode="decimal" value="' + (goal > 0 ? esc(String(s.settings.goalKg).replace('.', ',')) : '') + '" data-in="goalKg" placeholder="z. B. 75"></label>' +
      (goal > 0 && last ? '<p class="muted" style="margin:10px 0 0">' + (Math.abs(num(last.kg) - goal) < 0.05 ? 'Ziel erreicht 🎉' : 'Noch ' + fmtKg(Math.round(Math.abs(num(last.kg) - goal) * 10) / 10) + ' kg bis zum Ziel') + '</p>' : '') + '</div>';
    h += '<div class="section-t">Einträge</div>';
    if (!list.length) h += '<div class="card"><p class="muted" style="margin:0">Noch keine Einträge. Trage oben dein heutiges Gewicht ein.</p></div>';
    const rows = list.slice().reverse();
    (ui.bodyAll ? rows : rows.slice(0, 14)).forEach(b => {
      const idx = list.indexOf(b), prev = idx > 0 ? list[idx - 1] : null, dl = prev ? Math.round((num(b.kg) - num(prev.kg)) * 10) / 10 : null;
      h += '<button class="hist" data-a="bodyPick" data-date="' + b.date + '"><span class="row between"><b>' + fmtKg(b.kg) + ' kg</b><small>' + (dl == null ? '' : (dl > 0 ? '+' : '') + fmtKg(dl) + ' kg') + '</small></span>' +
        '<small>' + fmtLongY(b.date) + (b.note ? ' · ' + esc(b.note) : '') + '</small></button>';
    });
    if (rows.length > 14 && !ui.bodyAll) h += '<button class="btn block ghost" data-a="bodyAll">Alle ' + rows.length + ' anzeigen</button>';
    return h;
  }

  /* ---------- Ansicht: Beweglichkeit (Dehnen / Mobility / Haltung) ---------- */
  function viewMobility() {
    const log = S.get().mobilityLog, sw = startOfWeek(new Date());
    const weekN = log.filter(m => m.date >= ymd(sw) && m.date <= ymd(addDays(sw, 6))).length;
    let h = '<header class="top"><h1>Beweglichkeit</h1><p class="muted">Dehnen, Mobility und Haltung. Wähle ein Programm.</p></header>';
    h += '<div class="grid2"><div class="stat"><b>' + weekN + '</b><span>Diese Woche</span></div><div class="stat"><b>' + log.length + '</b><span>Einheiten gesamt</span></div></div>';
    h += '<div class="chips" style="margin-bottom:12px">' + ['Alle', 'Mobility', 'Dehnen', 'Haltung'].map(c => '<button class="chip ' + (ui.mobCat === c ? 'on' : '') + '" data-a="mobCat" data-c="' + c + '">' + c + '</button>').join('') + '</div>';
    Mobi.PROGRAMS.filter(p => ui.mobCat === 'Alle' || p.cat === ui.mobCat).forEach(p => {
      const ld = log.filter(m => m.progId === p.id).map(m => m.date).sort().pop();
      h += '<button class="prog" data-a="openProg" data-id="' + p.id + '"><span class="row between"><b>' + esc(p.name) + '</b><span class="tag">' + esc(p.cat) + '</span></span>' +
        '<p class="muted">' + esc(p.desc) + '</p><p class="muted" style="font-size:13px">' + p.ex.length + ' Übungen · ca. ' + Mobi.progMinutes(p) + ' Min' + (ld ? ' · zuletzt ' + fmtShort(ld) : '') + '</p></button>';
    });
    const recent = log.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5);
    if (recent.length) {
      h += '<div class="section-t">Zuletzt gemacht</div><div class="card">' + recent.map(m => '<div class="line"><span>' + fmtShort(m.date) + ' · ' + esc(m.title) + '</span><span class="row" style="gap:8px"><small>' + (m.minutes || 0) + ' Min</small>' +
        '<button class="icon-btn sm danger" data-a="mobDelLog" data-id="' + m.id + '" aria-label="Eintrag löschen">' + icon('x') + '</button></span></div>').join('') + '</div>';
    }
    return h;
  }

  function viewMobProgram() {
    const p = progById(ui.progId);
    let h = '<div class="wk-top"><button class="icon-btn" data-a="nav" data-v="mobility" aria-label="Zurück">' + icon('left') + '</button><div class="wk-title"><h1>' + esc(p.name) + '</h1></div></div>';
    h += '<p class="muted">' + esc(p.desc) + '</p><div class="row wrap" style="margin-bottom:6px"><span class="tag">' + esc(p.cat) + '</span><span class="tag">' + p.ex.length + ' Übungen</span><span class="tag">ca. ' + Mobi.progMinutes(p) + ' Min</span></div>';
    h += '<button class="btn primary big" data-a="mobStart">' + icon('play') + ' Geführt starten</button>';
    h += '<button class="btn block ghost" data-a="mobLog">' + icon('check') + ' Als erledigt eintragen</button>';
    h += '<div class="section-t">Übungen</div>';
    p.ex.forEach((id, i) => {
      const e = Mobi.EX[id];
      h += '<section class="mx"><div class="row"><span class="tag ac">' + (i + 1) + '</span><h3>' + esc(e.name) + '</h3></div><div class="row"><span class="tag">' + esc(e.dose) + '</span><span class="area">' + esc(e.area) + '</span></div>' +
        Mobi.figures(id) + '<p>' + esc(e.text) + '</p></section>';
    });
    return h;
  }

  /* Geführtes Programm */
  const mobSteps = p => p.ex.reduce((n, id) => n + (Mobi.EX[id].perSide ? 2 : 1), 0);
  function mobStepNo(p) {
    let n = 0;
    for (let i = 0; i < ui.mobIdx; i++) n += Mobi.EX[p.ex[i]].perSide ? 2 : 1;
    return n + (Mobi.EX[p.ex[ui.mobIdx]].perSide ? ui.mobSide : 1);
  }
  function mobPct(left) { const p = progById(ui.progId); return Math.min(100, ((mobStepNo(p) - 1 + (1 - left / (mob.total || 1))) / mobSteps(p)) * 100); }
  function mobLoad(run) {
    const e = Mobi.EX[progById(ui.progId).ex[ui.mobIdx]];
    mob.total = e.sec; mob.left = e.sec; mob.end = run ? Date.now() + e.sec * 1000 : 0;
  }
  function mobRelease() { if (mob.lock) { try { mob.lock.release(); } catch (e) { /* ignorieren */ } mob.lock = null; } }
  function mobAdvance(dir, run) {
    const p = progById(ui.progId);
    let idx = ui.mobIdx, side = ui.mobSide;
    if (dir > 0) {
      if (Mobi.EX[p.ex[idx]].perSide && side === 1) side = 2; else { idx++; side = 1; }
      if (idx >= p.ex.length) { mobFinish(); return; }
    } else if (Mobi.EX[p.ex[idx]].perSide && side === 2) side = 1;
    else if (idx > 0) { idx--; side = Mobi.EX[p.ex[idx]].perSide ? 2 : 1; }
    ui.mobIdx = idx; ui.mobSide = side; mobLoad(run); render(); window.scrollTo(0, 0);
  }
  function mobFinish() {
    const p = progById(ui.progId), min = Mobi.progMinutes(p);
    mob.end = 0; mobRelease();
    S.get().mobilityLog.push({ id: S.uid(), date: ymd(new Date()), progId: p.id, title: p.name, minutes: min }); S.save();
    go('mobility');
    openSheet('<div style="text-align:center"><div style="font-size:48px">🧘</div><h2>Programm geschafft!</h2><p class="muted">' + esc(p.name) + ' · ' + min + ' Min wurden eingetragen.</p></div><button class="btn primary block" data-a="closeSheet">Fertig</button>');
  }
  function tickMob() {
    const ms = mob.end - Date.now();
    if (ms <= 0) { beep(); mobAdvance(1, true); return; }
    const t = $('#mtime'), b = $('#mbar');
    if (t) t.textContent = fmtClock(Math.ceil(ms / 1000));
    if (b) b.style.width = mobPct(ms / 1000) + '%';
  }
  function viewMobPlay() {
    const p = progById(ui.progId), e = Mobi.EX[p.ex[ui.mobIdx]], n = mobSteps(p), k = mobStepNo(p);
    const run = mob.end > 0, left = run ? Math.max(0, Math.ceil((mob.end - Date.now()) / 1000)) : Math.ceil(mob.left);
    let nextTxt = 'Fertig 🎉';
    if (e.perSide && ui.mobSide === 1) nextTxt = 'Seite wechseln: ' + e.name;
    else if (ui.mobIdx + 1 < p.ex.length) nextTxt = Mobi.EX[p.ex[ui.mobIdx + 1]].name;
    let h = '<div class="wk-top"><button class="icon-btn" data-a="mobExit" aria-label="Beenden">' + icon('x') + '</button><div class="wk-title"><h1>' + esc(p.name) + '</h1><p class="muted" style="margin:0">Schritt ' + k + ' von ' + n + '</p></div></div>';
    h += '<div class="pbar"><i id="mbar" style="width:' + fmtNum1(mobPct(left)) + '%"></i></div>';
    h += '<section class="card">' + Mobi.figures(p.ex[ui.mobIdx]) + '<h2>' + esc(e.name) + '</h2>' +
      '<div class="row wrap" style="margin-bottom:8px"><span class="tag">' + esc(e.dose) + '</span>' + (e.perSide ? '<span class="tag ac">Seite ' + ui.mobSide + ' von 2</span>' : '') + '</div>' +
      '<p>' + esc(e.text) + '</p><div class="bigtime" id="mtime">' + fmtClock(left) + '</div>' +
      '<div class="ctrl"><button class="btn" data-a="mobPrev" aria-label="Zurück">' + icon('left') + '</button>' +
      '<button class="btn primary" data-a="mobToggle">' + (run ? 'Pause' : (mob.left < mob.total ? 'Weiter' : 'Start')) + '</button>' +
      '<button class="btn" data-a="mobNext" aria-label="Überspringen">' + icon('right') + '</button></div></section>';
    h += '<p class="muted" style="text-align:center">Als Nächstes: ' + esc(nextTxt) + '</p>';
    return h;
  }
  const fmtNum1 = v => String(Math.round(v * 10) / 10);

  /* ---------- Pausentimer ---------- */
  const timer = { end: 0, total: 0 };
  const mob = { end: 0, total: 0, left: 0, lock: null }; // Geführtes Beweglichkeits-Programm: end > 0 = läuft, sonst Pause
  let actx = null;
  function unlockAudio() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* kein Ton */ }
  }
  function beep() {
    try {
      if (actx) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.connect(g); g.connect(actx.destination); o.frequency.value = 880; g.gain.value = 0.15;
        o.start(); o.stop(actx.currentTime + 0.3);
      }
    } catch (e) { /* ignorieren */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
  const fmtClock = sec => Math.floor(sec / 60) + ':' + pad(sec % 60);
  function startTimer(sec) { timer.total = sec; timer.end = Date.now() + sec * 1000; renderTimer(); }
  function stopTimer() { timer.end = 0; renderTimer(); }
  function renderTimer() {
    const el = $('#timerbar');
    if (!timer.end || ui.view !== 'workout') { el.innerHTML = ''; return; }
    const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
    el.innerHTML = '<div class="tbar"><div class="tfill" id="tfill"></div><span class="tl">Pause</span><span id="tleft">' + fmtClock(left) + '</span>' +
      '<button class="btn sm" data-a="tAdd" data-v="-15">−15</button><button class="btn sm" data-a="tAdd" data-v="15">+15</button>' +
      '<button class="icon-btn sm" data-a="tStop" aria-label="Timer beenden">' + icon('x') + '</button></div>';
    tickTimer();
  }
  function tickTimer() {
    if (!timer.end) return;
    const ms = timer.end - Date.now();
    if (ms <= 0) { timer.end = 0; renderTimer(); beep(); toast('Pause vorbei – weiter geht’s! 💪'); return; }
    const l = $('#tleft'), f = $('#tfill');
    if (l) l.textContent = fmtClock(Math.ceil(ms / 1000));
    if (f) f.style.width = (100 - ms / (timer.total * 10)) + '%';
  }
  setInterval(() => {
    tickTimer();
    if (ui.view === 'workout') { const w = W(), d = $('#dur'); if (w && d && !w.completed) d.textContent = durText(w); }
    if (ui.view === 'mobPlay' && mob.end) tickMob();
  }, 500);

  /* ---------- Training: Logik ---------- */
  function newWorkout(plan, date, sport) {
    const w = {
      id: S.uid(), date: date, planId: plan ? plan.id : null, planName: plan ? plan.name : (sport && sport !== 'strength' && SPORTS[sport] ? SPORTS[sport].label : 'Freies Training'),
      startedAt: Date.now(), endedAt: null, completed: false, manual: date !== ymd(new Date()),
      exercises: plan && !isCardio(plan) ? plan.exercises.map(e => makeEx(e.name, e.sets)) : []
    };
    if (plan && isCardio(plan)) { w.sport = sportOf(plan); w.cardio = { durationMin: '', distance: '', notes: '' }; }
    else if (!plan && sport && sport !== 'strength' && SPORTS[sport]) { w.sport = sport; w.cardio = { durationMin: '', distance: '', notes: '' }; }
    return w;
  }
  function removeWorkout(id) {
    const s = S.get();
    s.workouts = s.workouts.filter(w => w.id !== id);
    if (s.activeId === id) s.activeId = null;
    S.save();
  }
  function startWorkout(plan, date, sport) {
    const s = S.get(), act = activeWorkout();
    if (act) {
      if (!confirm('Es läuft bereits ein Training („' + act.planName + '“). Soll es verworfen und ein neues gestartet werden?\n\nAbbrechen = zum laufenden Training')) {
        go('workout', { workoutId: act.id }); return;
      }
      removeWorkout(act.id);
    }
    const w = newWorkout(plan, date, sport);
    s.workouts.push(w); s.activeId = w.id; S.save();
    stopTimer();
    go('workout', { workoutId: w.id });
  }
  function fillSet(s) {
    if (s.kg === '' && s.sk != null) s.kg = s.sk;
    if (s.reps === '' && s.sr != null) s.reps = s.sr;
  }
  function finishWorkout() {
    const w = W();
    if (isCardio(w)) {
      const c = w.cardio || (w.cardio = { durationMin: '', distance: '', notes: '' });
      if (!(num(c.durationMin) > 0) && !w.manual && num(c.distance) > 0) {
        const el = Math.round((Date.now() - w.startedAt) / 60000);
        if (el >= 3) c.durationMin = el;
      }
      if (!(num(c.durationMin) > 0) && !(num(c.distance) > 0) && !confirm('Es wurden keine Werte eingetragen. Trotzdem abschließen?')) return;
    } else if (!wSets(w) && !confirm('Es wurde noch kein Satz abgehakt. Trotzdem abschließen?')) return;
    w.exercises.forEach(e => { e.sets = e.sets.filter(s => s.done || s.kg !== '' || s.reps !== ''); });
    w.completed = true; w.endedAt = Date.now();
    w.prs = computePRs(w);
    const s = S.get(); if (s.activeId === w.id) s.activeId = null;
    S.save(); stopTimer();
    const d = wDur(w);
    let h = '<div style="text-align:center"><div style="font-size:48px">🎉</div><h2>Training abgeschlossen!</h2><p class="muted">' + esc(w.planName) + ' wurde im Kalender abgehakt.</p></div>' +
      (isCardio(w) ? cardioStats(w, d) : '<div class="grid3"><div class="stat"><b>' + (d ? Math.max(1, Math.round(d / 60000)) : '–') + '</b><span>Minuten</span></div><div class="stat"><b>' + wSets(w) + '</b><span>Sätze</span></div><div class="stat"><b>' + fmtKg(Math.round(wVolume(w))) + '</b><span>kg Volumen</span></div></div>');
    if (w.prs.length) h += '<div class="card"><p class="label" style="color:#facc15">Neue Bestleistungen 🏆</p>' + w.prs.map(p => '<div class="pr-row"><span>' + esc(p.name) + '</span><b>' + fmtKg(p.kg) + ' kg × ' + p.reps + '</b></div>').join('') + '</div>';
    h += '<button class="btn primary block" data-a="summaryHome">Zur Startseite</button><button class="btn block" data-a="summaryCal">Im Kalender ansehen</button>';
    openSheet(h);
  }

  /* ---------- Aktionen (Klicks) ---------- */
  const A = {
    nav: el => go(el.dataset.v),
    closeSheet: () => closeSheet(),
    leave: () => go('home'),
    resume: () => { const a = activeWorkout(); if (a) go('workout', { workoutId: a.id }); },
    startPlan: el => { const p = planById(el.dataset.plan); if (p) startWorkout(p, el.dataset.date); },
    startFree: el => startWorkout(null, el.dataset.date, el.dataset.sport),
    pickPlan: el => pickPlanSheet(el.dataset.date),
    openWorkout: el => go('workout', { workoutId: el.dataset.id }),
    openDay: el => openDay(el.dataset.date),
    quickDone: el => {
      const p = planById(el.dataset.plan); if (!p) return;
      const w = newWorkout(p, el.dataset.date);
      w.exercises = p.exercises.map(e => ({ id: S.uid(), name: e.name, note: '', done: true, sets: [] }));
      w.quick = true; w.completed = true; w.endedAt = w.startedAt;
      S.get().workouts.push(w); S.save(); toast('Trainingstag abgehakt ✓'); openDay(el.dataset.date); render();
    },
    summaryHome: () => go('home'),
    summaryCal: () => go('calendar'),
    schedEdit: () => schedSheet(),

    /* Training */
    toggleSet: el => {
      unlockAudio();
      const w = W(), s = w.exercises[+el.dataset.e].sets[+el.dataset.s];
      if (!s.done) {
        fillSet(s);
        if (s.reps === '' || !(num(s.reps) > 0)) { toast('Bitte Wiederholungen eingeben'); return; }
        if (s.kg === '') s.kg = 0;
        s.done = true;
        if (!w.completed && S.get().settings.restTimer) startTimer(S.get().settings.restSeconds);
      } else s.done = false;
      S.save(); render();
    },
    addSet: el => {
      const e = W().exercises[+el.dataset.e], p = e.sets[e.sets.length - 1];
      e.sets.push({ kg: '', reps: '', done: false, sk: p ? (p.kg !== '' ? p.kg : p.sk) : null, sr: p ? (p.reps !== '' ? p.reps : p.sr) : null });
      S.save(); render();
    },
    delSet: el => { W().exercises[+el.dataset.e].sets.splice(+el.dataset.s, 1); S.save(); render(); },
    toggleEx: el => {
      const e = W().exercises[+el.dataset.e];
      if (!e.done) { e.sets.forEach(s => { if (!s.done) { fillSet(s); if (num(s.reps) > 0) { if (s.kg === '') s.kg = 0; s.done = true; } } }); e.done = true; }
      else e.done = false;
      S.save(); render();
    },
    noteToggle: el => { const w = W(), e = w.exercises[+el.dataset.e], k = w.id + ':' + e.id; ui.noteOpen[k] = !ui.noteOpen[k]; render(); },
    delEx: el => { const w = W(), e = w.exercises[+el.dataset.e]; if (confirm('Übung „' + e.name + '“ aus diesem Training entfernen?')) { w.exercises.splice(+el.dataset.e, 1); S.save(); render(); } },
    addExAsk: () => {
      openSheet(sheetHead('Übung hinzufügen') + '<input id="addExName" type="text" list="sugg" placeholder="Name der Übung" maxlength="60"><button class="btn primary block" data-a="addExOk">Hinzufügen</button>');
      setTimeout(() => { const i = $('#addExName'); if (i) i.focus(); }, 50);
    },
    addExOk: () => {
      const n = ($('#addExName').value || '').trim(); if (!n) return;
      const w = W(); w.exercises.push(makeEx(n, 3)); S.save(); closeSheet(true); render();
    },
    finish: () => finishWorkout(),
    doneEdit: () => { const w = W(); w.prs = computePRs(w); S.save(); go('home'); toast('Gespeichert ✓'); },
    discard: () => {
      const w = W();
      if (confirm(w.completed ? 'Dieses Training endgültig löschen?' : 'Dieses Training verwerfen? Alle Eingaben gehen verloren.')) { removeWorkout(w.id); stopTimer(); go('home'); }
    },
    timerManual: () => { unlockAudio(); if (timer.end) stopTimer(); else startTimer(S.get().settings.restSeconds); },
    tAdd: el => { if (timer.end) { timer.end += +el.dataset.v * 1000; timer.total = Math.max(1, timer.total + +el.dataset.v); tickTimer(); } },
    tStop: () => stopTimer(),

    /* Pläne */
    newPlan: () => newPlanSheet(),
    newPlanType: el => {
      const t = el.dataset.t, p = { id: S.uid(), name: t === 'strength' ? 'Neuer Plan' : SPORTS[t].label, type: t, exercises: [] };
      S.get().plans.push(p); S.save(); go('planEdit', { planId: p.id });
    },
    planType: el => {
      const p = planById(ui.planId), old = sportOf(p), t = el.dataset.t;
      p.type = t; if (p.name === SPORTS[old].label) p.name = SPORTS[t].label;
      S.save(); render();
    },
    editPlan: el => go('planEdit', { planId: el.dataset.id }),
    dupPlan: el => {
      const p = planById(el.dataset.id); if (!p) return;
      S.get().plans.push({ id: S.uid(), name: p.name + ' (Kopie)', type: p.type || 'strength', targetDist: p.targetDist || '', targetMin: p.targetMin || '', desc: p.desc || '', exercises: p.exercises.map(e => ({ id: S.uid(), name: e.name, sets: e.sets })) });
      S.save(); render(); toast('Plan kopiert');
    },
    delPlan: el => {
      const p = planById(el.dataset.id), s = S.get();
      if (!p || !confirm('Plan „' + p.name + '“ löschen? Bereits absolvierte Trainings bleiben erhalten.')) return;
      s.plans = s.plans.filter(x => x.id !== p.id);
      s.schedule = s.schedule.map(id => id === p.id ? null : id);
      Object.keys(s.overrides).forEach(k => { if (s.overrides[k] === p.id) delete s.overrides[k]; });
      S.save(); render();
    },
    togDay: el => { const s = S.get(), i = +el.dataset.d; s.schedule[i] = s.schedule[i] === ui.planId ? null : ui.planId; S.save(); render(); },
    moveEx: el => {
      const p = planById(ui.planId), i = +el.dataset.i, j = i + +el.dataset.dir;
      if (j < 0 || j >= p.exercises.length) return;
      const t = p.exercises[i]; p.exercises[i] = p.exercises[j]; p.exercises[j] = t; S.save(); render();
    },
    delPlanEx: el => { planById(ui.planId).exercises.splice(+el.dataset.i, 1); S.save(); render(); },
    addPlanEx: () => {
      const inp = $('#newEx'), n = (inp.value || '').trim(); if (!n) { inp.focus(); return; }
      planById(ui.planId).exercises.push({ id: S.uid(), name: n, sets: 3 }); S.save(); render();
      const i = $('#newEx'); if (i) i.focus();
    },

    /* Kalender */
    calMode: el => { ui.calMode = el.dataset.m; render(); },
    calPrev: () => { const c = ui.calCursor; ui.calCursor = ui.calMode === 'month' ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : addDays(c, -7); render(); },
    calNext: () => { const c = ui.calCursor; ui.calCursor = ui.calMode === 'month' ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : addDays(c, 7); render(); },
    calToday: () => { ui.calCursor = new Date(); render(); },
    histAll: () => { ui.histAll = true; render(); },

    /* Ausdauer */
    cardioTime: () => { const w = W(); if (!w.cardio) w.cardio = {}; w.cardio.durationMin = Math.max(1, Math.round((Date.now() - w.startedAt) / 60000)); S.save(); render(); },
    cardioSport: el => { ui.cardioSport = el.dataset.s; render(); },

    /* Körperdaten */
    bodyStep: el => {
      const i = $('#bKg'), l = lastWeight();
      let v = num(i.value) || (l ? num(l.kg) : 70);
      v = Math.round((v + (+el.dataset.v)) * 10) / 10;
      i.value = String(v).replace('.', ',');
    },
    bodySave: () => {
      const ds = ui.bodyDate || ymd(new Date()), v = num($('#bKg').value), n = ($('#bNote').value || '').trim();
      if (!(v >= 20 && v <= 400)) { toast('Bitte ein gültiges Gewicht eingeben'); return; }
      const b = S.get().body, i = b.findIndex(x => x.date === ds), e = { date: ds, kg: Math.round(v * 100) / 100, note: n };
      if (i >= 0) b[i] = e; else b.push(e);
      S.save(); toast('Gewicht gespeichert ✓'); render();
    },
    bodyDel: () => {
      const ds = ui.bodyDate || ymd(new Date()), s = S.get();
      if (!confirm('Eintrag vom ' + fmtLongY(ds) + ' löschen?')) return;
      s.body = s.body.filter(x => x.date !== ds); S.save(); toast('Eintrag gelöscht'); render();
    },
    bodyPick: el => { ui.bodyDate = el.dataset.date; render(); window.scrollTo(0, 0); },
    bodyRange: el => { ui.bodyRange = el.dataset.r; render(); },
    bodyAll: () => { ui.bodyAll = true; render(); },

    /* Beweglichkeit */
    mobCat: el => { ui.mobCat = el.dataset.c; render(); },
    openProg: el => go('mobProgram', { progId: el.dataset.id }),
    mobLog: () => {
      const p = progById(ui.progId);
      S.get().mobilityLog.push({ id: S.uid(), date: ymd(new Date()), progId: p.id, title: p.name, minutes: Mobi.progMinutes(p) });
      S.save(); toast('Als erledigt eingetragen ✓');
    },
    mobDelLog: el => { const s = S.get(); s.mobilityLog = s.mobilityLog.filter(m => m.id !== el.dataset.id); S.save(); render(); },
    mobStart: () => {
      unlockAudio(); ui.mobIdx = 0; ui.mobSide = 1; mobLoad(true);
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { mob.lock = l; }).catch(() => { }); } catch (e) { /* ignorieren */ }
      go('mobPlay');
    },
    mobToggle: () => {
      unlockAudio();
      if (mob.end) { mob.left = Math.max(0, (mob.end - Date.now()) / 1000); mob.end = 0; }
      else mob.end = Date.now() + mob.left * 1000;
      render();
    },
    mobNext: () => mobAdvance(1, !!mob.end),
    mobPrev: () => mobAdvance(-1, !!mob.end),
    mobExit: () => { if (confirm('Programm abbrechen? Es wird dann nicht eingetragen.')) { mob.end = 0; mobRelease(); go('mobProgram'); } },

    /* Einstellungen */
    export: () => {
      const blob = new Blob([S.exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'fitlog-sicherung-' + ymd(new Date()) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Sicherung heruntergeladen ✓'); render();
    },
    importPick: () => { const f = $('#impFile'); if (f) f.click(); },
    resetAll: () => {
      if (confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.') && confirm('Letzte Warnung: Alle Pläne und Trainings werden gelöscht. Fortfahren?')) {
        S.reset(); stopTimer(); go('home'); toast('Alle Daten gelöscht');
      }
    }
  };

  /* Eingaben (speichern sofort, ohne die Ansicht neu zu zeichnen) */
  const I = {
    kg: el => { const s = W().exercises[+el.dataset.e].sets[+el.dataset.s], v = el.value.trim().replace(',', '.'); s.kg = v === '' ? '' : (isFinite(+v) ? +v : s.kg); S.save(); },
    reps: el => { const s = W().exercises[+el.dataset.e].sets[+el.dataset.s], v = el.value.trim(); s.reps = v === '' ? '' : (isFinite(+v) ? Math.round(+v) : s.reps); S.save(); },
    note: el => { W().exercises[+el.dataset.e].note = el.value; S.save(); },
    planName: el => { planById(ui.planId).name = el.value; S.save(); },
    exName: el => { planById(ui.planId).exercises[+el.dataset.i].name = el.value; S.save(); },
    exSets: el => { const v = Math.max(1, Math.min(20, Math.round(+el.value || 0))); if (v) { planById(ui.planId).exercises[+el.dataset.i].sets = v; S.save(); } },
    setName: el => { S.get().settings.name = el.value; S.save(); },
    planDist: el => { planById(ui.planId).targetDist = el.value.trim(); S.save(); },
    planMin: el => { planById(ui.planId).targetMin = el.value.trim(); S.save(); },
    planDesc: el => { planById(ui.planId).desc = el.value; S.save(); },
    cDist: el => { const c = W().cardio, v = el.value.trim().replace(',', '.'); c.distance = v === '' ? '' : (isFinite(+v) ? +v : c.distance); S.save(); const t = $('#ccalc'); if (t) t.textContent = tempoText(W()); },
    cMin: el => { const c = W().cardio, v = el.value.trim().replace(',', '.'); c.durationMin = v === '' ? '' : (isFinite(+v) ? +v : c.durationMin); S.save(); const t = $('#ccalc'); if (t) t.textContent = tempoText(W()); },
    cNotes: el => { W().cardio.notes = el.value; S.save(); },
    goalKg: el => { const v = el.value.trim().replace(',', '.'); S.get().settings.goalKg = v === '' ? null : (isFinite(+v) ? +v : null); S.save(); }
  };

  /* Änderungen (Auswahlfelder) */
  const C = {
    sched: el => { S.get().schedule[+el.dataset.d] = el.value || null; S.save(); },
    dayplan: el => {
      const s = S.get(), ds = el.dataset.date;
      if (el.value === '') delete s.overrides[ds]; else s.overrides[ds] = el.value;
      S.save(); openDay(ds);
    },
    moveTo: el => {
      const s = S.get(), from = el.dataset.date, to = el.value, p = planForDate(from);
      if (!to || to === from || !p) return;
      s.overrides[from] = 'rest'; s.overrides[to] = p.id; S.save();
      toast('Training auf ' + fmtLong(to) + ' verschoben'); closeSheet(); 
    },
    progEx: el => { ui.progEx = el.value; render(); },
    bodyDate: el => { ui.bodyDate = el.value || null; render(); },
    setTimer: el => { S.get().settings.restTimer = el.checked; S.save(); },
    setRest: el => { S.get().settings.restSeconds = +el.value; S.save(); },
    import: el => {
      const f = el.files && el.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let data; try { data = JSON.parse(r.result); } catch (e) { data = null; }
        const d = data && (data.data || data);
        if (!d || !Array.isArray(d.plans) || !Array.isArray(d.workouts)) { alert('Die Datei ist keine gültige FitLog-Sicherung.'); return; }
        if (!confirm('Sicherung importieren? Dabei werden ALLE aktuellen Daten ersetzt (' + d.plans.length + ' Pläne, ' + d.workouts.length + ' Trainings in der Datei).')) return;
        const res = S.importJson(r.result);
        if (res.ok) { stopTimer(); go('home'); toast('Import erfolgreich ✓'); } else alert(res.error);
      };
      r.readAsText(f); el.value = '';
    }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest ? e.target.closest('[data-a]') : null;
    if (el && A[el.dataset.a]) A[el.dataset.a](el, e);
  });
  document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.in && I[el.dataset.in]) I[el.dataset.in](el); });
  document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.ch && C[el.dataset.ch]) C[el.dataset.ch](el); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'newEx') { e.preventDefault(); A.addPlanEx(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'addExName') { e.preventDefault(); A.addExOk(); }
  });

  /* ---------- Start ---------- */
  $('#sugg').innerHTML = SUGGEST.map(n => '<option value="' + esc(n) + '">').join('');
  history.replaceState({ view: 'home' }, '');
  render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignorieren */ }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }
})();
