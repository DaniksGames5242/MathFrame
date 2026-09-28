[
description = "{info}"

field width = 16;
field height = 16;
camera type = fixed;

// ---- Квадрат ABCD (та же схема, что в square.gms / properties-4.gms): сторона AB
// перетаскивается, C и D — поворотом на −90°. Одна сцена сразу показывает все
// перечисленные свойства: равные стороны и прямые углы, равные перпендикулярные
// биссектрисные диагонали, точку O — центр обеих окружностей. ----
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
new Angle { name = "angB"; lines = (bc, ab) }
new Angle { name = "angC"; lines = (cd, bc) }
new Angle { name = "angD"; lines = (da, cd) }
draw Angle { name = "arcA"; angle = "angA"; lock = true; measure = false }
draw Angle { name = "arcB"; angle = "angB"; lock = true; measure = false }
draw Angle { name = "arcC"; angle = "angC"; lock = true; measure = false }
draw Angle { name = "arcD"; angle = "angD"; lock = true; measure = false }

new Line { name = "diagAC"; pos = (A, C); dynamic = false; interact = false; active = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; collision = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqDiag"; edges = (ao, oc, bo, od); type = 2 }
new Angle { name = "angO"; lines = (ao, bo) }
draw Angle { name = "arcO"; angle = "angO"; lock = true; measure = false }
new Angle { name = "angOAB"; lines = (ao, ab) }
draw Angle { name = "arcOAB"; angle = "angOAB"; count = 1 }
new Angle { name = "angOAD"; lines = (da, ao) }
draw Angle { name = "arcOAD"; angle = "angOAD"; count = 1 }

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

  float a = ab.length;
  info = "**Все стороны равны, все углы прямые:** AB = BC = CD = DA = " + format(a, 2) + ", ∠A = ∠B = ∠C = ∠D = 90°.\n\n**Диагонали равны, перпендикулярны, делятся точкой O пополам и являются биссектрисами углов:** AC = BD = " + format(diagAC.length, 2) + ", ∠AOB = " + format(angO.measure, 0) + "°, ∠OAB = ∠OAD = " + format(angOAB.measure, 0) + "°.\n\n**Точка O равноудалена от всех вершин и от всех сторон** — центр и вписанной, и описанной окружности.";
}
]
