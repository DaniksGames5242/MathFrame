[
description = "{info}"

field width = 20;
field height = 13;
camera type = fixed;

// ---- Один произвольный треугольник ABC. Четыре вкладки показывают из вершины A все четыре
// линии по очереди: медиану (к середине BC), биссектрису (делит угол A пополам), высоту
// (перпендикуляр к BC) и серединный перпендикуляр к стороне AB — каждая своим построением. ----
new Point { name = "A"; pos = (-2, 4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-8, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (7, -3); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Вкладка 1: медиана ----
new Point { name = "Ma"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Line { name = "medA"; pos = (A, Ma); interact = false }
new Claster { name = "tabMedian"; elements = (Ma, medA); active = true }

// ---- Вкладка 2: биссектриса ----
new Point { name = "Da"; construct = bisector; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("D") }
new Line { name = "bisA"; pos = (A, Da); interact = false }
new Angle { name = "angBAD"; lines = (ab, bisA) }
new Angle { name = "angDAC"; lines = (bisA, ca) }
draw Angle { name = "arcBAD"; angle = "angBAD"; measure = false }
draw Angle { name = "arcDAC"; angle = "angDAC"; measure = false }
new Claster { name = "tabBisector"; elements = (Da, bisA, arcBAD, arcDAC); active = false }

// ---- Вкладка 3: высота ----
new Point { name = "Ha"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("H") }
new Line { name = "altA"; pos = (A, Ha); interact = false }
new Line { name = "haExt"; pos = (Ha, B); active = false; interact = false }
draw Punctir { name = "extBC"; edge = "haExt" }
new Angle { name = "angAH"; lines = (altA, haExt) }
draw Angle { name = "arcAH"; angle = "angAH"; measure = false }
new Claster { name = "tabHeight"; elements = (Ha, altA, extBC, arcAH); active = false }

// ---- Вкладка 4: серединный перпендикуляр к AB ----
new Point { name = "Mab"; construct = median; vertex = A; base = "ab"; dynamic = false; collision = false; text = true("N") }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "perpAB"; pos = (Mab, P2); interact = false }
new Line { name = "abHalf"; pos = (A, Mab); color = "transparent"; interact = false }
new Angle { name = "angPerp"; lines = (perpAB, abHalf) }
draw Angle { name = "arcPerp"; angle = "angPerp"; measure = false }
new Claster { name = "tabPerp"; elements = (Mab, perpAB, abHalf, arcPerp); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnMedian"; type = button; label = "Медиана"; action = "tab = 1; tabMedian.active = true; tabBisector.active = false; tabHeight.active = false; tabPerp.active = false" }
new UI { name = "btnBisector"; type = button; label = "Биссектриса"; action = "tab = 2; tabMedian.active = false; tabBisector.active = true; tabHeight.active = false; tabPerp.active = false" }
new UI { name = "btnHeight"; type = button; label = "Высота"; action = "tab = 3; tabMedian.active = false; tabBisector.active = false; tabHeight.active = true; tabPerp.active = false" }
new UI { name = "btnPerp"; type = button; label = "Серединный перпендикуляр"; action = "tab = 4; tabMedian.active = false; tabBisector.active = false; tabHeight.active = false; tabPerp.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function area2(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
Function ok(ax, ay, bx, by, cx, cy) {
  if (!inField(ax, ay) || !inField(bx, by) || !inField(cx, cy)) { return false; }
  return abs(area2(ax, ay, bx, by, cx, cy)) >= 0.7;
}
Function reach(x0, y0, dx, dy, ox1, oy1, ox2, oy2) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { float t = (i + 1) / 16; if (ok(x0 + dx * t, y0 + dy * t, ox1, oy1, ox2, oy2)) { good = t; } else { bad = t; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ox1, oy1, ox2, oy2)) { good = mid; } else { bad = mid; } }
  return good;
}
float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, ox1, oy1, ox2, oy2) {
  float t = reach(px, py, nx - px, ny - py, ox1, oy1, ox2, oy2);
  float cxr = px + (nx - px) * t; float cyr = py + (ny - py) * t;
  float rx = nx - cxr; float ry = ny - cyr;
  if (t < 1) { cxr = cxr + rx * reach(cxr, cyr, rx, 0, ox1, oy1, ox2, oy2); cyr = cyr + ry * reach(cxr, cyr, 0, ry, ox1, oy1, ox2, oy2); }
  sx = cxr; sy = cyr;
  return 0;
}

Start { pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y; }

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
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) { A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Серединный перпендикуляр к AB: через середину N (=Mab), перпендикулярно AB, фиксированной
  // длины (нормируем направление), чтобы не убегать за поле при длинной стороне AB.
  float dx = pby - pay; float dy = -(pbx - pax);
  float dl = sqrt(dx * dx + dy * dy);
  float ux = dx / dl; float uy = dy / dl;
  float len = 4;
  float rx = Mab.pos.x + ux * len; float ry = Mab.pos.y + uy * len;
  if (!inField(rx, ry)) { len = -len; rx = Mab.pos.x + ux * len; ry = Mab.pos.y + uy * len; }
  P2.pos.x = rx; P2.pos.y = ry;

  if (tab == 1) {
    info = "**Медиана** из A соединяет вершину с серединой M противоположной стороны: BM = MC = " + format(bc.length / 2, 2) + ". Длина медианы AM = " + format(medA.length, 2) + ".";
  } else if (tab == 2) {
    info = "**Биссектриса** из A делит угол пополам: ∠BAD = ∠DAC = " + format(angBAD.measure, 0) + "°, и делит сторону BC в точке D пропорционально прилежащим сторонам: BD/DC = AB/AC ≈ " + format(ab.length / ca.length, 2) + ".";
  } else if (tab == 3) {
    info = "**Высота** из A опущена перпендикулярно прямой BC (пунктир — продолжение стороны при тупом основании): AH = " + format(altA.length, 2) + ", ∠AHB = " + format(angAH.measure, 0) + "°.";
  } else {
    info = "**Серединный перпендикуляр** к стороне AB проходит через её середину N перпендикулярно AB: AN = NB = " + format(ab.length / 2, 2) + ", угол с AB — " + format(angPerp.measure, 0) + "°. Он пересекается с двумя другими серединными перпендикулярами в центре описанной окружности.";
  }
}
]
