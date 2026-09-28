[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Произвольный треугольник ABC, все вершины перетаскиваются свободно.
// c — наибольшая сторона (гипотенуза-кандидат); сравниваем c² с a² + b²: равенство
// по обратной теореме означает, что угол против c прямой. ----
new Point { name = "A"; pos = (-5.5, -3.2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3.2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 4.2); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA"; color = markA }
draw Angle { name = "arcB"; angle = "angB"; color = markB }
draw Angle { name = "arcC"; angle = "angC"; color = markC }

// ---- Логика ----
string info = "";
string markA = ""; string markB = ""; string markC = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function area2(x, y, ax, ay, bx, by) { return abs((ax - x) * (by - y) - (bx - x) * (ay - y)); }
Function ok(x, y, ax, ay, bx, by) {
  if (area2(x, y, ax, ay, bx, by) < 3) { return false; }
  float dx1 = ax - x; float dy1 = ay - y; float dx2 = bx - x; float dy2 = by - y;
  if (sqrt(dx1 * dx1 + dy1 * dy1) < 0.6 || sqrt(dx2 * dx2 + dy2 * dy2) < 0.6) { return false; }
  return true;
}
float sx = 0; float sy = 0;
Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; }
  }
  return good;
}
Function slide(px, py, nx, ny, ax, ay, bx, by) {
  float t = reach(px, py, nx - px, ny - py, ax, ay, bx, by);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ax, ay, bx, by);
    cy = cy + ry * reach(cx, cy, 0, ry, ax, ay, bx, by);
  }
  sx = cx; sy = cy;
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
  if (m >= 0.000001) {
    if (mA == m) { slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); A.pos.x = sx; A.pos.y = sy; }
    else if (mB == m) { slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); B.pos.x = sx; B.pos.y = sy; }
    else { slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); C.pos.x = sx; C.pos.y = sy; }
  }
  if (area2(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y) < 2.5) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Стороны: a = BC (против A), b = CA (против B), c = AB (против C).
  float a = bc.length; float b = ca.length; float c = ab.length;
  float a2 = a * a; float b2 = b * b; float c2 = c * c;
  // Наибольшая сторона и сумма квадратов двух других — сравниваем именно её квадрат
  // с суммой квадратов остальных (по обратной теореме прямым может быть только угол
  // против наибольшей стороны).
  float big2 = max(a2, max(b2, c2));
  float rest = a2 + b2 + c2 - big2;
  markA = ""; markB = ""; markC = "";
  string kind = "";
  string expl = "";
  string oppLabel = "";
  if (big2 == c2) { oppLabel = "C"; if (abs(c2 - rest) < 0.6) { markC = "#22c55e"; } else if (c2 > rest) { markC = "#f59e0b"; } }
  else if (big2 == a2) { oppLabel = "A"; if (abs(a2 - rest) < 0.6) { markA = "#22c55e"; } else if (a2 > rest) { markA = "#f59e0b"; } }
  else { oppLabel = "B"; if (abs(b2 - rest) < 0.6) { markB = "#22c55e"; } else if (b2 > rest) { markB = "#f59e0b"; } }

  if (abs(big2 - rest) < 0.6) { kind = "прямоугольный"; expl = "квадрат наибольшей стороны равен сумме квадратов двух других — угол против неё (" + oppLabel + ") прямой."; }
  else if (big2 > rest) { kind = "тупоугольный"; expl = "квадрат наибольшей стороны больше суммы квадратов двух других."; }
  else { kind = "остроугольный"; expl = "квадрат наибольшей стороны меньше суммы квадратов двух других."; }

  info = "**Стороны:** a = BC = " + format(a, 2) + ", b = CA = " + format(b, 2) + ", c = AB = " + format(c, 2) + ".\n\n**Сравнение квадратов:** наибольшая сторона² = " + format(big2, 1) + ", сумма квадратов остальных двух = " + format(rest, 1) + ".\n\n**Треугольник " + kind + "**: " + expl;
}
]
