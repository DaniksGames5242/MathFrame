[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются. Ограничение — треугольник
// не вырождается (площадь не падает ниже порога), вершины не выходят за поле. ----
new Point { name = "A"; pos = (-7, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (7, -4.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 4.5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Медианы и центроид ----
new Point { name = "Ma"; construct = median; vertex = A; base = "bc"; dynamic = false; text = true("Ma") }
new Point { name = "Mb"; construct = median; vertex = B; base = "ca"; dynamic = false; text = true("Mb") }
new Point { name = "Mc"; construct = median; vertex = C; base = "ab"; dynamic = false; text = true("Mc") }
new Line { name = "mA"; pos = (A, Ma); interact = false }
new Line { name = "mB"; pos = (B, Mb); interact = false }
new Line { name = "mC"; pos = (C, Mc); interact = false }
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; text = true("G") }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли положение (x, y) перетаскиваемой вершины при двух других (ax, ay), (bx, by):
// она внутри поля, стороны не короче 0.4 (вершины не сливаются), площадь треугольника не
// меньше 0.5 (треугольник не вырождается в отрезок).
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

  G.pos.x = (A.pos.x + B.pos.x + C.pos.x) / 3;
  G.pos.y = (A.pos.y + B.pos.y + C.pos.y) / 3;

  float aG = dist(A.pos.x, A.pos.y, G.pos.x, G.pos.y);
  float gMa = dist(G.pos.x, G.pos.y, Ma.pos.x, Ma.pos.y);
  float bG = dist(B.pos.x, B.pos.y, G.pos.x, G.pos.y);
  float gMb = dist(G.pos.x, G.pos.y, Mb.pos.x, Mb.pos.y);

  info = "**Медианы треугольника пересекаются в одной точке G — центроиде.** Каждая медиана делится центроидом в отношении 2 : 1, считая от вершины: AG = " + format(aG, 2) + ", GMa = " + format(gMa, 2) + ", AG / GMa = " + format(aG / gMa, 2) + ".\n\n**Координаты центроида — среднее арифметическое координат вершин:** G = ((xA + xB + xC) / 3, (yA + yB + yC) / 3) = (" + num(G.pos.x, 2) + ", " + num(G.pos.y, 2) + "). Проверка на второй медиане: BG = " + format(bG, 2) + ", GMb = " + format(gMb, 2) + ", BG / GMb = " + format(bG / gMb, 2) + ".";
}
]
