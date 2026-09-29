[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Выпуклый четырёхугольник ABCD: все вершины свободно перетаскиваются, ход
// отменяется только если четырёхугольник перестал бы быть выпуклым или вершины
// слиплись (плавно: вершина скользит вдоль ограничения). Окружность проведена через
// A, B, C — лежит ли на ней D, и есть условие вписанности. Когда вершина подходит к
// окружности по остальным трём ближе чем на 0.2, она «прилипает» к ней. ----
new Point { name = "A"; pos = (-4.5, -2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 1.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1, 4.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD"; count = 2 }

// Диагонали и точка P их пересечения.
new Line { name = "ac"; pos = (A, C); interact = false }
new Line { name = "bd"; pos = (B, D); interact = false }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; text = true("P") }

// Окружность через A, B, C (центр — вспомогательная невидимая точка).
new Point { name = "Oc"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "circ"; center = Oc; radius = rc; active = showC > 0.5 }

// ---- Логика ----
string info = "";
float rc = 5; float showC = 1;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;
float ccx = 0; float ccy = 0; float ccr = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Центр (ccx, ccy) и радиус ccr окружности через три точки; ccr = 1e6 для трёх точек на прямой.
Function circ3(x1, y1, x2, y2, x3, y3) {
  float d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (abs(d) < 0.000001) { ccx = 0; ccy = 0; ccr = 1000000; return 0; }
  float s1 = x1 * x1 + y1 * y1; float s2 = x2 * x2 + y2 * y2; float s3 = x3 * x3 + y3 * y3;
  ccx = (s1 * (y2 - y3) + s2 * (y3 - y1) + s3 * (y1 - y2)) / d;
  ccy = (s1 * (x3 - x2) + s2 * (x1 - x3) + s3 * (x2 - x1)) / d;
  ccr = sqrt((x1 - ccx) * (x1 - ccx) + (y1 - ccy) * (y1 - ccy));
  return 0;
}

// Расстояние от точки (x, y) до окружности через три остальные вершины (со знаком).
Function offc(x, y, nx, ny, ox, oy, px, py) {
  circ3(nx, ny, ox, oy, px, py);
  return sqrt((x - ccx) * (x - ccx) + (y - ccy) * (y - ccy)) - ccr;
}

// Угол в градусах при вершине q между лучами qp и qr.
Function ang3(px, py, qx, qy, rx, ry) {
  float ux = px - qx; float uy = py - qy; float vx = rx - qx; float vy = ry - qy;
  return abs(atan2(ux * vy - uy * vx, ux * vx + uy * vy)) * 180 / pi;
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
  circ3(nx, ny, ox, oy, px, py);
  float dd = sqrt((cx - ccx) * (cx - ccx) + (cy - ccy) * (cy - ccy));
  if (abs(dd - ccr) < 0.2 && dd > 0.000001) {
    float k = ccr / dd;
    float tx = ccx + (cx - ccx) * k; float ty = ccy + (cy - ccy) * k;
    if (ok(tx, ty, nx, ny, ox, oy, px, py)) { cx = tx; cy = ty; }
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

  circ3(pax, pay, pbx, pby, pcx, pcy);
  Oc.pos.x = ccx; Oc.pos.y = ccy; rc = ccr;
  showC = 0; if (ccr < 12) { showC = 1; }

  float sAC = angA.measure + angC.measure; float sBD = angB.measure + angD.measure;
  float abd = ang3(pax, pay, pbx, pby, pdx, pdy); float acd = ang3(pax, pay, pcx, pcy, pdx, pdy);
  // Точка пересечения диагоналей AC и BD.
  float ex = pcx - pax; float ey = pcy - pay; float fx = pdx - pbx; float fy = pdy - pby;
  float u = ((pbx - pax) * fy - (pby - pay) * fx) / (ex * fy - ey * fx);
  float qx = pax + ex * u; float qy = pay + ey * u;
  P.pos.x = qx; P.pos.y = qy;
  float pa = sqrt((qx - pax) * (qx - pax) + (qy - pay) * (qy - pay)); float pc = sqrt((qx - pcx) * (qx - pcx) + (qy - pcy) * (qy - pcy));
  float pb = sqrt((qx - pbx) * (qx - pbx) + (qy - pby) * (qy - pby)); float pd = sqrt((qx - pdx) * (qx - pdx) + (qy - pdy) * (qy - pdy));
  float dAC = sqrt(ex * ex + ey * ey); float dBD = sqrt(fx * fx + fy * fy);
  float ptol = ab.length * cd.length + bc.length * da.length;
  string verdict = "**Вписанный:** все четыре вершины лежат на одной окружности.";
  if (abs(sAC - 180) > 0.3) { verdict = "**Не вписанный:** окружность через A, B, C не проходит через D."; }
  info = "**Условие вписанности — сумма противоположных углов равна 180°:** ∠A + ∠C = " + format(sAC, 1) + "°, ∠B + ∠D = " + format(sBD, 1) + "°. " + verdict
    + "\n\n**Равносильно:** сторона AD видна из вершин B и C под одним углом — ∠ABD = " + format(abd, 1) + "°, ∠ACD = " + format(acd, 1) + "°."
    + "\n\n**И равносильно:** произведения отрезков диагоналей равны — PA · PC = " + format(pa * pc, 2) + ", PB · PD = " + format(pb * pd, 2) + " (P — точка пересечения диагоналей)."
    + "\n\n**Теорема Птолемея:** AC · BD = " + format(dAC * dBD, 2) + ", AB · CD + BC · DA = " + format(ptol, 2) + "; равенство выполняется только у вписанного четырёхугольника, у остальных AC · BD меньше.";
}
]
