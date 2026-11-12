'use strict';
/*
 * FitLog – Beweglichkeit (Dehnen / Mobility / Haltung)
 * ----------------------------------------------------
 * Enthält die Übungen, die Programme und einen kleinen Zeichner für Strichfiguren (SVG).
 * Jede Pose wird über Koordinaten beschrieben (x nach rechts, y nach oben, Boden = 0).
 * Arme und Beine werden automatisch so berechnet, dass Hände und Füße an den angegebenen Punkten liegen.
 */
const Mobi = (function () {
  const L = { thigh: 26, shin: 25, up: 20, fore: 21, head: 13 };
  const rad = d => d * Math.PI / 180;
  const fx = n => Math.round(n * 10) / 10;

  /* Zwei-Segment-Berechnung (Knie bzw. Ellbogen). s = +1 / -1 wählt die Beugerichtung. */
  function ik(P, T, l1, l2, s) {
    const dx = T[0] - P[0], dy = T[1] - P[1], d = Math.hypot(dx, dy) || 0.001;
    const dd = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.05), l1 + l2 - 0.05);
    const ux = dx / d, uy = dy / d;
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return {
      mid: [P[0] + ux * a - uy * h * s, P[1] + uy * a + ux * h * s],
      end: [P[0] + ux * dd, P[1] + uy * dd]
    };
  }

  function build(p) {
    const front = p.view === 'front';
    const H = p.H, N = p.N;
    const dl = Math.hypot(N[0] - H[0], N[1] - H[1]) || 1;
    const d = [(N[0] - H[0]) / dl, (N[1] - H[1]) / dl];
    const pr = [d[1], -d[0]];
    const ha = rad(p.head == null ? 90 : p.head);
    const head = [N[0] + Math.cos(ha) * L.head, N[1] + Math.sin(ha) * L.head];
    const sh = front ? [[N[0] - pr[0] * 9, N[1] - pr[1] * 9], [N[0] + pr[0] * 9, N[1] + pr[1] * 9]] : [N, N];
    const hp = front ? [[H[0] - 5, H[1]], [H[0] + 5, H[1]]] : [H, H];
    const limbs = [];
    [0, 1].forEach(i => {
      const a = p['a' + (i + 1)] || { t: [sh[i][0] + (front ? (i ? 3 : -3) : (i ? 3 : 1)), sh[i][1] - 38], s: front ? (i ? 1 : -1) : -1 };
      const r = a.k ? { mid: a.k, end: a.t } : ik(sh[i], a.t, L.up, L.fore, a.s);
      limbs.push({ k: 'a' + (i + 1), far: !front && i === 1, arm: true, pts: [sh[i], r.mid, r.end] });
    });
    [0, 1].forEach(i => {
      const l = p['l' + (i + 1)] || { t: [hp[i][0] + (front ? (i ? 4 : -4) : (i ? -2 : 2)), 3], s: 1 };
      const r = l.k ? { mid: l.k, end: l.t } : ik(hp[i], l.t, L.thigh, L.shin, l.s);
      const pts = [hp[i], r.mid, r.end];
      if (!front) { const fa = rad(l.f == null ? -8 : l.f); pts.push([r.end[0] + Math.cos(fa) * 10, r.end[1] + Math.sin(fa) * 10]); }
      else pts.push([r.end[0] + (i ? 5 : -5), r.end[1] - 1.5]);
      limbs.push({ k: 'l' + (i + 1), far: !front && i === 1, arm: false, pts: pts });
    });
    return { front: front, H: H, N: N, head: head, sh: sh, hp: hp, limbs: limbs, bend: p.bend || 0, hl: p.hl || [], lines: p.lines || [], arrows: p.arrows || [], box: p.box || null };
  }

  function bounds(b) {
    if (b.box) return b.box;
    const pts = [b.H, b.N, [b.head[0] - 8, b.head[1] + 8], [b.head[0] + 8, b.head[1] - 8]];
    b.limbs.forEach(m => m.pts.forEach(q => pts.push(q)));
    b.lines.forEach(l => { pts.push([l[0], l[1]], [l[2], l[3]]); });
    b.arrows.forEach(l => { pts.push([l[0], l[1]], [l[2], l[3]]); });
    pts.push([0, 0]);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    return [x0, y0, x1, y1];
  }

  function inner(b, fl) {
    const Q = q => fx(q[0]) + ',' + fx(-q[1]);
    const hl = k => b.hl.indexOf(k) >= 0;
    let s = '<path d="M' + fx(fl[0]) + ',0L' + fx(fl[1]) + ',0" class="fl"/>';
    b.lines.forEach(l => { s += '<path d="M' + Q([l[0], l[1]]) + 'L' + Q([l[2], l[3]]) + '" class="ex"/>'; });
    const limb = m => (m.far ? '' : '<path d="M' + m.pts.map(Q).join('L') + '" class="bo"/>') + '<path d="M' + m.pts.map(Q).join('L') + '" class="bn' + (m.far ? ' far' : '') + (hl(m.k) ? ' hl' : '') + '"/>';
    const torso = () => {
      if (b.front) {
        return '<path d="M' + [b.sh[0], b.sh[1], b.hp[1], b.hp[0]].map(Q).join('L') + 'Z" class="fill' + (hl('torso') ? ' hl' : '') + '"/>';
      }
      const mx = (b.H[0] + b.N[0]) / 2, my = (b.H[1] + b.N[1]) / 2;
      const dx = b.N[0] - b.H[0], dy = b.N[1] - b.H[1], dl = Math.hypot(dx, dy) || 1;
      const cx = mx + (-dy / dl) * b.bend * 2, cy = my + (dx / dl) * b.bend * 2;
      return '<path d="M' + Q(b.H) + 'Q' + Q([cx, cy]) + ' ' + Q(b.N) + '" class="bn t' + (hl('torso') ? ' hl' : '') + '"/>';
    };
    const headSvg = '<path d="M' + Q(b.N) + 'L' + Q(b.head) + '" class="bn nk"/><circle cx="' + fx(b.head[0]) + '" cy="' + fx(-b.head[1]) + '" r="7.5" class="hd' + (hl('head') ? ' hl' : '') + '"/>';
    if (b.front) {
      b.limbs.filter(m => !m.arm).forEach(m => { s += limb(m); });
      s += torso() + headSvg;
      b.limbs.filter(m => m.arm).forEach(m => { s += limb(m); });
    } else {
      b.limbs.filter(m => m.far).forEach(m => { s += limb(m); });
      s += torso() + headSvg;
      b.limbs.filter(m => !m.far).forEach(m => { s += limb(m); });
    }
    b.arrows.forEach(a => { s += '<path d="M' + Q([a[0], a[1]]) + 'L' + Q([a[2], a[3]]) + '" class="arr" marker-end="url(#fa)"/>'; });
    return s;
  }

  /* ---------- Posen ---------- */
  const catPose = (bend, head) => ({
    H: [0, 29], N: [34.5, 38.5], head: head, bend: bend, hl: ['torso'],
    a1: { t: [35, 1], s: -1 }, a2: { t: [32, 1], s: -1 },
    l1: { t: [-25, 3], s: 1, f: 180 }, l2: { t: [-22, 3], s: 1, f: 180 }
  });
  const standing = (extra) => Object.assign({ H: [0, 54], N: [0, 90], head: 90 }, extra);
  const wallAngel = up => ({
    box: [-50, 40, 42, 140],
    H: [-2, 54], N: [-2, 90], head: 90, lines: [[-10, 0, -10, 140]],
    a1: { t: up ? [-4, 129] : [-5, 91], s: 1 }, a2: { t: up ? [-3, 128] : [-5, 89], s: 1 },
    l1: { t: [6, 3], s: 1 }, l2: { t: [4, 3], s: 1 },
    hl: ['a1', 'a2']
  });
  const chinPose = (head, arrows, box) => standing({ head: head, hl: ['head'], arrows: arrows || [], box: box });

  const POSE = {
    cat: catPose(10, -50),
    cow: catPose(-10, 30),
    child: {
      H: [5, 12], N: [38, 14], head: 12, hl: ['torso'],
      a1: { t: [76, 2], s: 1 }, a2: { t: [74, 2], s: 1 },
      l1: { t: [5, 3], s: 1, f: 180 }, l2: { t: [3, 3], s: 1, f: 180 }
    },
    bridge: {
      H: [5, 15], N: [-30, 4], head: 165, hl: ['l1', 'l2'],
      a1: { t: [2, 2], s: 1 }, a2: { t: [0, 2], s: 1 },
      l1: { t: [36, 3], s: 1, f: -5 }, l2: { t: [34, 3], s: 1, f: -5 }
    },
    kneeChest: {
      H: [2, 8], N: [-34, 8], head: 180, hl: ['l1'],
      a1: { t: [-3, 25], s: 1 }, a2: { t: [-5, 23], s: 1 },
      l1: { t: [10, 15.5], s: 1, f: -20 }, l2: { t: [52, 4], s: 1, f: 80 }
    },
    seatedFold: {
      H: [0, 5], N: [27, 29.5], head: 10, hl: ['l1', 'l2'],
      a1: { t: [56, 9], s: 1 }, a2: { t: [54, 8], s: 1 },
      l1: { t: [51, 4], s: 1, f: 75 }, l2: { t: [49, 4], s: 1, f: 75 }
    },
    calfWall: {
      H: [0, 44], N: [12, 78], head: 60, hl: ['l1'], lines: [[50, 0, 50, 112]],
      a1: { t: [48, 76], s: -1 }, a2: { t: [48, 72], s: -1 },
      l1: { t: [-27, 3], s: 1, f: -5 }, l2: { t: [20, 3], s: 1, f: -5 }
    },
    quad: standing({
      hl: ['l1'], N: [-6, 88], head: 95,
      a1: { t: [-16, 47], s: -1 }, a2: { t: [2, 52], s: -1 },
      l1: { k: [1, 28], t: [-16, 47], f: 160 }, l2: { t: [0, 3], s: 1 }
    }),
    hipFlexor: {
      H: [-3, 28], N: [-3, 64], head: 90, hl: ['l1'],
      a1: { t: [20, 98], s: 1 }, a2: { t: [18, 96], s: 1 },
      l1: { t: [-39, 3], s: 1, f: 180 }, l2: { t: [24, 3], s: 1, f: -5 }
    },
    doorChest: {
      view: 'front', H: [0, 54], N: [0, 90], head: 90, hl: ['torso'],
      lines: [[-33, 0, -33, 128], [33, 0, 33, 128]],
      a1: { t: [-29, 109], s: 1 }, a2: { t: [29, 109], s: -1 },
      l1: { t: [-9, 3], s: 1 }, l2: { t: [9, 3], s: 1 }
    },
    crossBody: {
      view: 'front', H: [0, 54], N: [0, 90], head: 90, hl: ['a2'],
      a1: { t: [-18, 89], s: 1 }, a2: { t: [-30, 91], s: 1 },
      l1: { t: [-9, 3], s: 1 }, l2: { t: [9, 3], s: 1 }
    },
    neckTilt: {
      view: 'front', H: [0, 54], N: [0, 90], head: 70, hl: ['head'],
      a1: { t: [9, 109], s: 1 }, a2: { t: [12, 51], s: 1 },
      l1: { t: [-9, 3], s: 1 }, l2: { t: [9, 3], s: 1 }
    },
    chinForward: chinPose(45, [], [-34, 8, 44, 122]),
    chinBack: chinPose(92, [[18, 106, 5, 106]], [-34, 8, 44, 122]),
    wallDown: wallAngel(false),
    wallUp: wallAngel(true),
    sideBend: {
      view: 'front', H: [0, 54], N: [-14, 87], head: 113, hl: ['torso'],
      a1: { t: [-37, 118], s: 1 }, a2: { t: [-20.5, 125], s: -1 },
      l1: { t: [-9, 3], s: 1 }, l2: { t: [9, 3], s: 1 }
    },
    cobra: {
      H: [0, 8], N: [33, 25], head: 55, hl: ['torso'],
      a1: { t: [54, 3], s: -1 }, a2: { t: [52, 3], s: -1 },
      l1: { t: [-53, 5], s: -1, f: 190 }, l2: { t: [-53, 4], s: -1, f: 190 }
    },
    deepSquat: {
      H: [-8, 22], N: [-4, 57], head: 80, hl: ['l1', 'l2'],
      a1: { t: [12, 52], s: -1 }, a2: { t: [11, 50], s: -1 },
      l1: { t: [0, 3], s: 1, f: -5 }, l2: { t: [2, 3], s: 1, f: -5 }
    },
    fold: {
      H: [0, 54], N: [22, 25], head: -80, hl: ['l1', 'l2'],
      a1: { t: [27, 5], s: 1 }, a2: { t: [25, 5], s: 1 },
      l1: { t: [0, 3], s: 1, f: -5 }, l2: { t: [1, 3], s: 1, f: -5 }
    },
    sideLunge: {
      view: 'front', H: [-8, 38], N: [-8, 74], head: 90, hl: ['l2'],
      a1: { t: [-15, 42], s: -1 }, a2: { t: [-1, 42], s: 1 },
      l1: { t: [-34, 3], s: -1 }, l2: { t: [34, 3], s: 1 }
    }
  };

  /* ---------- Übungen ---------- */
  const EX = {
    katzekuh: {
      name: 'Katze-Kuh', dose: '10 langsame Wiederholungen', sec: 45, area: 'Rücken, Wirbelsäule',
      text: 'Vierfüßlerstand: Hände unter den Schultern, Knie unter den Hüften. Beim Ausatmen den Rücken rund machen und das Kinn zur Brust nehmen (Katze). Beim Einatmen den Bauch sinken lassen und den Blick nach vorn heben (Kuh). Langsam und fließend bewegen.',
      poses: ['cat', 'cow'], caps: ['Katze: Rücken rund', 'Kuh: Rücken hohl']
    },
    kind: {
      name: 'Kindshaltung', dose: '45 Sek. halten', sec: 45, area: 'Unterer Rücken, Hüfte, Schultern',
      text: 'Aus dem Fersensitz die Arme weit nach vorn auf den Boden schieben und die Stirn ablegen. Das Gesäß bleibt auf den Fersen. Ruhig in den unteren Rücken und in die Seiten atmen.',
      poses: ['child'], caps: ['']
    },
    bruecke: {
      name: 'Beckenheben (Brücke)', dose: '12 Wdh., oben 3 Sek. halten', sec: 45, area: 'Gesäß, Hüftstrecker',
      text: 'Auf den Rücken legen, Füße hüftbreit aufstellen. Gesäß anspannen und das Becken anheben, bis Schultern, Hüfte und Knie eine Linie bilden. Oben kurz halten, dann langsam absenken.',
      poses: ['bridge'], caps: ['']
    },
    kniebrust: {
      name: 'Knie zur Brust', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Unterer Rücken, Gesäß',
      text: 'Auf den Rücken legen. Ein Knie mit beiden Händen sanft zur Brust ziehen, das andere Bein bleibt lang am Boden. Den unteren Rücken locker am Boden lassen und ruhig atmen.',
      poses: ['kneeChest'], caps: ['']
    },
    vorbeuge: {
      name: 'Sitzende Vorbeuge', dose: '40 Sek. halten', sec: 40, area: 'Oberschenkel-Rückseite',
      text: 'Aufrecht mit gestreckten Beinen sitzen. Mit geradem Rücken aus der Hüfte nach vorn kippen und die Hände Richtung Füße schieben. Die Knie dürfen leicht gebeugt sein. Nicht ruckartig federn.',
      poses: ['seatedFold'], caps: ['']
    },
    wade: {
      name: 'Wadendehnung an der Wand', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Waden, Achillessehne',
      text: 'Mit den Händen an der Wand abstützen und ein Bein weit nach hinten stellen. Die Ferse bleibt am Boden, das hintere Knie gestreckt. Die Hüfte leicht nach vorn schieben, bis die Wade zieht.',
      poses: ['calfWall'], caps: ['']
    },
    quad: {
      name: 'Oberschenkel-Vorderseite', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Oberschenkel-Vorderseite',
      text: 'Auf einem Bein stehen, das andere Bein nach hinten anwinkeln und den Fuß mit der Hand zum Gesäß ziehen. Die Knie bleiben nebeneinander, die Hüfte schiebt leicht nach vorn. Zur Stabilität an einer Wand abstützen.',
      poses: ['quad'], caps: ['']
    },
    hueftbeuger: {
      name: 'Hüftbeuger-Dehnung', dose: '40 Sek. je Seite', sec: 40, perSide: true, area: 'Hüftbeuger, Oberschenkel-Vorderseite',
      text: 'Ein Knie auf den Boden (Polster unterlegen), das andere Bein vorn im 90-Grad-Winkel. Gesäß anspannen, Becken nach vorn schieben und den Oberkörper aufrecht halten. Arme nach oben strecken für mehr Dehnung.',
      poses: ['hipFlexor'], caps: ['']
    },
    tuerrahmen: {
      name: 'Brustdehnung im Türrahmen', dose: '40 Sek. halten', sec: 40, area: 'Brust, vordere Schulter',
      text: 'In den Türrahmen stellen und die Unterarme links und rechts am Rahmen auflegen, Ellbogen etwa auf Schulterhöhe. Einen kleinen Schritt nach vorn gehen, bis es vorn in der Brust zieht. Rippen unten lassen, nicht ins Hohlkreuz fallen.',
      poses: ['doorChest'], caps: ['']
    },
    schulter: {
      name: 'Schulterdehnung (Arm quer)', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Hintere Schulter',
      text: 'Einen Arm gestreckt vor der Brust zur Gegenseite führen. Mit der anderen Hand am Oberarm leicht heranziehen. Die Schulter bleibt unten und entspannt.',
      poses: ['crossBody'], caps: ['']
    },
    nacken: {
      name: 'Seitliches Nackenneigen', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Nacken, Trapezmuskel',
      text: 'Aufrecht stehen oder sitzen und das Ohr zur Schulter neigen. Optional die Hand sanft auf den Kopf legen. Die andere Schulter aktiv nach unten schieben. Nie mit Gewalt ziehen.',
      poses: ['neckTilt'], caps: ['']
    },
    kinn: {
      name: 'Kinn-Einzug', dose: '10 Wdh., je 5 Sek. halten', sec: 60, area: 'Nacken, Kopfhaltung',
      text: 'Aufrecht stehen, Blick geradeaus. Das Kinn waagerecht nach hinten schieben, als wolltest du ein Doppelkinn machen, der Hinterkopf wächst nach oben. 5 Sekunden halten, dann lösen.',
      poses: ['chinForward', 'chinBack'], caps: ['Start: Kopf vorgeschoben', 'Ende: Kopf über den Schultern']
    },
    wallangel: {
      name: 'Wall Angels', dose: '10 langsame Wiederholungen', sec: 50, area: 'Schulterblätter, obere Brustwirbelsäule',
      text: 'Mit dem Rücken an die Wand lehnen, Füße etwas vor der Wand. Die Arme in U-Form an die Wand legen und langsam nach oben schieben, ohne dass Rippen, Kopf oder Hände die Wand verlassen. Langsam wieder absenken.',
      poses: ['wallDown', 'wallUp'], caps: ['Start: Arme unten', 'Ende: Arme oben']
    },
    seitbeuge: {
      name: 'Seitbeuge im Stand', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Flanke, Rumpf',
      text: 'Hüftbreit stehen und beide Arme nach oben strecken. Den Oberkörper langsam zur Seite neigen, ohne nach vorn zu kippen. Tief in die gedehnte Flanke atmen, dann die Seite wechseln.',
      poses: ['sideBend'], caps: ['']
    },
    cobra: {
      name: 'Sphinx / Cobra', dose: '30 Sek. halten', sec: 30, area: 'Brustwirbelsäule, Bauch',
      text: 'Auf den Bauch legen, die Unterarme unter die Schultern. Das Brustbein nach vorn und oben schieben, Schultern weg von den Ohren. Das Becken bleibt am Boden. Nicht ins Hohlkreuz pressen.',
      poses: ['cobra'], caps: ['']
    },
    hocke: {
      name: 'Tiefe Hocke', dose: '45 Sek. halten', sec: 45, area: 'Hüfte, Sprunggelenke, Rücken',
      text: 'Füße etwa schulterbreit, Zehen leicht nach außen. So tief hocken, wie es geht, die Fersen bleiben am Boden. Die Hände vor der Brust zusammenlegen und mit den Ellbogen die Knie sanft nach außen drücken.',
      poses: ['deepSquat'], caps: ['']
    },
    rumpfbeuge: {
      name: 'Vorbeuge im Stand', dose: '40 Sek. hängen lassen', sec: 40, area: 'Rücken, Oberschenkel-Rückseite',
      text: 'Hüftbreit stehen, Knie weich. Den Oberkörper aus der Hüfte nach vorn hängen lassen, Kopf und Arme entspannt. Mit jedem Ausatmen etwas tiefer sinken lassen.',
      poses: ['fold'], caps: ['']
    },
    adduktoren: {
      name: 'Seitlicher Ausfallschritt', dose: '30 Sek. je Seite', sec: 30, perSide: true, area: 'Innenseite der Oberschenkel',
      text: 'Weit ausgestellter Stand. Das Gewicht auf ein Bein verlagern und das Knie beugen, das andere Bein bleibt gestreckt, Fuß flach am Boden. Oberkörper aufrecht. Die Dehnung spürst du innen am gestreckten Bein.',
      poses: ['sideLunge'], caps: ['']
    }
  };

  const PROGRAMS = [
    { id: 'morgen', name: 'Morgenroutine', cat: 'Mobility', desc: 'Wach werden und Gelenke geschmeidig machen.', ex: ['katzekuh', 'hocke', 'hueftbeuger', 'rumpfbeuge', 'seitbeuge', 'cobra'] },
    { id: 'haltung', name: 'Haltung & Schreibtisch', cat: 'Haltung', desc: 'Nacken, Brust und Schulterblätter gegen Rundrücken und Verspannungen.', ex: ['kinn', 'nacken', 'tuerrahmen', 'wallangel', 'cobra', 'katzekuh'] },
    { id: 'laufen', name: 'Nach dem Laufen', cat: 'Dehnen', desc: 'Beine und Hüfte nach dem Lauf lockern.', ex: ['wade', 'quad', 'hueftbeuger', 'vorbeuge', 'adduktoren', 'kniebrust'] },
    { id: 'rad', name: 'Nach dem Radfahren', cat: 'Dehnen', desc: 'Hüftbeuger, Oberschenkel und Rücken entlasten.', ex: ['hueftbeuger', 'quad', 'kniebrust', 'cobra', 'kind', 'nacken'] },
    { id: 'kraft', name: 'Nach dem Krafttraining', cat: 'Dehnen', desc: 'Oberkörper dehnen und Schultern entspannen.', ex: ['tuerrahmen', 'schulter', 'nacken', 'kind', 'seitbeuge'] },
    { id: 'abend', name: 'Rücken & Hüfte am Abend', cat: 'Mobility', desc: 'Sanft zur Ruhe kommen und den Rücken lösen.', ex: ['kind', 'katzekuh', 'kniebrust', 'bruecke', 'cobra', 'rumpfbeuge'] }
  ];

  const progById = id => PROGRAMS.find(p => p.id === id) || null;
  const progSeconds = p => p.ex.reduce((a, id) => a + EX[id].sec * (EX[id].perSide ? 2 : 1), 0);
  const progMinutes = p => Math.max(1, Math.round(progSeconds(p) / 60));

  /* Bild(er) einer Übung als HTML */
  function figures(id) {
    const e = EX[id];
    const bs = e.poses.map(k => build(POSE[k]));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    bs.forEach(b => { const q = bounds(b); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[2]); y1 = Math.max(y1, q[3]); });
    x0 -= 12; x1 += 12; y0 -= 4; y1 += 12;
    const w = x1 - x0, h = y1 - y0;
    const ratio = Math.min(1.6, Math.max(1, w / h));
    let vw = w, vh = h;
    if (w / h < ratio) vw = h * ratio; else vh = w / ratio;
    const cx = (x0 + x1) / 2, cy = -(y0 + y1) / 2;
    const vb = fx(cx - vw / 2) + ' ' + fx(cy - vh / 2) + ' ' + fx(vw) + ' ' + fx(vh);
    const fl = [cx - vw / 2 - 1, cx + vw / 2 + 1];
    const defs = '<defs><marker id="fa" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L8,4L0,8z" style="fill:var(--ac)"/></marker></defs>';
    let out = '<div class="figs n' + bs.length + '">';
    bs.forEach((b, i) => {
      out += '<figure><svg class="fig" viewBox="' + vb + '" role="img" aria-label="' + e.name + (e.caps[i] ? ' – ' + e.caps[i] : '') + '">' + defs + inner(b, fl) + '</svg>' +
        (e.caps[i] ? '<figcaption>' + e.caps[i] + '</figcaption>' : '') + '</figure>';
    });
    return out + '</div>';
  }

  return { EX: EX, PROGRAMS: PROGRAMS, progById: progById, progMinutes: progMinutes, progSeconds: progSeconds, figures: figures };
})();
