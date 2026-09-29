[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Прямоугольник ABCD как параллелограмм с равными диагоналями: A и C — концы
// одной диагонали на общей окружности радиуса r с центром O, B и D — концы другой
// диагонали на той же окружности. Общее O и общий r гарантируют одновременно и
// параллелограммность (диагонали делятся пополам), и прямоугольность (диагонали
// равны) — ровно определение через её признак. Все четыре вершины перетаскиваются. ----
new Point { name = "A"; pos = (-4.078, 1.902); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.686, 2.581); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4.078, -1.902); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3.686, -2.581); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "diagBD"; pos = (B, D); interact = false }

new Claster { name = "tabDiag"; elements = (O, diagAC, diagBD); active = true }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD" }
new Claster { name = "tabAngles"; elements = (arcA, arcB, arcC, arcD); active = false }

new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tab = 1; tabDiag.active = true; tabAngles.active = false" }
new UI { name = "btnAngles"; type = button; label = "Углы"; action = "tab = 2; tabDiag.active = false; tabAngles.active = true" }

float tab = 1;
string info = "";
float ox = 0; float oy = 0; float pox = 0; float poy = 0;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустима ли позиция (x, y) как новое место вершины на диагонали с центром (ox, oy),
// если другая диагональ сейчас идёт через (obx, oby): проверяем поле для новой вершины
// и её пары (симметричной относительно O), а также для пересчитанной другой пары
// (сохраняющей направление, но получающей новый общий радиус), и невырожденность угла.
Function ok(x, y, ox, oy, obx, oby) {
  float ux = x - ox; float uy = y - oy;
  float r = sqrt(ux * ux + uy * uy);
  if (r < 1.6) { return false; }
  float cx = 2 * ox - x; float cy = 2 * oy - y;
  if (!inField(x, y) || !inField(cx, cy)) { return false; }
  float vx = obx - ox; float vy = oby - oy;
  float rb = sqrt(vx * vx + vy * vy);
  if (rb < 0.000001) { return false; }
  float nbx = ox + vx / rb * r; float nby = oy + vy / rb * r;
  float ndx = ox - vx / rb * r; float ndy = oy - vy / rb * r;
  if (!inField(nbx, nby) || !inField(ndx, ndy)) { return false; }
  return abs(ux * vy - uy * vx) / (r * rb) >= 0.26;
}

Function reach(x0, y0, dx, dy, ox, oy, obx, oby) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ox, oy, obx, oby)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ox, oy, obx, oby)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Function slide(px, py, nx, ny, ox, oy, obx, oby) {
  float t = reach(px, py, nx - px, ny - py, ox, oy, obx, oby);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ox, oy, obx, oby);
    cy = cy + ry * reach(cx, cy, 0, ry, ox, oy, obx, oby);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001) {
  } else if (shift < 0.000001) {
    // Перетаскивание фигуры целиком — все вершины сдвинуты на один вектор.
    ox = ox + (A.pos.x - pax); oy = oy + (A.pos.y - pay);
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, ox, oy, pbx, pby);
    A.pos.x = sx; A.pos.y = sy; C.pos.x = 2 * ox - sx; C.pos.y = 2 * oy - sy;
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    float vx = pbx - ox; float vy = pby - oy; float rb = sqrt(vx * vx + vy * vy);
    B.pos.x = ox + vx / rb * r; B.pos.y = oy + vy / rb * r;
    D.pos.x = ox - vx / rb * r; D.pos.y = oy - vy / rb * r;
  } else if (mC == m) {
    float vax = 2 * ox - C.pos.x; float vay = 2 * oy - C.pos.y;
    slide(pax, pay, vax, vay, ox, oy, pbx, pby);
    A.pos.x = sx; A.pos.y = sy; C.pos.x = 2 * ox - sx; C.pos.y = 2 * oy - sy;
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    float vx = pbx - ox; float vy = pby - oy; float rb = sqrt(vx * vx + vy * vy);
    B.pos.x = ox + vx / rb * r; B.pos.y = oy + vy / rb * r;
    D.pos.x = ox - vx / rb * r; D.pos.y = oy - vy / rb * r;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, ox, oy, pax, pay);
    B.pos.x = sx; B.pos.y = sy; D.pos.x = 2 * ox - sx; D.pos.y = 2 * oy - sy;
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    float vx = pax - ox; float vy = pay - oy; float ra = sqrt(vx * vx + vy * vy);
    A.pos.x = ox + vx / ra * r; A.pos.y = oy + vy / ra * r;
    C.pos.x = ox - vx / ra * r; C.pos.y = oy - vy / ra * r;
  } else {
    float vbx = 2 * ox - D.pos.x; float vby = 2 * oy - D.pos.y;
    slide(pbx, pby, vbx, vby, ox, oy, pax, pay);
    B.pos.x = sx; B.pos.y = sy; D.pos.x = 2 * ox - sx; D.pos.y = 2 * oy - sy;
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    float vx = pax - ox; float vy = pay - oy; float ra = sqrt(vx * vx + vy * vy);
    A.pos.x = ox + vx / ra * r; A.pos.y = oy + vy / ra * r;
    C.pos.x = ox - vx / ra * r; C.pos.y = oy - vy / ra * r;
  }
  // Страховка: диагонали равны и делятся пополам общей точкой (ox, oy), все вершины в поле.
  float rA = sqrt((A.pos.x - ox) * (A.pos.x - ox) + (A.pos.y - oy) * (A.pos.y - oy));
  float rB = sqrt((B.pos.x - ox) * (B.pos.x - ox) + (B.pos.y - oy) * (B.pos.y - oy));
  if (abs(rA - rB) > 0.001
      || abs(A.pos.x + C.pos.x - 2 * ox) + abs(A.pos.y + C.pos.y - 2 * oy) > 0.001
      || abs(B.pos.x + D.pos.x - 2 * ox) + abs(B.pos.y + D.pos.y - 2 * oy) > 0.001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    ox = pox; oy = poy;
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  O.pos.x = ox; O.pos.y = oy;
  pox = ox; poy = oy;
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  if (tab == 1) {
    info = "**Диагонали равны:** AC = " + format(diagAC.length, 2) + ", BD = " + format(diagBD.length, 2) + ".\n\n**И делятся точкой пересечения O пополам**, как в любом параллелограмме: OA = OC = OB = OD = " + format(diagAC.length / 2, 2) + ". Это и есть признак прямоугольности параллелограмма — равенство диагоналей вместе со взаимным делением пополам.";
  } else {
    info = "**Все четыре угла прямые** — это следствие равенства диагоналей: ∠A = ∠B = ∠C = ∠D = " + format(angA.measure, 0) + "°. Достаточно было бы и одного прямого угла — остальные три стали бы прямыми автоматически по свойствам параллелограмма.";
  }
}
]
