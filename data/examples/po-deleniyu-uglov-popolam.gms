[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Параллелограмм ABCD (та же схема удержания формы, что в parallelogram.gms).
// Диагональ AC делит углы при A и C. Когда AC — биссектриса угла A (то есть ∠DAC = ∠BAC),
// треугольник ABD... точнее треугольник DAC равнобедренный: AD = DC → все стороны равны. ----
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, 4); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Line { name = "ac"; pos = (A, C); interact = false }
new Angle { name = "angDAC"; lines = (da, ac) }
new Angle { name = "angBAC"; lines = (ac, ab) }
draw Angle { name = "arcDAC"; angle = "angDAC"; count = 1 }
draw Angle { name = "arcBAC"; angle = "angBAC"; count = 1 }

draw EquallySing { name = "eqAll"; edges = (ab, bc, cd, da); type = 1 }
new Claster { name = "clRh"; elements = (eqAll); active = false }
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }
new Claster { name = "clPar"; elements = (eqAbCd, eqBcDa); active = true }

float tab = 1; float isBis = 0;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y) || !inField(ax + bx - x, ay + by - y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.35 || lv < 0.35) { return false; }
  return abs(ux * vy - uy * vx) / (lu * lv) >= 0.26;
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
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pdx, pdy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    C.pos.x = pbx + pdx - sx; C.pos.y = pby + pdy - sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    D.pos.x = pax + pcx - sx; D.pos.y = pay + pcy - sy;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, pbx, pby, pdx, pdy);
    C.pos.x = sx; C.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    A.pos.x = pbx + pdx - sx; A.pos.y = pby + pdy - sy;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, pax, pay, pcx, pcy);
    D.pos.x = sx; D.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    B.pos.x = pax + pcx - sx; B.pos.y = pay + pcy - sy;
  }
  if (abs(A.pos.x + C.pos.x - B.pos.x - D.pos.x) + abs(A.pos.y + C.pos.y - B.pos.y - D.pos.y) > 0.0001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  isBis = 0; if (abs(angDAC.measure - angBAC.measure) < 1) { isBis = 1; }
  clRh.active = isBis > 0.5;
  clPar.active = isBis < 0.5;

  info = "**Признак ромба по делению угла пополам:** сейчас ∠DAC = " + format(angDAC.measure, 0) + "°, ∠BAC = " + format(angBAC.measure, 0) + "°. Если диагональ AC делит угол A пополам, накрест лежащие углы при секущей AC и параллельных AD, BC дают равенство ∠BAC = ∠BCA, треугольник ABC равнобедренный, AB = BC — смежные стороны равны, значит равны и все четыре стороны.\n\n";
  if (isBis > 0.5) { info = info + "**AC — биссектриса угла A: все стороны равны, это ромб.**"; } else { info = info + "Сейчас AC не делит угол A пополам — обычный параллелограмм, не ромб. Двигайте вершины, чтобы уравнять ∠DAC и ∠BAC."; }
}
]
