[
description = "{info}"

field width = 26;
field height = 16;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается. ----
new Point { name = "A"; pos = (-4.5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4.5, -3.3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0.5, 3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// ---- Эксцентр Ia: пересечение внутренней биссектрисы угла A и внешних биссектрис
// углов B, C. Продолжения сторон AB, AC за B и C нарисованы отдельными линиями,
// биссектрисы — вспомогательные (прозрачные) до эксцентра. ----
new Point { name = "Ia"; pos = (0, 0); dynamic = false; collision = false; text = true("Ia") }
float ra = 1;
new Circle { name = "w"; center = "Ia"; radius = ra; interact = false }

new Line { name = "biA"; pos = (A, Ia) }
new Line { name = "biB"; pos = (B, Ia) }
new Line { name = "biC"; pos = (C, Ia) }

// Точки касания на BC и на продолжениях — равноудалённость от трёх прямых.
new Point { name = "Ta"; pos = (0, 0); dynamic = false; collision = false; text = false }
new Point { name = "Tb"; pos = (0, 0); dynamic = false; collision = false; text = false }
new Point { name = "Tc"; pos = (0, 0); dynamic = false; collision = false; text = false }
new Line { name = "dA"; pos = (Ia, Ta); interact = false }
new Line { name = "dB"; pos = (Ia, Tb); interact = false }
new Line { name = "dC"; pos = (Ia, Tc); interact = false }
draw Punctir { edge = "dA" }
draw Punctir { edge = "dB" }
draw Punctir { edge = "dC" }
draw EquallySing { name = "eqAB"; edges = (dA, dB); type = 1 }
draw EquallySing { name = "eqBC"; edges = (dB, dC); type = 1 }

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
Function proj(px, py, qx, qy, rx0, ry0) {
  float dx = qx - px; float dy = qy - py;
  return ((rx0 - px) * dx + (ry0 - py) * dy) / max(0.0001, dx * dx + dy * dy);
}

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

  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = dist(bx, by, cx, cy);
  float b = dist(cx, cy, ax, ay);
  float c = dist(ax, ay, bx, by);
  float p = (a + b + c) / 2;
  float S = sqrt(max(0.0001, p * (p - a) * (p - b) * (p - c)));
  ra = S / max(0.05, p - a);

  // Эксцентр Ia — барицентрические веса (-a : b : c).
  Ia.pos.x = (-a * ax + b * bx + c * cx) / (-a + b + c);
  Ia.pos.y = (-a * ay + b * by + c * cy) / (-a + b + c);

  // Проекции Ia на три прямые — точки касания, равноудалённые от Ia на расстояние ra.
  float tA = proj(bx, by, cx, cy, Ia.pos.x, Ia.pos.y);
  Ta.pos.x = bx + (cx - bx) * tA; Ta.pos.y = by + (cy - by) * tA;
  float tB = proj(ax, ay, bx, by, Ia.pos.x, Ia.pos.y);
  Tb.pos.x = ax + (bx - ax) * tB; Tb.pos.y = ay + (by - ay) * tB;
  float tC = proj(ax, ay, cx, cy, Ia.pos.x, Ia.pos.y);
  Tc.pos.x = ax + (cx - ax) * tC; Tc.pos.y = ay + (cy - ay) * tC;

  float d1 = dist(Ia.pos.x, Ia.pos.y, Ta.pos.x, Ta.pos.y);
  float d2 = dist(Ia.pos.x, Ia.pos.y, Tb.pos.x, Tb.pos.y);
  float d3 = dist(Ia.pos.x, Ia.pos.y, Tc.pos.x, Tc.pos.y);

  info = "**Эксцентр Ia** — точка пересечения биссектрисы внутреннего угла A с биссектрисами внешних углов при B и C. Он равноудалён от прямой BC и от прямых, содержащих продолжения сторон AB и AC: расстояния (пунктир) равны ra = " + format(d1, 2) + " = " + format(d2, 2) + " = " + format(d3, 2) + ".\n\n**Радиус вневписанной окружности:** ra = S / (p − a) = " + format(ra, 2) + ", где p = " + format(p, 2) + ", S = " + format(S, 2) + ".";
}
]
