[
description = "{info}"

field width = 20;
field height = 13;
camera type = fixed;

// ---- Произвольный треугольник ABC (три вершины свободны, ограничение только "не вырождаться
// и не покидать поле" — общее для любой перетаскиваемой точки). Вкладки показывают базовые
// свойства: сумму углов и внешний угол; пересечение медиан/биссектрис/высот/серед. перпендикуляров
// в одной точке; неравенство Эйлера R ≥ 2r. ----
new Point { name = "A"; pos = (-7, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (7, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Вкладка 1: сумма углов и внешний угол ----
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
new Line { name = "extAB"; pos = (A, B); active = false; interact = false }
draw Punctir { name = "extLine"; edge = "extAB" }
new Claster { name = "tabSum"; elements = (arcA, arcB, arcC); active = true }

// ---- Вкладка 2: медианы и центроид ----
new Point { name = "Ma"; construct = median; vertex = B; base = "bc"; dynamic = false; collision = false }
new Point { name = "Mb"; construct = median; vertex = A; base = "ca"; dynamic = false; collision = false }
new Point { name = "Mc"; construct = median; vertex = A; base = "ab"; dynamic = false; collision = false }
new Line { name = "medA"; pos = (A, Ma); interact = false }
new Line { name = "medB"; pos = (B, Mb); interact = false }
new Line { name = "medC"; pos = (C, Mc); interact = false }
new Point { name = "G"; pos = (0, 0); text = true("G"); dynamic = false; collision = false }
new Claster { name = "tabMedian"; elements = (Ma, Mb, Mc, medA, medB, medC, G); active = false }

// ---- Вкладка 3: биссектрисы и инцентр ----
new Point { name = "Ba"; construct = bisector; vertex = A; base = "bc"; dynamic = false; collision = false }
new Point { name = "Bb"; construct = bisector; vertex = B; base = "ca"; dynamic = false; collision = false }
new Point { name = "Bc"; construct = bisector; vertex = C; base = "ab"; dynamic = false; collision = false }
new Line { name = "bisA"; pos = (A, Ba); interact = false }
new Line { name = "bisB"; pos = (B, Bb); interact = false }
new Line { name = "bisC"; pos = (C, Bc); interact = false }
new Point { name = "I"; pos = (0, 0); text = true("I"); dynamic = false; collision = false }
new Claster { name = "tabBisector"; elements = (Ba, Bb, Bc, bisA, bisB, bisC, I); active = false }

// ---- Вкладка 4: высоты, ортоцентр, серединные перпендикуляры, циркумцентр, прямая Эйлера ----
new Point { name = "Ha"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false }
new Point { name = "Hb"; construct = altitude; vertex = B; base = "ca"; dynamic = false; collision = false }
new Line { name = "altA"; pos = (A, Ha); interact = false }
new Line { name = "altB"; pos = (B, Hb); interact = false }
new Point { name = "H"; pos = (0, 0); text = true("H"); dynamic = false; collision = false }
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Point { name = "G2"; pos = (0, 0); text = true("G"); dynamic = false; collision = false }
new Line { name = "euler"; pos = (H, O); interact = false; active = false }
draw Punctir { name = "eulerLine"; edge = "euler" }
new Claster { name = "tabEuler"; elements = (Ha, Hb, altA, altB, H, O, G2, eulerLine); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnSum"; type = button; label = "Углы"; action = "tab = 1; tabSum.active = true; tabMedian.active = false; tabBisector.active = false; tabEuler.active = false" }
new UI { name = "btnMedian"; type = button; label = "Медианы"; action = "tab = 2; tabSum.active = false; tabMedian.active = true; tabBisector.active = false; tabEuler.active = false" }
new UI { name = "btnBisector"; type = button; label = "Биссектрисы"; action = "tab = 3; tabSum.active = false; tabMedian.active = false; tabBisector.active = true; tabEuler.active = false" }
new UI { name = "btnEuler"; type = button; label = "Прямая Эйлера"; action = "tab = 4; tabSum.active = false; tabMedian.active = false; tabBisector.active = false; tabEuler.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}
// Площадь треугольника (со знаком) по трём вершинам.
Function area2(ax, ay, bx, by, cx2, cy2) {
  return (bx - ax) * (cy2 - ay) - (by - ay) * (cx2 - ax);
}
Function ok(ax, ay, bx, by, cx2, cy2) {
  if (!inField(ax, ay) || !inField(bx, by) || !inField(cx2, cy2)) { return false; }
  return abs(area2(ax, ay, bx, by, cx2, cy2)) >= 0.7;
}
Function reach(x0, y0, dx, dy, ox1, oy1, ox2, oy2) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      float t = (i + 1) / 16;
      if (ok(x0 + dx * t, y0 + dy * t, ox1, oy1, ox2, oy2)) { good = t; } else { bad = t; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ox1, oy1, ox2, oy2)) { good = mid; } else { bad = mid; }
  }
  return good;
}
float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, ox1, oy1, ox2, oy2) {
  float t = reach(px, py, nx - px, ny - py, ox1, oy1, ox2, oy2);
  float cxr = px + (nx - px) * t; float cyr = py + (ny - py) * t;
  float rx = nx - cxr; float ry = ny - cyr;
  if (t < 1) {
    cxr = cxr + rx * reach(cxr, cyr, rx, 0, ox1, oy1, ox2, oy2);
    cyr = cyr + ry * reach(cxr, cyr, 0, ry, ox1, oy1, ox2, oy2);
  }
  sx = cxr; sy = cyr;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m > 0.000001) {
    if (mA == m) { slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; }
    else if (mB == m) { slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy; }
    else { slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; }
  }
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float a = bc.length; float b = ca.length; float c = ab.length;
  float s = (a + b + c) / 2;
  float S = sqrt(max(0.0001, s * (s - a) * (s - b) * (s - c)));

  if (tab == 1) {
    G.pos.x = 0; G.pos.y = 0; I.pos.x = 0; I.pos.y = 0; H.pos.x = 0; H.pos.y = 0; O.pos.x = 0; O.pos.y = 0;
    float ext = 180 - angA.measure;
    info = "**Сумма внутренних углов всегда равна 180°:** ∠A + ∠B + ∠C = " + format(angA.measure, 0) + "° + " + format(angB.measure, 0) + "° + " + format(angC.measure, 0) + "° = " + format(angA.measure + angB.measure + angC.measure, 0) + "°.\n\n**Внешний угол при A** (пунктир — продолжение AB) равен сумме двух несмежных внутренних: " + format(ext, 0) + "° = ∠B + ∠C = " + format(angB.measure + angC.measure, 0) + "°.";
  } else if (tab == 2) {
    G.pos.x = (A.pos.x + B.pos.x + C.pos.x) / 3; G.pos.y = (A.pos.y + B.pos.y + C.pos.y) / 3;
    info = "**Три медианы пересекаются в одной точке — центроиде G**, который делит каждую медиану в отношении 2 : 1 от вершины: AG = " + format(medA.length * 2 / 3, 2) + ", GMa = " + format(medA.length / 3, 2) + " (AG : GMa = 2 : 1).";
  } else if (tab == 3) {
    float ia = b + c; float ib = a + c; float ic = a + b;
    float per = a + b + c;
    I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / per; I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / per;
    float r = S / s;
    info = "**Три биссектрисы пересекаются в одной точке — инцентре I**, равноудалённой от всех сторон: расстояние до каждой стороны равно радиусу вписанной окружности r = S / p ≈ " + format(r, 2) + ".";
  } else {
    // Ортоцентр H = A + B + C - 2*O (через векторную формулу), но проще: пересечение altA и altB.
    // altA: точка Ha — основание высоты из A, altB аналогично. Находим H как пересечение прямых A-Ha и B-Hb.
    float d1x = Ha.pos.x - A.pos.x; float d1y = Ha.pos.y - A.pos.y;
    float d2x = Hb.pos.x - B.pos.x; float d2y = Hb.pos.y - B.pos.y;
    float den = d1x * d2y - d1y * d2x;
    float t = ((B.pos.x - A.pos.x) * d2y - (B.pos.y - A.pos.y) * d2x) / den;
    H.pos.x = A.pos.x + d1x * t; H.pos.y = A.pos.y + d1y * t;
    // Циркумцентр O — равноудалён от вершин: решаем как пересечение серединных перпендикуляров.
    float mabx = (A.pos.x + B.pos.x) / 2; float maby = (A.pos.y + B.pos.y) / 2;
    float mbcx = (B.pos.x + C.pos.x) / 2; float mbcy = (B.pos.y + C.pos.y) / 2;
    float e1x = -(B.pos.y - A.pos.y); float e1y = B.pos.x - A.pos.x;
    float e2x = -(C.pos.y - B.pos.y); float e2y = C.pos.x - B.pos.x;
    float den2 = e1x * e2y - e1y * e2x;
    float t2 = ((mbcx - mabx) * e2y - (mbcy - maby) * e2x) / den2;
    O.pos.x = mabx + e1x * t2; O.pos.y = maby + e1y * t2;
    G2.pos.x = (A.pos.x + B.pos.x + C.pos.x) / 3; G2.pos.y = (A.pos.y + B.pos.y + C.pos.y) / 3;
    euler.active = true;
    float R = sqrt((O.pos.x - A.pos.x) * (O.pos.x - A.pos.x) + (O.pos.y - A.pos.y) * (O.pos.y - A.pos.y));
    float r = S / s;
    string eq = "≥"; if (abs(a - b) < 0.02 && abs(b - c) < 0.02) { eq = "="; }
    info = "**Высоты пересекаются в ортоцентре H**, серединные перпендикуляры — в циркумцентре O (центре описанной окружности R ≈ " + format(R, 2) + "). **Точки H, G, O лежат на одной прямой (прямая Эйлера)**, а HG = 2·GO: HG ≈ " + format(sqrt((H.pos.x - G2.pos.x) * (H.pos.x - G2.pos.x) + (H.pos.y - G2.pos.y) * (H.pos.y - G2.pos.y)), 2) + ", GO ≈ " + format(sqrt((G2.pos.x - O.pos.x) * (G2.pos.x - O.pos.x) + (G2.pos.y - O.pos.y) * (G2.pos.y - O.pos.y)), 2) + ".\n\n**Неравенство Эйлера** R " + eq + " 2r: " + format(R, 2) + " " + eq + " " + format(2 * r, 2) + " (равенство только у равностороннего треугольника).";
  }
}
]
