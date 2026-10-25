[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Вкладка 1: план. Один сантиметр плана = одна единица поля; расстояние на местности
// получается умножением на знаменатель масштаба ----
new Point { name = "S"; pos = (-5, -1.5); text = true("S"); pauseOnDrag = false }
new Point { name = "T"; pos = (3.5, 2); text = true("T"); pauseOnDrag = false }
new Line { name = "st"; pos = (S, T); color = #f59e0b; thickness = 4 }
// Линейка плана: деления через 1 см
new Point { name = "R1"; pos = (-9, -5); dynamic = false; active = false }
new Point { name = "R2"; pos = (9, -5); dynamic = false; active = false }
new Line { name = "ruler"; pos = (R1, R2); interact = false; thickness = 2 }
draw Graph { name = "gTicks"; graph = "gt"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; edgeWidth = 1; layer = 5 }
draw Text { name = "lblD"; pos = ((S.pos.x + T.pos.x) / 2, (S.pos.y + T.pos.y) / 2 + 0.8); text = format(dPlan, 1) + " см" }
new Claster { name = "tabPlan"; elements = (S, T, st, R1, R2, ruler, gTicks, lblD); active = true }

// ---- Вкладка 2: подобие. Изображение A′B′C′ — треугольник ABC, уменьшенный в M раз
// (центр подобия O), углы и параллельность сохраняются ----
new Point { name = "O"; pos = (-8, -4.5); dynamic = false; collision = false; size = 0.6; text = true("O") }
new Point { name = "A"; pos = (-3, -2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -1.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false; text = true("A′"); layer = 30 }
new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false; text = true("B′"); layer = 30 }
new Point { name = "C2"; pos = (0, 0); dynamic = false; collision = false; text = true("C′"); layer = 30 }
new Line { name = "ab2"; pos = (A2, B2); color = #f59e0b; interact = false }
new Line { name = "bc2"; pos = (B2, C2); color = #f59e0b; interact = false }
new Line { name = "ca2"; pos = (C2, A2); color = #f59e0b; interact = false }
new Figure { name = "abc2"; elements = (ab2, bc2, ca2); interact = false }
// Лучи из центра подобия через вершины (пунктир)
new Line { name = "oa"; pos = (O, A); active = false; interact = false }
new Line { name = "ob"; pos = (O, B); active = false; interact = false }
new Line { name = "oc"; pos = (O, C); active = false; interact = false }
draw Punctir { name = "pOA"; edge = "oa"; layer = 1 }
draw Punctir { name = "pOB"; edge = "ob"; layer = 1 }
draw Punctir { name = "pOC"; edge = "oc"; layer = 1 }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
new Angle { name = "angA2"; lines = (ab2, ca2) }
new Angle { name = "angB2"; lines = (ab2, bc2) }
new Angle { name = "angC2"; lines = (bc2, ca2) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC"; count = 3 }
draw Angle { name = "arcA2"; angle = "angA2"; measure = false }
draw Angle { name = "arcB2"; angle = "angB2"; count = 2; measure = false }
draw Angle { name = "arcC2"; angle = "angC2"; count = 3; measure = false }
new Claster { name = "tabSim"; elements = (O, A, B, C, ab, bc, ca, abc, A2, B2, C2, ab2, bc2, ca2, abc2, pOA, pOB, pOC, arcA, arcB, arcC, arcA2, arcB2, arcC2); active = false }

// ---- Вкладка 3: площади — в квадрате со стороной в M раз большей умещается M² малых ----
new Point { name = "V0"; pos = (-5, -5); dynamic = false; collision = false; size = 0.4 }
new Point { name = "Q1"; pos = (-2, -2); dynamic = false; active = false }
new Point { name = "Q2"; pos = (5, 5); dynamic = false; active = false }
new Line { name = "qd"; pos = (Q1, Q2); active = false; interact = false }
new Point { name = "Q"; line = "qd"; t = 0.7; text = true("Q"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Qa"; pos = (0, -5); dynamic = false; collision = false; active = false }
new Point { name = "Qb"; pos = (-5, 0); dynamic = false; collision = false; active = false }
new Line { name = "sq1"; pos = (V0, Qa); interact = false }
new Line { name = "sq2"; pos = (Qa, Q); interact = false }
new Line { name = "sq3"; pos = (Q, Qb); interact = false }
new Line { name = "sq4"; pos = (Qb, V0); interact = false }
new Figure { name = "bigSq"; elements = (sq1, sq2, sq3, sq4); interact = false }
// Одна «клетка» — изображение квадрата в масштабе 1 : M
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ms1"; pos = (V0, Ma); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
new Line { name = "ms2"; pos = (Ma, Mb); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
new Line { name = "ms3"; pos = (Mb, Mc); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
new Line { name = "ms4"; pos = (Mc, V0); color = #f59e0b; thickness = 4; interact = false; layer = 12 }
draw Graph { name = "gCells"; graph = "gc"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 1; edgeColor = #6b728088; layer = 5 }
new Claster { name = "tabArea"; elements = (V0, Q, Qa, Qb, sq1, sq2, sq3, sq4, bigSq, Ma, Mb, Mc, ms1, ms2, ms3, ms4, gCells); active = false }

new UI { name = "btnPlan"; type = button; label = "Расстояние на плане"; action = "tab = 1; tabPlan.active = true; tabSim.active = false; tabArea.active = false" }
new UI { name = "btnSim"; type = button; label = "Форма сохраняется"; action = "tab = 2; tabPlan.active = false; tabSim.active = true; tabArea.active = false" }
new UI { name = "btnArea"; type = button; label = "Площади и объёмы"; action = "tab = 3; tabPlan.active = false; tabSim.active = false; tabArea.active = true" }

float tab = 1;
float Mp = 10000;
float Ms = 2;
string info = "";
float dPlan = 0;
float key = -1;
new UI { name = "selP"; type = select; label = "масштаб"; variable = Mp; options = (1000, 5000, 10000, 50000); labels = ("1 : 1000", "1 : 5000", "1 : 10 000", "1 : 50 000"); default = 10000; active = tab == 1 }
new UI { name = "selS"; type = select; label = "масштаб"; variable = Ms; options = (1, 2, 3, 4, 5); labels = ("1 : 1", "1 : 2", "1 : 3", "1 : 4", "1 : 5"); default = 2; active = tab >= 2 }

// Число с десятичной запятой; расстояние — в метрах или километрах
Function dist(m) {
  if (m >= 1000) { return format(m / 1000, 2) + " км"; }
  return format(m, 0) + " м";
}
Function sgn(v) { if (v < 0) { return -1; } return 1; }
// Положение (x, y) вершины допустимо: в поле, стороны не короче 1.2, а все три угла
// треугольника не меньше ~12° (синус ≥ 0.2) — вырождаться нельзя
Function okT(x, y, qx, qy, rx, ry) {
  if (abs(x) > fieldMaxX + 0.000001 || abs(y) > fieldMaxY + 0.000001) { return false; }
  float a = sqrt((qx - rx) * (qx - rx) + (qy - ry) * (qy - ry));
  float b = sqrt((x - rx) * (x - rx) + (y - ry) * (y - ry));
  float c = sqrt((x - qx) * (x - qx) + (y - qy) * (y - qy));
  if (a < 1.2 || b < 1.2 || c < 1.2) { return false; }
  float s2 = abs((qx - x) * (ry - y) - (qy - y) * (rx - x));
  return s2 / (b * c) >= 0.2 && s2 / (a * c) >= 0.2 && s2 / (a * b) >= 0.2;
}
Function reach(x0, y0, dx, dy, qx, qy, rx, ry) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okT(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, qx, qy, rx, ry)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okT(x0 + dx * mid, y0 + dy * mid, qx, qy, rx, ry)) { good = mid; } else { bad = mid; }
  }
  return good;
}
float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, qx, qy, rx, ry) {
  float t = reach(px, py, nx - px, ny - py, qx, qy, rx, ry);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rr = nx - cx; float ss = ny - cy;
  if (t < 1) {
    cx = cx + rr * reach(cx, cy, rr, 0, qx, qy, rx, ry);
    cy = cy + ss * reach(cx, cy, 0, ss, qx, qy, rx, ry);
  }
  sx = cx; sy = cy;
  return 0;
}

float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float M = round(Ms);

  // ---- подобие: перетаскивают A, B, C или весь треугольник ----
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (m < 0.000001) {
  } else if (shift < 0.000001) {
    // Фигура сдвинута целиком — форма не меняется, границу поля держит движок
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); A.pos.x = sx; A.pos.y = sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y); B.pos.x = sx; B.pos.y = sy;
  } else {
    slide(pcx, pcy, C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); C.pos.x = sx; C.pos.y = sy;
  }
  // Страховка: если кадр всё же дал вырожденный треугольник — вернуть прежние вершины
  if (!okT(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
  A2.pos.x = O.pos.x + (A.pos.x - O.pos.x) / M; A2.pos.y = O.pos.y + (A.pos.y - O.pos.y) / M;
  B2.pos.x = O.pos.x + (B.pos.x - O.pos.x) / M; B2.pos.y = O.pos.y + (B.pos.y - O.pos.y) / M;
  C2.pos.x = O.pos.x + (C.pos.x - O.pos.x) / M; C2.pos.y = O.pos.y + (C.pos.y - O.pos.y) / M;

  // ---- план: расстояние на плане и на местности ----
  dPlan = sqrt((T.pos.x - S.pos.x) * (T.pos.x - S.pos.x) + (T.pos.y - S.pos.y) * (T.pos.y - S.pos.y));

  // ---- площади: сторона s, малый квадрат со стороной s / M ----
  float s = Q.pos.x - V0.pos.x;
  Qa.pos.x = Q.pos.x; Qa.pos.y = V0.pos.y;
  Qb.pos.x = V0.pos.x; Qb.pos.y = Q.pos.y;
  float u = s / M;
  Ma.pos.x = V0.pos.x + u; Ma.pos.y = V0.pos.y;
  Mb.pos.x = V0.pos.x + u; Mb.pos.y = V0.pos.y + u;
  Mc.pos.x = V0.pos.x; Mc.pos.y = V0.pos.y + u;

  float k2 = tab * 1000000 + M * 100000 + round(s * 20) * 100 + round(Mp / 1000);
  if (k2 != key) {
    key = k2;
    gt = newGraph(); gc = newGraph();
    // деления линейки через 1 см, подписи через 2
    repeat (19) {
      float x = -9 + i;
      addNode(gt, "a" + format(i, 0), [x, -5], "");
      addNode(gt, "b" + format(i, 0), [x, -4.7], "");
      addEdge(gt, "a" + format(i, 0), "b" + format(i, 0), 1);
      if (i % 2 == 0) { addNode(gt, "c" + format(i, 0), [x, -5.55], format(i, 0)); }
    }
    // сетка M × M внутри большого квадрата
    repeat (4) {
      if (i + 1 < M) {
        float p = (i + 1) * u;
        addNode(gc, "h0" + format(i, 0), [V0.pos.x, V0.pos.y + p]); addNode(gc, "h1" + format(i, 0), [V0.pos.x + s, V0.pos.y + p]);
        addEdge(gc, "h0" + format(i, 0), "h1" + format(i, 0), 1);
        addNode(gc, "v0" + format(i, 0), [V0.pos.x + p, V0.pos.y]); addNode(gc, "v1" + format(i, 0), [V0.pos.x + p, V0.pos.y + s]);
        addEdge(gc, "v0" + format(i, 0), "v1" + format(i, 0), 1);
      }
    }
  }

  if (tab == 1) {
    float real = dPlan * Mp / 100;
    info = "**Масштаб** — отношение размеров изображения к размерам оригинала в виде \\(1 : " + format(Mp, 0) + "\\): один сантиметр плана соответствует \\(" + format(Mp, 0) + "\\) см на местности, то есть " + dist(Mp / 100) + ".\n\nРасстояние на плане \\(" + format(dPlan, 1) + "\\) см (линейка внизу — деления по 1 см) на местности равно \\(" + format(dPlan, 1) + " \\cdot " + format(Mp, 0) + " = " + format(dPlan * Mp, 0) + "\\) см, то есть **" + dist(real) + "**. Обратный переход — делением: \\(l_{\\text{план}} = l_{\\text{реал}} / " + format(Mp, 0) + "\\).";
  } else if (tab == 2) {
    float lab = sqrt((B.pos.x - A.pos.x) * (B.pos.x - A.pos.x) + (B.pos.y - A.pos.y) * (B.pos.y - A.pos.y));
    float lbc = sqrt((C.pos.x - B.pos.x) * (C.pos.x - B.pos.x) + (C.pos.y - B.pos.y) * (C.pos.y - B.pos.y));
    float lca = sqrt((A.pos.x - C.pos.x) * (A.pos.x - C.pos.x) + (A.pos.y - C.pos.y) * (A.pos.y - C.pos.y));
    info = "**Масштаб 1 : " + format(M, 0) + "** уменьшает все длины в " + format(M, 0) + " раз: \\(AB = " + format(lab, 2) + "\\), \\(A'B' = " + format(lab / M, 2) + "\\); \\(BC = " + format(lbc, 2) + "\\), \\(B'C' = " + format(lbc / M, 2) + "\\); \\(CA = " + format(lca, 2) + "\\), \\(C'A' = " + format(lca / M, 2) + "\\).\n\nОтношение длин \\(\\dfrac{A'B'}{AB} = \\dfrac{B'C'}{BC} = \\dfrac{C'A'}{CA} = \\dfrac{1}{" + format(M, 0) + "}\\) — это коэффициент подобия. **Углы не меняются**, параллельные прямые остаются параллельными: масштабирование — гомотетия с центром O.";
  } else {
    info = "**Площади и объёмы.** При масштабе \\(1 : " + format(M, 0) + "\\) сторона малого квадрата (оранжевого) — \\(" + format(u, 2) + "\\) при стороне большого \\(" + format(s, 2) + "\\). Площади относятся как \\(" + format(u * u, 2) + " : " + format(s * s, 2) + " = 1 : " + format(M * M, 0) + "\\) — квадрат масштаба: в большом квадрате умещается \\(" + format(M, 0) + "^{2} = " + format(M * M, 0) + "\\) малых.\n\nОбъёмы подобных тел различаются в \\(" + format(M, 0) + "^{3} = " + format(M * M * M, 0) + "\\) раз.";
  }
}
]
