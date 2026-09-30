[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Выпуклый четырёхугольник ABCD: все вершины перетаскиваются. P, Q, R, S — середины сторон
// AB, BC, CD, DA; бимедианы PR и QS; G — точка их пересечения. Выпуклость поддерживается в Update. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (7.5, 1.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1.5, 5); text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; text = true("P") }
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; text = true("Q") }
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; text = true("R") }
new Point { name = "S"; pos = (0, 0); dynamic = false; collision = false; text = true("S") }
new Line { name = "pr"; pos = (P, R); color = #3b82f6 }
new Line { name = "qs"; pos = (Q, S); color = #3b82f6 }
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("G") }

new Line { name = "pq"; pos = (P, Q); color = #f59e0b }
new Line { name = "qr"; pos = (Q, R); color = #f59e0b }
new Line { name = "rs"; pos = (R, S); color = #f59e0b }
new Line { name = "sp"; pos = (S, P); color = #f59e0b }
new Claster { name = "tabV"; elements = (pq, qr, rs, sp); active = false }

new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("K") }
new Point { name = "L"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("L") }
new Line { name = "ac"; pos = (A, C); color = #22c55e }
new Line { name = "bd"; pos = (B, D); color = #22c55e }
new Line { name = "kl"; pos = (K, L); color = #22c55e }
new Claster { name = "tabN"; elements = (K, L, ac, bd, kl); active = false }

new UI { name = "b1"; type = button; label = "Бимедианы"; action = "tab = 1; tabV.active = false; tabN.active = false" }
new UI { name = "b2"; type = button; label = "Параллелограмм Вариньона"; action = "tab = 2; tabV.active = true; tabN.active = false" }
new UI { name = "b3"; type = button; label = "Прямая Ньютона"; action = "tab = 3; tabV.active = false; tabN.active = true" }

float tab = 1;
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function len(x1, y1, x2, y2) { return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)); }

list px = (0, 0, 0, 0);
list py = (0, 0, 0, 0);
list cx = (0, 0, 0, 0);
list cy = (0, 0, 0, 0);
float sx = 0; float sy = 0;


Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Координата вершины j при гипотетическом положении (x, y) вершины k.
Function gx(k, x, j) { if (j == k) { return x; } return px[j]; }
Function gy(k, y, j) { if (j == k) { return y; } return py[j]; }

// Допустим ли четырёхугольник, если вершина k стоит в (x, y), остальные — в px/py:
// вершина в поле, все повороты обхода левые (выпуклость, обход против часовой стрелки),
// синус угла поворота ≥ 0,2 (углы от ~12° до ~168°) и стороны не короче 0,8.
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

Start {
  px[0] = A.pos.x; py[0] = A.pos.y; px[1] = B.pos.x; py[1] = B.pos.y;
  px[2] = C.pos.x; py[2] = C.pos.y; px[3] = D.pos.x; py[3] = D.pos.y;
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
    // Двигают одну вершину (с наибольшим смещением): обрезаем ход, остальные стоят.
    slide(k, px[k], py[k], cx[k], cy[k]);
    A.pos.x = px[0]; A.pos.y = py[0]; B.pos.x = px[1]; B.pos.y = py[1];
    C.pos.x = px[2]; C.pos.y = py[2]; D.pos.x = px[3]; D.pos.y = py[3];
    if (k == 0) { A.pos.x = sx; A.pos.y = sy; }
    if (k == 1) { B.pos.x = sx; B.pos.y = sy; }
    if (k == 2) { C.pos.x = sx; C.pos.y = sy; }
    if (k == 3) { D.pos.x = sx; D.pos.y = sy; }
  }
  // Страховка: не выпуклый четырёхугольник или вершина вне поля — прежнее положение.
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
  float pxx = (ax + bx) / 2; float pyy = (ay + by) / 2; float qx = (bx + ccx) / 2; float qy = (by + ccy) / 2;
  float rx = (ccx + ddx) / 2; float ry = (ccy + ddy) / 2; float sx2 = (ddx + ax) / 2; float sy2 = (ddy + ay) / 2;
  float mgx = (pxx + rx) / 2; float mgy = (pyy + ry) / 2;
  float kx = (ax + ccx) / 2; float ky = (ay + ccy) / 2; float lx = (bx + ddx) / 2; float ly = (by + ddy) / 2;
  P.pos.x = pxx; P.pos.y = pyy; Q.pos.x = qx; Q.pos.y = qy; R.pos.x = rx; R.pos.y = ry; S.pos.x = sx2; S.pos.y = sy2;
  G.pos.x = mgx; G.pos.y = mgy; K.pos.x = kx; K.pos.y = ky; L.pos.x = lx; L.pos.y = ly;
  float m1 = len(pxx, pyy, rx, ry); float m2 = len(qx, qy, sx2, sy2);
  // Точка пересечения QS с PR и центр масс вершин — те же G.
  float cmx = (ax + bx + ccx + ddx) / 4; float cmy = (ay + by + ccy + ddy) / 4;
  info = "**Бимедианы** — отрезки PR и QS, соединяющие середины противоположных сторон: P — середина AB, R — середина CD, Q — середина BC, S — середина DA. PR = " + format(m1, 2) + ", QS = " + format(m2, 2) + ".\n\n**Они пересекаются в точке G и делятся ею пополам:** PG = GR = " + format(m1 / 2, 2) + ", QG = GS = " + format(m2 / 2, 2) + ".\n\n**G — центр масс вершин:** G = (A + B + C + D)/4 = (" + num(cmx, 2) + "; " + num(cmy, 2) + ").";
  if (tab == 2) {
    float d1 = len(ax, ay, ccx, ccy); float d2 = len(bx, by, ddx, ddy);
    info = "**Теорема Вариньона:** середины сторон P, Q, R, S любого четырёхугольника — вершины параллелограмма PQRS. Его стороны параллельны диагоналям и вдвое короче их: PQ = " + format(len(pxx, pyy, qx, qy), 2) + " = AC/2 = " + format(d1 / 2, 2) + ", QR = " + format(len(qx, qy, rx, ry), 2) + " = BD/2 = " + format(d2 / 2, 2) + ".\n\n**Бимедианы PR и QS — диагонали этого параллелограмма,** поэтому точкой пересечения G делятся пополам.";
  }
  if (tab == 3) {
    info = "**Прямая Ньютона:** K — середина диагонали AC, L — середина диагонали BD. Бимедианы проходят через середины диагоналей, а G — середина отрезка KL: расстояние от G до середины KL равно " + format(len(mgx, mgy, (kx + lx) / 2, (ky + ly) / 2), 4) + ".\n\nKL = " + format(len(kx, ky, lx, ly), 2) + ".";
  }
}
]
