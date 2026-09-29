[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Выпуклый четырёхугольник ABCD: все вершины свободно перетаскиваются, ход
// отменяется только если четырёхугольник перестал бы быть выпуклым или вершины
// слиплись (плавно: вершина скользит вдоль ограничения). Условие описанности —
// AB + CD = BC + DA. Когда суммы противоположных сторон почти равны (разность < 0.3),
// вершина «прилипает» к положению, где они равны в точности, и появляется вписанная
// окружность. ----
new Point { name = "A"; pos = (-4.5, -2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 1.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1, 4.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// Вписанная окружность (центр — вспомогательная невидимая точка) и точки касания.
new Point { name = "Ic"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "inc"; center = Ic; radius = rin; active = fit > 0.5 }
new Point { name = "K1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = fit > 0.5 }
new Point { name = "K2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = fit > 0.5 }
new Point { name = "K3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = fit > 0.5 }
new Point { name = "K4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = fit > 0.5 }

// ---- Логика ----
string info = "";
float rin = 1; float fit = 0;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;
float fx0 = 0; float fy0 = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Разность сумм противоположных сторон для обхода V → n → o → p:
// |Vn| + |op| − |no| − |pV| (для A это AB + CD − BC − DA, для остальных — то же со знаком).
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Function dist(x1, y1, x2, y2) { return sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); }
Function fq(x, y, nx, ny, ox, oy, px, py) {
  return dist(x, y, nx, ny) + dist(ox, oy, px, py) - dist(nx, ny, ox, oy) - dist(px, py, x, y);
}

// Допустимо ли положение (x, y) вершины V при остальных вершинах n, o, p (в порядке
// обхода V → n → o → p): выпуклость с углами от 15° до 165° (sin ≥ 0.26), стороны ≥ 1.
Function ok(x, y, nx, ny, ox, oy, px, py) {
  if (!inField(x, y)) { return false; }
  float e1x = nx - x; float e1y = ny - y;
  float e2x = ox - nx; float e2y = oy - ny;
  float e3x = px - ox; float e3y = py - oy;
  float e4x = x - px; float e4y = y - py;
  float l1 = sqrt(e1x * e1x + e1y * e1y); float l2 = sqrt(e2x * e2x + e2y * e2y);
  float l3 = sqrt(e3x * e3x + e3y * e3y); float l4 = sqrt(e4x * e4x + e4y * e4y);
  if (l1 < 1 || l2 < 1 || l3 < 1 || l4 < 1) { return false; }
  if ((e1x * e2y - e1y * e2x) / (l1 * l2) < 0.26) { return false; }
  if ((e2x * e3y - e2y * e3x) / (l2 * l3) < 0.26) { return false; }
  if ((e3x * e4y - e3y * e4x) / (l3 * l4) < 0.26) { return false; }
  return (e4x * e1y - e4y * e1x) / (l4 * l1) >= 0.26;
}

Function reach(x0, y0, dx, dy, nx, ny, ox, oy, px, py) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, nx, ny, ox, oy, px, py)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, nx, ny, ox, oy, px, py)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавный ход вершины из (px0, py0) в (nx0, ny0); затем «прилипание» к окружности через
// остальные три вершины (если ближе 0.2 и положение допустимо). Результат — в (sx, sy).
Function slide(qx, qy, wx, wy, nx, ny, ox, oy, px, py) {
  float t = reach(qx, qy, wx - qx, wy - qy, nx, ny, ox, oy, px, py);
  float cx = qx + (wx - qx) * t; float cy = qy + (wy - qy) * t;
  float rx = wx - cx; float ry = wy - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, nx, ny, ox, oy, px, py);
    cy = cy + ry * reach(cx, cy, 0, ry, nx, ny, ox, oy, px, py);
  }
  if (abs(fq(cx, cy, nx, ny, ox, oy, px, py)) < 0.3) {
    float tx = cx; float ty = cy;
    repeat (4) {
      float f1 = fq(tx, ty, nx, ny, ox, oy, px, py);
      float gx = (fq(tx + 0.0001, ty, nx, ny, ox, oy, px, py) - f1) / 0.0001;
      float gy = (fq(tx, ty + 0.0001, nx, ny, ox, oy, px, py) - f1) / 0.0001;
      float gg = gx * gx + gy * gy;
      if (gg > 0.000001) { tx = tx - f1 * gx / gg; ty = ty - f1 * gy / gg; }
    }
    if (abs(fq(tx, ty, nx, ny, ox, oy, px, py)) < 0.001 && dist(tx, ty, cx, cy) < 0.6 && ok(tx, ty, nx, ny, ox, oy, px, py)) { cx = tx; cy = ty; }
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  // Перенос фигуры целиком (все вершины сдвинуты на один вектор) — границу поля держит движок.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy, pdx, pdy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pcx, pcy, pdx, pdy, pax, pay);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, pdx, pdy, pax, pay, pbx, pby);
    C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, pax, pay, pbx, pby, pcx, pcy);
    D.pos.x = sx; D.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  // Страховка: не выпуклый или вышедший из поля кадр откатывается целиком.
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y)
      || !ok(B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y, A.pos.x, A.pos.y)
      || !ok(C.pos.x, C.pos.y, D.pos.x, D.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y)
      || !ok(D.pos.x, D.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  float sAB = ab.length + cd.length; float sBC = bc.length + da.length;
  float per = sAB + sBC;
  float area = abs((pcx - pax) * (pdy - pby) - (pcy - pay) * (pdx - pbx)) / 2;
  fit = 0;
  if (abs(sAB - sBC) < 0.01) {
    fit = 1;
    // Центр вписанной окружности — пересечение биссектрис углов A и B.
    float ux = (pbx - pax) / ab.length; float uy = (pby - pay) / ab.length;
    float vx = (pdx - pax) / da.length; float vy = (pdy - pay) / da.length;
    float wx = (pax - pbx) / ab.length; float wy = (pay - pby) / ab.length;
    float zx = (pcx - pbx) / bc.length; float zy = (pcy - pby) / bc.length;
    float d1x = ux + vx; float d1y = uy + vy; float d2x = wx + zx; float d2y = wy + zy;
    float s = ((pbx - pax) * d2y - (pby - pay) * d2x) / (d1x * d2y - d1y * d2x);
    float ix = pax + d1x * s; float iy = pay + d1y * s;
    Ic.pos.x = ix; Ic.pos.y = iy;
    rin = abs(ux * (iy - pay) - uy * (ix - pax));
    float k1 = ux * (ix - pax) + uy * (iy - pay);
    K1.pos.x = pax + ux * k1; K1.pos.y = pay + uy * k1;
    float bx2 = (pcx - pbx) / bc.length; float by2 = (pcy - pby) / bc.length;
    float k2 = bx2 * (ix - pbx) + by2 * (iy - pby);
    K2.pos.x = pbx + bx2 * k2; K2.pos.y = pby + by2 * k2;
    float cx2 = (pdx - pcx) / cd.length; float cy2 = (pdy - pcy) / cd.length;
    float k3 = cx2 * (ix - pcx) + cy2 * (iy - pcy);
    K3.pos.x = pcx + cx2 * k3; K3.pos.y = pcy + cy2 * k3;
    float dx2 = (pax - pdx) / da.length; float dy2 = (pay - pdy) / da.length;
    float k4 = dx2 * (ix - pdx) + dy2 * (iy - pdy);
    K4.pos.x = pdx + dx2 * k4; K4.pos.y = pdy + dy2 * k4;
  }
  string verdict = "**Условие не выполнено:** разность сумм " + num(sAB - sBC, 2) + ", вписать окружность, касающуюся всех четырёх сторон, нельзя.";
  string extra = "";
  if (fit > 0.5) {
    verdict = "**Условие выполнено:** в четырёхугольник можно вписать окружность.";
    extra = "\n\n**Радиус и площадь:** p = " + format(per / 2, 2) + ", r = " + format(rin, 2) + ", S = p · r = " + format(per / 2, 2) + " · " + format(rin, 2) + " = " + format(per / 2 * rin, 2) + " — совпадает с площадью четырёхугольника " + format(area, 2) + ".";
  }
  info = "**Условие описанности — суммы противоположных сторон равны:** AB + CD = " + format(ab.length, 2) + " + " + format(cd.length, 2) + " = " + format(sAB, 2) + ", BC + DA = " + format(bc.length, 2) + " + " + format(da.length, 2) + " = " + format(sBC, 2) + ". " + verdict
    + extra;
}
]
