[
description = "{info}"

field width = 30;
field height = 18;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается. ----
new Point { name = "A"; pos = (-4.5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4.5, -3.3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0.5, 3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Три вневписанные окружности: Ia касается BC изнутри и продолжений AB, CA. ----
new Point { name = "Ia"; pos = (0, 0); dynamic = false; collision = false; text = true("Ia") }
new Point { name = "Ib"; pos = (0, 0); dynamic = false; collision = false; text = true("Ib") }
new Point { name = "Ic"; pos = (0, 0); dynamic = false; collision = false; text = true("Ic") }
float ra = 1; float rb = 1; float rc = 1;
new Circle { name = "wa"; center = "Ia"; radius = ra; interact = false }
new Circle { name = "wb"; center = "Ib"; radius = rb; interact = false }
new Circle { name = "wc"; center = "Ic"; radius = rc; interact = false }

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

  // Стороны, полупериметр, площадь по формуле Герона, радиус вписанной для проверки суммы.
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = dist(bx, by, cx, cy);
  float b = dist(cx, cy, ax, ay);
  float c = dist(ax, ay, bx, by);
  float p = (a + b + c) / 2;
  float S = sqrt(max(0.0001, p * (p - a) * (p - b) * (p - c)));
  float rin = S / p;
  ra = S / max(0.05, p - a);
  rb = S / max(0.05, p - b);
  rc = S / max(0.05, p - c);

  // Эксцентр Ia — на пересечении биссектрисы угла A и внешних биссектрис при B и C,
  // барицентрические веса (-a : b : c); аналогично Ib, Ic.
  Ia.pos.x = (-a * ax + b * bx + c * cx) / (-a + b + c);
  Ia.pos.y = (-a * ay + b * by + c * cy) / (-a + b + c);
  Ib.pos.x = (a * ax - b * bx + c * cx) / (a - b + c);
  Ib.pos.y = (a * ay - b * by + c * cy) / (a - b + c);
  Ic.pos.x = (a * ax + b * bx - c * cx) / (a + b - c);
  Ic.pos.y = (a * ay + b * by - c * cy) / (a + b - c);

  info = "**Каждая сторона треугольника задаёт свою вневписанную окружность.** Ia касается стороны BC изнутри и продолжений сторон AB, CA; аналогично Ib — стороны CA, Ic — стороны AB. Их радиусы: ra = " + format(ra, 2) + ", rb = " + format(rb, 2) + ", rc = " + format(rc, 2) + " (при r вписанной окружности = " + format(rin, 2) + ").\n\n**Сумма радиусов вневписанных окружностей** равна сумме радиуса вписанной и учетверённого радиуса описанной: ra + rb + rc = " + format(ra + rb + rc, 2) + ".";
}
]
