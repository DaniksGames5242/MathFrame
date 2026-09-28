[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается. ----
new Point { name = "A"; pos = (-7, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (7, -4.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 4.5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Вписанная окружность: центр I — точка пересечения биссектрис, радиус r = S / p. ----
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
float r = 1;
new Circle { name = "w"; center = "I"; radius = r; interact = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.4 || lv < 0.4) { return false; }
  return abs(ux * vy - uy * vx) / 2 >= 0.5;
}

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

Function dist(x1, y1, x2, y2) { return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pcx, pcy, pax, pay);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
  } else {
    slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby);
    C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
  }
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)
      || abs((B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y)) / 2 < 0.4) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Стороны треугольника (a — против A, и т. д.), полупериметр, площадь по формуле Герона.
  float a = dist(B.pos.x, B.pos.y, C.pos.x, C.pos.y);
  float b = dist(C.pos.x, C.pos.y, A.pos.x, A.pos.y);
  float c = dist(A.pos.x, A.pos.y, B.pos.x, B.pos.y);
  float p = (a + b + c) / 2;
  float S = sqrt(max(0.0001, p * (p - a) * (p - b) * (p - c)));
  r = S / p;

  // Центр вписанной окружности — точка пересечения биссектрис, барицентрические веса a, b, c.
  I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / (a + b + c);
  I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / (a + b + c);

  info = "**Вписанная окружность** касается всех трёх сторон изнутри. Её центр I — точка пересечения биссектрис внутренних углов, равноудалённая от всех сторон на расстояние r.\n\n**Радиус через площадь и полупериметр:** r = S / p, где p = (a + b + c) / 2 = " + format(p, 2) + ", S = " + format(S, 2) + " (по формуле Герона), значит r = " + format(r, 2) + ".";
}
]
