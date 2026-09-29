[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Полный четырёхсторонник: четыре прямые AB, BC, CD, DA (выпуклый четырёхугольник ABCD,
// все вершины перетаскиваются) дают шесть точек A, B, C, D, E = AB ∩ CD, F = BC ∩ DA и три
// диагонали AC, BD, EF. Ход вершины обрезается, если E или F ушли бы за поле, а прямые
// стали почти параллельными (E или F в бесконечности). ----
new Point { name = "A"; pos = (7.7, 4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-3.5, 4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-2.8, 1.2); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (0.7, -2); text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Point { name = "E"; pos = (0, 0); dynamic = false; collision = false; text = true("E") }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; text = true("F") }
new Line { name = "dAC"; pos = (A, C); color = #3b82f6 }
new Line { name = "dBD"; pos = (B, D); color = #3b82f6 }
new Line { name = "dEF"; pos = (E, F); color = #3b82f6 }
draw Graph { name = "gX"; graph = "gxe"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }

new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("G") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("H") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("I") }
new Claster { name = "tabH"; elements = (G, H, I); active = false }

new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("K") }
new Point { name = "L"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("L") }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("N") }
draw Graph { name = "gN"; graph = "gnw"; edgeWidth = 3; edgeColor = #f59e0b; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
new Claster { name = "tabN"; elements = (K, L, N, gN); active = false }

new UI { name = "b1"; type = button; label = "Шесть точек"; action = "tab = 1; tabH.active = false; tabN.active = false" }
new UI { name = "b2"; type = button; label = "Гармонический ряд"; action = "tab = 2; tabH.active = true; tabN.active = false" }
new UI { name = "b3"; type = button; label = "Прямая Ньютона"; action = "tab = 3; tabH.active = false; tabN.active = true" }

list px = (0, 0, 0, 0);
list py = (0, 0, 0, 0);
list cx = (0, 0, 0, 0);
list cy = (0, 0, 0, 0);
float sx = 0; float sy = 0; float ox = 0; float oy = 0;
string info = "";
float tab = 1; float keyc = -1; float needEF = 1;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Пересечение прямых (a1 a2) и (b1 b2); w = 0 — абсцисса, 1 — ордината; почти параллельные — далеко за полем.
Function xsg(ax, ay, bx, by, cx0, cy0, dx, dy, w) {
  float d1x = bx - ax; float d1y = by - ay;
  float d2x = dx - cx0; float d2y = dy - cy0;
  float den = d1x * d2y - d1y * d2x;
  float l = sqrt(d1x * d1x + d1y * d1y) * sqrt(d2x * d2x + d2y * d2y);
  if (abs(den) < 0.1 * l) { return 1000; }
  float t = ((cx0 - ax) * d2y - (cy0 - ay) * d2x) / den;
  if (w < 0.5) { return ax + t * d1x; }
  return ay + t * d1y;
}

// Координата вершины j при гипотетическом положении (x, y) вершины k.
// ox, oy — общий сдвиг остальных вершин (для переноса фигуры целиком, k = −1).
Function gx(k, x, j) { if (j == k) { return x; } return px[j] + ox; }
Function gy(k, y, j) { if (j == k) { return y; } return py[j] + oy; }
Function xs(k, x, y, a, b, c, d, w) {
  return xsg(gx(k, x, a), gy(k, y, a), gx(k, x, b), gy(k, y, b), gx(k, x, c), gy(k, y, c), gx(k, x, d), gy(k, y, d), w);
}

// Допустим ли четырёхугольник, если вершина k стоит в (x, y), остальные — в px/py: вершина в поле,
// выпуклость (обход против часовой стрелки), углы от ~12° до ~168°, стороны не короче 0,8;
// при needEF = 1 ещё и точки E = AB ∩ CD, F = BC ∩ DA внутри поля.
Function ok(k, x, y) {
  if (!inField(x, y)) { return false; }
  float good = 1;
  repeat (4) {
    float h = i - 1; if (h < 0) { h = 3; }
    float j = i + 1; if (j > 3) { j = 0; }
    float e1x = gx(k, x, i) - gx(k, x, h); float e1y = gy(k, y, i) - gy(k, y, h);
    float e2x = gx(k, x, j) - gx(k, x, i); float e2y = gy(k, y, j) - gy(k, y, i);
    float l1 = sqrt(e1x * e1x + e1y * e1y); float l2 = sqrt(e2x * e2x + e2y * e2y);
    if (l1 < 0.8 || l2 < 0.8) { good = 0; }
    if (good > 0.5) { if ((e1x * e2y - e1y * e2x) / (l1 * l2) < 0.2) { good = 0; } }
  }
  if (good > 0.5 && needEF > 0.5) {
    if (!inField(xs(k, x, y, 0, 1, 2, 3, 0), xs(k, x, y, 0, 1, 2, 3, 1))) { good = 0; }
    if (!inField(xs(k, x, y, 1, 2, 3, 0, 0), xs(k, x, y, 1, 2, 3, 0, 1))) { good = 0; }
  }
  return good > 0.5;
}

Function reach(k, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(k, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(k, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавное ограничение хода вершины k: допустимая часть хода, затем остаток по осям.
Function slide(k, x0, y0, nx, ny) {
  float t = reach(k, x0, y0, nx - x0, ny - y0);
  float qx = x0 + (nx - x0) * t; float qy = y0 + (ny - y0) * t;
  float rx = nx - qx; float ry = ny - qy;
  if (t < 1) {
    qx = qx + rx * reach(k, qx, qy, rx, 0);
    qy = qy + ry * reach(k, qx, qy, 0, ry);
  }
  sx = qx; sy = qy;
  return 0;
}

// Перенос фигуры целиком на (dx, dy): допустим ли он.
Function okT(dx, dy) {
  ox = dx; oy = dy;
  float r = 0;
  if (ok(-1, 0, 0)) { r = 1; }
  ox = 0; oy = 0;
  return r > 0.5;
}

Function reachT(x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okT(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okT(x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Function slideT(tx, ty) {
  float t = reachT(0, 0, tx, ty);
  float qx = tx * t; float qy = ty * t;
  float rx = tx - qx; float ry = ty - qy;
  if (t < 1) {
    qx = qx + rx * reachT(qx, qy, rx, 0);
    qy = qy + ry * reachT(qx, qy, 0, ry);
  }
  sx = qx; sy = qy;
  return 0;
}

Start {
  px[0] = A.pos.x; py[0] = A.pos.y; px[1] = B.pos.x; py[1] = B.pos.y;
  px[2] = C.pos.x; py[2] = C.pos.y; px[3] = D.pos.x; py[3] = D.pos.y;
}
// Ближайшая к (ex, ey) из точек (ax, ay), (bx, by): w = 0 — абсцисса, 1 — ордината.
Function near(ax, ay, bx, by, ex, ey, w) {
  float da = (ax - ex) * (ax - ex) + (ay - ey) * (ay - ey);
  float db = (bx - ex) * (bx - ex) + (by - ey) * (by - ey);
  if (da <= db) { if (w < 0.5) { return ax; } return ay; }
  if (w < 0.5) { return bx; } return by;
}
// Координата t точки (qx, qy) на прямой (ax, ay)–(bx, by): a — 0, b — 1.
Function par(ax, ay, bx, by, qx, qy) {
  return ((qx - ax) * (bx - ax) + (qy - ay) * (by - ay)) / ((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
}
// Двойное отношение (a, b; g, h) четырёх точек одной прямой.
Function cross4(ax, ay, bx, by, gx0, gy0, hx, hy) {
  float tg = par(ax, ay, bx, by, gx0, gy0); float th = par(ax, ay, bx, by, hx, hy);
  return tg * (th - 1) / ((tg - 1) * th);
}

Update {
  cx[0] = A.pos.x; cy[0] = A.pos.y; cx[1] = B.pos.x; cy[1] = B.pos.y;
  cx[2] = C.pos.x; cy[2] = C.pos.y; cx[3] = D.pos.x; cy[3] = D.pos.y;
  float m = 0; float k = 0;
  float shift = 0;
  repeat (4) {
    float dd = abs(cx[i] - px[i]) + abs(cy[i] - py[i]);
    if (dd > m + 0.000001) { m = dd; k = i; }
    shift = shift + abs((cx[i] - px[i]) - (cx[0] - px[0])) + abs((cy[i] - py[i]) - (cy[0] - py[0]));
  }
  if (m > 0.000001 && shift > 0.000001) {
    slide(k, px[k], py[k], cx[k], cy[k]);
    A.pos.x = px[0]; A.pos.y = py[0]; B.pos.x = px[1]; B.pos.y = py[1];
    C.pos.x = px[2]; C.pos.y = py[2]; D.pos.x = px[3]; D.pos.y = py[3];
    if (k == 0) { A.pos.x = sx; A.pos.y = sy; }
    if (k == 1) { B.pos.x = sx; B.pos.y = sy; }
    if (k == 2) { C.pos.x = sx; C.pos.y = sy; }
    if (k == 3) { D.pos.x = sx; D.pos.y = sy; }
  }
  if (m > 0.000001 && shift <= 0.000001) {
    // Перенос фигуры целиком: допустимая часть сдвига, остаток скользит по осям.
    slideT(cx[0] - px[0], cy[0] - py[0]);
    A.pos.x = px[0] + sx; A.pos.y = py[0] + sy; B.pos.x = px[1] + sx; B.pos.y = py[1] + sy;
    C.pos.x = px[2] + sx; C.pos.y = py[2] + sy; D.pos.x = px[3] + sx; D.pos.y = py[3] + sy;
  }
  cx[0] = A.pos.x; cy[0] = A.pos.y; cx[1] = B.pos.x; cy[1] = B.pos.y;
  cx[2] = C.pos.x; cy[2] = C.pos.y; cx[3] = D.pos.x; cy[3] = D.pos.y;
  float bad = 0;
  repeat (4) {
    if (!ok(i, cx[i], cy[i])) { bad = 1; }
  }
  if (bad > 0.5) {
    A.pos.x = px[0]; A.pos.y = py[0]; B.pos.x = px[1]; B.pos.y = py[1];
    C.pos.x = px[2]; C.pos.y = py[2]; D.pos.x = px[3]; D.pos.y = py[3];
  } else {
    repeat (4) { px[i] = cx[i]; py[i] = cy[i]; }
  }

  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y;
  float ccx = C.pos.x; float ccy = C.pos.y; float ddx = D.pos.x; float ddy = D.pos.y;
  float ex = xsg(ax, ay, bx, by, ccx, ccy, ddx, ddy, 0); float ey = xsg(ax, ay, bx, by, ccx, ccy, ddx, ddy, 1);
  float fx = xsg(bx, by, ccx, ccy, ddx, ddy, ax, ay, 0); float fy = xsg(bx, by, ccx, ccy, ddx, ddy, ax, ay, 1);
  float gx0 = xsg(ax, ay, ccx, ccy, bx, by, ddx, ddy, 0); float gy0 = xsg(ax, ay, ccx, ccy, bx, by, ddx, ddy, 1);
  float hx = xsg(ax, ay, ccx, ccy, ex, ey, fx, fy, 0); float hy = xsg(ax, ay, ccx, ccy, ex, ey, fx, fy, 1);
  float ix = xsg(bx, by, ddx, ddy, ex, ey, fx, fy, 0); float iy = xsg(bx, by, ddx, ddy, ex, ey, fx, fy, 1);
  float kx = (ax + ccx) / 2; float ky = (ay + ccy) / 2; float lx = (bx + ddx) / 2; float ly = (by + ddy) / 2;
  float nx = (ex + fx) / 2; float ny = (ey + fy) / 2;
  E.pos.x = ex; E.pos.y = ey; F.pos.x = fx; F.pos.y = fy;
  G.pos.x = gx0; G.pos.y = gy0; H.pos.x = hx; H.pos.y = hy; I.pos.x = ix; I.pos.y = iy;
  K.pos.x = kx; K.pos.y = ky; L.pos.x = lx; L.pos.y = ly; N.pos.x = nx; N.pos.y = ny;

  float kn = ax + 3 * ay + 5 * bx + 7 * by + 11 * ccx + 13 * ccy + 17 * ddx + 19 * ddy;
  if (abs(kn - keyc) > 0.000001) {
    gxe = newGraph();
    addNode(gxe, "e1", [near(A.pos.x, A.pos.y, B.pos.x, B.pos.y, E.pos.x, E.pos.y, 0), near(A.pos.x, A.pos.y, B.pos.x, B.pos.y, E.pos.x, E.pos.y, 1)]); addNode(gxe, "e2", [E.pos.x, E.pos.y]); addEdge(gxe, "e1", "e2");
    addNode(gxe, "e3", [near(C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y, 0), near(C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y, 1)]); addEdge(gxe, "e3", "e2");
    addNode(gxe, "f1", [near(B.pos.x, B.pos.y, C.pos.x, C.pos.y, F.pos.x, F.pos.y, 0), near(B.pos.x, B.pos.y, C.pos.x, C.pos.y, F.pos.x, F.pos.y, 1)]); addNode(gxe, "f2", [F.pos.x, F.pos.y]); addEdge(gxe, "f1", "f2");
    addNode(gxe, "f3", [near(D.pos.x, D.pos.y, A.pos.x, A.pos.y, F.pos.x, F.pos.y, 0), near(D.pos.x, D.pos.y, A.pos.x, A.pos.y, F.pos.x, F.pos.y, 1)]); addEdge(gxe, "f3", "f2");
    gnw = newGraph();
    float tn = par(kx, ky, lx, ly, nx, ny);
    float t0 = min(0, tn); float t1 = max(1, tn);
    addNode(gnw, "n1", [kx + t0 * (lx - kx), ky + t0 * (ly - ky)]); addNode(gnw, "n2", [kx + t1 * (lx - kx), ky + t1 * (ly - ky)]); addEdge(gnw, "n1", "n2");
    keyc = kn;
  }

  float dac = sqrt((ccx - ax) * (ccx - ax) + (ccy - ay) * (ccy - ay));
  float dbd = sqrt((ddx - bx) * (ddx - bx) + (ddy - by) * (ddy - by));
  float def = sqrt((fx - ex) * (fx - ex) + (fy - ey) * (fy - ey));
  info = "**Полный четырёхсторонник:** четыре прямые AB, BC, CD, DA общего положения пересекаются попарно в шести точках — A, B, C, D, E = AB ∩ CD и F = BC ∩ DA. На каждой прямой лежат три из них.\n\n**Три диагонали** соединяют пары точек, не лежащие на одной прямой: AC = " + format(dac, 2) + ", BD = " + format(dbd, 2) + ", EF = " + format(def, 2) + ".";
  if (tab == 2) {
    float c1 = cross4(ax, ay, ccx, ccy, gx0, gy0, hx, hy);
    float c2 = cross4(bx, by, ddx, ddy, gx0, gy0, ix, iy);
    float c3 = cross4(ex, ey, fx, fy, hx, hy, ix, iy);
    info = "**Диагональные точки:** G = AC ∩ BD, H = AC ∩ EF, I = BD ∩ EF — вершины треугольника, стороны которого лежат на трёх диагоналях (точки за краем поля не видны).\n\n**Гармонический ряд:** на каждой диагонали две вершины и две диагональные точки имеют двойное отношение −1: (A, C; G, H) = " + num(c1, 3) + ", (B, D; G, I) = " + num(c2, 3) + ", (E, F; H, I) = " + num(c3, 3) + ".";
  }
  if (tab == 3) {
    float dn = abs((lx - kx) * (ny - ky) - (ly - ky) * (nx - kx)) / sqrt((lx - kx) * (lx - kx) + (ly - ky) * (ly - ky));
    info = "**Прямая Ньютона:** середины трёх диагоналей — K (середина AC), L (середина BD) и N (середина EF) — лежат на одной прямой. Расстояние от N до прямой KL равно " + format(dn, 3) + ".\n\nKL = " + format(sqrt((lx - kx) * (lx - kx) + (ly - ky) * (ly - ky)), 2) + ", KN = " + format(sqrt((nx - kx) * (nx - kx) + (ny - ky) * (ny - ky)), 2) + ".";
  }
}
]
