[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Четыре прямые AB, BC, CD, DA (выпуклый четырёхугольник ABCD, все вершины перетаскиваются),
// E = AB ∩ CD, F = BC ∩ DA. Любые три прямые образуют треугольник; ортоцентры четырёх таких
// треугольников H₁…H₄ лежат на одной прямой. Ход вершины обрезается, если E или F ушли бы за поле. ----
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
draw Graph { name = "gX"; graph = "gxe"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }

new Point { name = "H1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("H₁") }
new Point { name = "H2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("H₂") }
new Point { name = "H3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("H₃") }
new Point { name = "H4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("H₄") }
draw Graph { name = "gG"; graph = "ggl"; edgeWidth = 3; edgeColor = #f59e0b; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gS"; graph = "gsl"; edgeWidth = 2; edgeColor = #3b82f6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }

new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("K") }
new Point { name = "L"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("L") }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("N") }
draw Graph { name = "gN"; graph = "gnw"; edgeWidth = 3; edgeColor = #22c55e; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
new Claster { name = "tabN"; elements = (K, L, N, gN); active = false }

new UI { name = "b1"; type = button; label = "Ортоцентры"; action = "tab = 1; tabN.active = false" }
new UI { name = "b2"; type = button; label = "Прямая Ньютона"; action = "tab = 2; tabN.active = true" }
new UI { name = "sSel"; type = slider; label = "треугольник"; variable = sel; min = 1; max = 4; step = 1; default = 1 }

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

float sel = 1;
// Ортоцентр треугольника (x1,y1)(x2,y2)(x3,y3): w = 0 — абсцисса, 1 — ордината.
Function orth(x1, y1, x2, y2, x3, y3, w) {
  float ux = x3 - x2; float uy = y3 - y2; float vx = x3 - x1; float vy = y3 - y1;
  float c1 = x1 * ux + y1 * uy; float c2 = x2 * vx + y2 * vy;
  float den = ux * vy - uy * vx;
  if (w < 0.5) { return (c1 * vy - uy * c2) / den; }
  return (ux * c2 - vx * c1) / den;
}
// Основание высоты из (px0, py0) на прямую (qx, qy)–(rx, ry).
Function foot(px0, py0, qx, qy, rx, ry, w) {
  float t = ((px0 - qx) * (rx - qx) + (py0 - qy) * (ry - qy)) / ((rx - qx) * (rx - qx) + (ry - qy) * (ry - qy));
  if (w < 0.5) { return qx + t * (rx - qx); }
  return qy + t * (ry - qy);
}
list ttx = (0, 0, 0);
list tty = (0, 0, 0);
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
  E.pos.x = ex; E.pos.y = ey; F.pos.x = fx; F.pos.y = fy;
  // Треугольники: 1 — B C E (прямые AB, BC, CD), 2 — C D F (BC, CD, DA), 3 — A D E (AB, CD, DA), 4 — A B F (AB, BC, DA).
  float h1x = orth(bx, by, ccx, ccy, ex, ey, 0); float h1y = orth(bx, by, ccx, ccy, ex, ey, 1);
  float h2x = orth(ccx, ccy, ddx, ddy, fx, fy, 0); float h2y = orth(ccx, ccy, ddx, ddy, fx, fy, 1);
  float h3x = orth(ax, ay, ddx, ddy, ex, ey, 0); float h3y = orth(ax, ay, ddx, ddy, ex, ey, 1);
  float h4x = orth(ax, ay, bx, by, fx, fy, 0); float h4y = orth(ax, ay, bx, by, fx, fy, 1);
  H1.pos.x = h1x; H1.pos.y = h1y; H2.pos.x = h2x; H2.pos.y = h2y;
  H3.pos.x = h3x; H3.pos.y = h3y; H4.pos.x = h4x; H4.pos.y = h4y;
  float kx = (ax + ccx) / 2; float ky = (ay + ccy) / 2; float lx = (bx + ddx) / 2; float ly = (by + ddy) / 2;
  float nx = (ex + fx) / 2; float ny = (ey + fy) / 2;
  K.pos.x = kx; K.pos.y = ky; L.pos.x = lx; L.pos.y = ly; N.pos.x = nx; N.pos.y = ny;

  // Прямая через ближайшую к H₁ и наиболее удалённую пары ортоцентров (концы — крайние точки).
  float dirx = h4x - h1x; float diry = h4y - h1y;
  float dl = sqrt(dirx * dirx + diry * diry);
  if (dl < 0.000001) { dirx = h2x - h1x; diry = h2y - h1y; dl = sqrt(dirx * dirx + diry * diry) + 0.000001; }
  dirx = dirx / dl; diry = diry / dl;
  float tmin = 0; float tmax = 0;
  float t2 = (h2x - h1x) * dirx + (h2y - h1y) * diry; float t3 = (h3x - h1x) * dirx + (h3y - h1y) * diry;
  float t4 = (h4x - h1x) * dirx + (h4y - h1y) * diry;
  tmin = min(0, min(t2, min(t3, t4))) - 1.5; tmax = max(0, max(t2, max(t3, t4))) + 1.5;
  float dev = abs((h2x - h1x) * diry - (h2y - h1y) * dirx);
  dev = max(dev, abs((h3x - h1x) * diry - (h3y - h1y) * dirx));

  float kn = ax + 3 * ay + 5 * bx + 7 * by + 11 * ccx + 13 * ccy + 17 * ddx + 19 * ddy + 23 * sel;
  if (abs(kn - keyc) > 0.000001) {
    gxe = newGraph();
    addNode(gxe, "e1", [near(A.pos.x, A.pos.y, B.pos.x, B.pos.y, E.pos.x, E.pos.y, 0), near(A.pos.x, A.pos.y, B.pos.x, B.pos.y, E.pos.x, E.pos.y, 1)]); addNode(gxe, "e2", [E.pos.x, E.pos.y]); addEdge(gxe, "e1", "e2");
    addNode(gxe, "e3", [near(C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y, 0), near(C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y, 1)]); addEdge(gxe, "e3", "e2");
    addNode(gxe, "f1", [near(B.pos.x, B.pos.y, C.pos.x, C.pos.y, F.pos.x, F.pos.y, 0), near(B.pos.x, B.pos.y, C.pos.x, C.pos.y, F.pos.x, F.pos.y, 1)]); addNode(gxe, "f2", [F.pos.x, F.pos.y]); addEdge(gxe, "f1", "f2");
    addNode(gxe, "f3", [near(D.pos.x, D.pos.y, A.pos.x, A.pos.y, F.pos.x, F.pos.y, 0), near(D.pos.x, D.pos.y, A.pos.x, A.pos.y, F.pos.x, F.pos.y, 1)]); addEdge(gxe, "f3", "f2");
    ggl = newGraph();
    addNode(ggl, "g1", [h1x + tmin * dirx, h1y + tmin * diry]); addNode(ggl, "g2", [h1x + tmax * dirx, h1y + tmax * diry]); addEdge(ggl, "g1", "g2");
    gnw = newGraph();
    float tn = par(kx, ky, lx, ly, nx, ny);
    float n0 = min(0, tn); float n1 = max(1, tn);
    addNode(gnw, "n1", [kx + n0 * (lx - kx), ky + n0 * (ly - ky)]); addNode(gnw, "n2", [kx + n1 * (lx - kx), ky + n1 * (ly - ky)]); addEdge(gnw, "n1", "n2");
    // Высоты выбранного треугольника: из каждой вершины до основания на противоположной стороне.
    if (sel < 1.5) { ttx[0] = bx; tty[0] = by; ttx[1] = ccx; tty[1] = ccy; ttx[2] = ex; tty[2] = ey; }
    if (sel > 1.5 && sel < 2.5) { ttx[0] = ccx; tty[0] = ccy; ttx[1] = ddx; tty[1] = ddy; ttx[2] = fx; tty[2] = fy; }
    if (sel > 2.5 && sel < 3.5) { ttx[0] = ax; tty[0] = ay; ttx[1] = ddx; tty[1] = ddy; ttx[2] = ex; tty[2] = ey; }
    if (sel > 3.5) { ttx[0] = ax; tty[0] = ay; ttx[1] = bx; tty[1] = by; ttx[2] = fx; tty[2] = fy; }
    gsl = newGraph();
    repeat (3) {
      float j1 = i + 1; if (j1 > 2) { j1 = j1 - 3; }
      float j2 = i + 2; if (j2 > 2) { j2 = j2 - 3; }
      addNode(gsl, "v" + i, [ttx[i], tty[i]]);
      addNode(gsl, "w" + i, [foot(ttx[i], tty[i], ttx[j1], tty[j1], ttx[j2], tty[j2], 0), foot(ttx[i], tty[i], ttx[j1], tty[j1], ttx[j2], tty[j2], 1)]);
      addEdge(gsl, "v" + i, "w" + i);
    }
    keyc = kn;
  }

  info = "**Прямая Гаусса — Боденмиллера.** Четыре прямые AB, BC, CD, DA попарно образуют четыре треугольника: H₁ — ортоцентр треугольника BCE (прямые AB, BC, CD), H₂ — CDF (BC, CD, DA), H₃ — ADE (AB, CD, DA), H₄ — ABF (AB, BC, DA).\n\n**Ортоцентры лежат на одной прямой:** отклонение H₂ и H₃ от прямой H₁H₄ — " + format(dev, 4) + ". Синим показаны высоты треугольника " + format(sel, 0) + " (точки за краем поля не видны).";
  if (tab == 2) {
    float ang = abs(dirx * (lx - kx) + diry * (ly - ky)) / sqrt((lx - kx) * (lx - kx) + (ly - ky) * (ly - ky));
    info = "**Прямая Ньютона** KLN проходит через середины диагоналей AC, BD и EF. Прямая Гаусса — Боденмиллера H₁H₂H₃H₄ ей перпендикулярна: косинус угла между ними равен " + format(ang, 4) + ".";
  }
}
]
