[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Выпуклый четырёхугольник ABCD: все вершины перетаскиваются. Стороны a = AB, b = BC,
// c = CD, d = DA; противоположные углы α при B (между a и b) и γ при D (между c и d).
// Выпуклость поддерживается в Update: недопустимый ход вершины обрезается и скользит. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, 4.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcB"; angle = "angB"; color = #3b82f6 }
draw Angle { name = "arcD"; angle = "angD"; color = #f59e0b }

draw Text { name = "ta"; pos = (tax, tay); text = "a"; size = 0.9 }
draw Text { name = "tb"; pos = (tbx, tby); text = "b"; size = 0.9 }
draw Text { name = "tc"; pos = (tcx, tcy); text = "c"; size = 0.9 }
draw Text { name = "td"; pos = (tdx, tdy); text = "d"; size = 0.9 }

float tax = 0; float tay = 0; float tbx = 0; float tby = 0;
float tcx = 0; float tcy = 0; float tdx = 0; float tdy = 0;
list px = (0, 0, 0, 0);
list py = (0, 0, 0, 0);
list cx = (0, 0, 0, 0);
list cy = (0, 0, 0, 0);
float sx = 0; float sy = 0;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

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

  float a = ab.length; float b = bc.length; float c = cd.length; float d = da.length;
  float p = (a + b + c + d) / 2;
  float ux = A.pos.x - B.pos.x; float uy = A.pos.y - B.pos.y;
  float vx = C.pos.x - B.pos.x; float vy = C.pos.y - B.pos.y;
  float al = acos((ux * vx + uy * vy) / (a * b));
  float wx = C.pos.x - D.pos.x; float wy = C.pos.y - D.pos.y;
  float zx = A.pos.x - D.pos.x; float zy = A.pos.y - D.pos.y;
  float ga = acos((wx * zx + wy * zy) / (c * d));
  float cs = cos((al + ga) / 2);
  float pr = (p - a) * (p - b) * (p - c) * (p - d);
  float sub = a * b * c * d * cs * cs;
  float S = sqrt(max(pr - sub, 0));
  float S2 = abs((C.pos.x - A.pos.x) * (D.pos.y - B.pos.y) - (C.pos.y - A.pos.y) * (D.pos.x - B.pos.x)) / 2;
  float sumDeg = (al + ga) * 180 / pi;

  tax = (A.pos.x + B.pos.x) / 2; tay = (A.pos.y + B.pos.y) / 2 - 0.6;
  tbx = (B.pos.x + C.pos.x) / 2 + 0.6; tby = (B.pos.y + C.pos.y) / 2;
  tcx = (C.pos.x + D.pos.x) / 2; tcy = (C.pos.y + D.pos.y) / 2 + 0.6;
  tdx = (D.pos.x + A.pos.x) / 2 - 0.6; tdy = (D.pos.y + A.pos.y) / 2;

  string tail = "";
  if (abs(sumDeg - 180) < 0.5) {
    tail = "α + γ = 180°: cos = 0, вычитаемое равно нулю, четырёхугольник вписанный, формула переходит в формулу Брахмагупты.";
  } else {
    tail = "α + γ = " + format(sumDeg, 1) + "° ≠ 180°: вычитаемое положительно, площадь меньше, чем у вписанного четырёхугольника с теми же сторонами (" + format(sqrt(pr), 2) + ").";
  }
  info = "**Стороны:** a = AB = " + format(a, 2) + ", b = BC = " + format(b, 2) + ", c = CD = " + format(c, 2) + ", d = DA = " + format(d, 2) + "; полупериметр p = " + format(p, 2) + ".\n\n**Противоположные углы:** α = ∠B = " + format(al * 180 / pi, 1) + "°, γ = ∠D = " + format(ga * 180 / pi, 1) + "°, cos²((α + γ)/2) = " + format(cs * cs, 3) + ".\n\n**Формула Бретшнайдера:** S = √((p − a)(p − b)(p − c)(p − d) − abcd · cos²((α + γ)/2)) = √(" + format(pr, 2) + " − " + format(sub, 2) + ") = " + format(S, 2) + ".\n\n" + tail + "\n\n**Проверка по диагоналям:** S = ½ · AC · BD · sin φ = " + format(S2, 2) + ".";
}
]
