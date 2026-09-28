[
description = "{info}"

field width = 16;
field height = 16;
camera type = fixed;

// ---- Квадрат ABCD (сторона AB перетаскивается, C и D — поворотом на −90°, как в
// square.gms). Показывает, что квадрат наследует свойства и прямоугольника
// (равенство и точка пересечения диагоналей), и ромба (перпендикулярность,
// биссектрисы) одновременно, плюс оси симметрии — их у квадрата ровно четыре. ----
new Point { name = "A"; pos = (-3, 3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, 3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (3, -3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, -3); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "cd"; pos = (C, D); interact = false }
new Line { name = "da"; pos = (D, A); interact = false }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

draw EquallySing { name = "eqAll"; edges = (ab, bc, cd, da); type = 1 }
new Angle { name = "angA"; lines = (ab, da) }
draw Angle { name = "arcA"; angle = "angA"; lock = true; measure = false }

new Line { name = "diagAC"; pos = (A, C); dynamic = false; interact = false; active = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; collision = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqDiag"; edges = (ao, oc, bo, od); type = 2 }
new Angle { name = "angO"; lines = (ao, bo) }
draw Angle { name = "arcO"; angle = "angO"; lock = true; measure = false }
new Claster { name = "tabDiag"; elements = (O, ao, oc, bo, od, eqDiag, arcO); active = true }

// ---- Оси симметрии: две через вершины (AC, BD), две через середины сторон ----
new Point { name = "M"; construct = median; vertex = D; base = "ab"; dynamic = false; collision = false; active = false }
new Point { name = "N"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; active = false }
new Point { name = "Mopp"; dynamic = false; collision = false; active = false }
new Point { name = "Nopp"; dynamic = false; collision = false; active = false }
new Line { name = "axAC"; pos = (A, C); interact = false }
new Line { name = "axBD"; pos = (B, D); interact = false }
new Line { name = "axMN1"; pos = (M, Mopp); interact = false }
new Line { name = "axMN2"; pos = (N, Nopp); interact = false }
new Claster { name = "tabSym"; elements = (axAC, axBD, axMN1, axMN2); active = false }

new UI { name = "btnDiag"; type = button; label = "Прямоугольник и ромб"; action = "tab = 1; tabDiag.active = true; tabSym.active = false" }
new UI { name = "btnSym"; type = button; label = "Оси симметрии"; action = "tab = 2; tabDiag.active = false; tabSym.active = true" }

float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Function okAB(ax, ay, bx, by) {
  float vx = bx - ax; float vy = by - ay;
  float len = sqrt(vx * vx + vy * vy);
  if (len < 0.6) { return false; }
  float wx = vy; float wy = -vx;
  return inField(ax, ay) && inField(bx, by) && inField(bx + wx, by + wy) && inField(ax + wx, ay + wy);
}

Function okK(k, x, y, ox, oy) {
  float ax = ox; float ay = oy; float bx = x; float by = y;
  if (k == 0) { ax = x; ay = y; bx = ox; by = oy; }
  if (k == 2) { ax = ox + (y - oy); ay = oy - (x - ox); bx = ox; by = oy; }
  if (k == 3) { ax = ox; ay = oy; bx = ox - (y - oy); by = oy + (x - ox); }
  return okAB(ax, ay, bx, by);
}

Function reachK(k, x0, y0, dx, dy, ox, oy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okK(k, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ox, oy)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okK(k, x0 + dx * mid, y0 + dy * mid, ox, oy)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Ход вершины k (0..3 = A..D) при неподвижной соседней вершине (ox, oy): допустимая часть
// хода, остаток скользит по осям. Результат — в sx, sy.
Function slideK(k, px, py, nx, ny, ox, oy) {
  float t = reachK(k, px, py, nx - px, ny - py, ox, oy);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reachK(k, cx, cy, rx, 0, ox, oy);
    cy = cy + ry * reachK(k, cx, cy, 0, ry, ox, oy);
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
  if (m < 0.000001 || shift < 0.000001) {
  } else {
    float ax = pax; float ay = pay; float bx = pbx; float by = pby;
    if (mA == m) {
      slideK(0, pax, pay, A.pos.x, A.pos.y, pbx, pby);
      ax = sx; ay = sy;
    } else if (mB == m) {
      slideK(1, pbx, pby, B.pos.x, B.pos.y, pax, pay);
      bx = sx; by = sy;
    } else if (mC == m) {
      slideK(2, pcx, pcy, C.pos.x, C.pos.y, pbx, pby);
      ax = pbx + (sy - pby); ay = pby - (sx - pbx);
    } else {
      slideK(3, pdx, pdy, D.pos.x, D.pos.y, pax, pay);
      bx = pax - (sy - pay); by = pay + (sx - pax);
    }
    A.pos.x = ax; A.pos.y = ay; B.pos.x = bx; B.pos.y = by;
  }
  // Страховка: если кадр всё же дал недопустимый квадрат, вернуть последнее корректное положение.
  if (!okAB(A.pos.x, A.pos.y, B.pos.x, B.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;

  float vx = B.pos.x - A.pos.x; float vy = B.pos.y - A.pos.y;
  float wx = vy; float wy = -vx;
  C.pos.x = B.pos.x + wx; C.pos.y = B.pos.y + wy;
  D.pos.x = A.pos.x + wx; D.pos.y = A.pos.y + wy;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
  // Оси через середины противоположных сторон: M — середина AB, Mopp — середина CD;
  // N — середина BC, Nopp — середина AD.
  Mopp.pos.x = (D.pos.x + C.pos.x) / 2; Mopp.pos.y = (D.pos.y + C.pos.y) / 2;
  Nopp.pos.x = (A.pos.x + D.pos.x) / 2; Nopp.pos.y = (A.pos.y + D.pos.y) / 2;

  float a = ab.length;
  if (tab == 1) {
    info = "**Свойства прямоугольника:** диагонали равны и делятся точкой O пополам: AC = BD = " + format(diagAC.length, 2) + ". **Свойства ромба:** те же диагонали перпендикулярны (∠AOB = " + format(angO.measure, 0) + "°) и делят углы при вершинах пополам. Вместе это и даёт равенство всех сторон, AB = " + format(a, 2) + ", и все углы прямые.";
  } else {
    info = "**Четыре оси симметрии** — максимум среди всех четырёхугольников: две проходят через противоположные вершины (AC, BD), две — через середины противоположных сторон. Любая из них делит квадрат со стороной " + format(a, 2) + " на два равных прямоугольных треугольника или прямоугольника.";
  }
}
]
