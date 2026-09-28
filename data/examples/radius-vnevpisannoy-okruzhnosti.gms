[
description = "{info}"

field width = 22;
field height = 16;
camera type = fixed;

// ---- Треугольник ABC в верхней половине поля: все три вершины перетаскиваются,
// треугольник не вырождается. Внизу — столбиковая диаграмма трёх вневписанных
// радиусов ra, rb, rc рядом со «своими» знаменателями p−a, p−b, p−c. ----
new Point { name = "A"; pos = (-6, 1); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, 0.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 7); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; edgeCap = butt; labels = false; interactive = false }
draw Text { name = "lblP"; pos = (-8, -3.6); text = "p−a  p−b  p−c" }
draw Text { name = "lblR"; pos = (2.5, -3.6); text = "ra   rb   rc" }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y) || y < -1.5) { return false; }
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
Function bar(k, x, h, col) { addNode(g, "a" + k, [x, -3]); addNode(g, "b" + k, [x, -3 + h]); addEdge(g, "a" + k, "b" + k, 1, col); }

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
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || A.pos.y < -1.5 || B.pos.y < -1.5 || C.pos.y < -1.5
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
  float pa = max(0.05, p - a); float pb = max(0.05, p - b); float pc = max(0.05, p - c);
  float ra = S / pa; float rb = S / pb; float rc = S / pc;

  // Диаграмма: слева три столбика p−a, p−b, p−c, справа — обратные им ra, rb, rc
  // (одна и та же площадь S поделена на разные знаменатели). Масштаб общий для всех шести.
  float k = min(2.5, 5 / max(pa, max(pb, max(pc, max(ra, max(rb, rc))))));
  g = newGraph();
  bar("pa", -8, pa * k, "#3b82f6"); bar("pb", -6.5, pb * k, "#3b82f6"); bar("pc", -5, pc * k, "#3b82f6");
  bar("ra", 2.5, ra * k, "#f59e0b"); bar("rb", 4, rb * k, "#f59e0b"); bar("rc", 5.5, rc * k, "#f59e0b");

  info = "**Каждая вневписанная окружность получает свой радиус из общей площади S, делённой на «свой» остаток полупериметра.** ra = S / (p − a) = " + format(ra, 2) + ", rb = S / (p − b) = " + format(rb, 2) + ", rc = S / (p − c) = " + format(rc, 2) + " — чем меньше p − a (столбик слева), тем больше ra (столбик справа), при неизменной площади S = " + format(S, 2) + ".\n\n**Произведение ra · r равно (p − b)(p − c):** при радиусе вписанной окружности r = S / p = " + format(S / p, 2) + " имеем ra · r = " + format(ra * (S / p), 2) + ", (p − b)(p − c) = " + format(pb * pc, 2) + ".";
}
]
