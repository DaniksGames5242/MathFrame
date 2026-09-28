[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Параллелограмм ABCD (схема удержания формы — parallelogram.gms). Две вкладки
// показывают два равносильных признака квадрата: смежные стороны равны и
// перпендикулярны; диагонали равны и перпендикулярны. ----
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, 4); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

draw EquallySing { name = "eqAll"; edges = (ab, bc, cd, da); type = 1 }
new Claster { name = "clSq"; elements = (eqAll); active = false }

// Вкладка 1: смежные стороны AB, BC равны и перпендикулярны
draw EquallySing { name = "eqAbBc"; edges = (ab, bc); type = 1 }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcB"; angle = "angB"; lock = isPerpB > 0.5 }
new Claster { name = "tabSides"; elements = (eqAbBc, arcB); active = true }

// Вкладка 2: диагонали равны и перпендикулярны
new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "ac"; pos = (A, C); interact = false; active = tab == 2 }
new Line { name = "bd"; pos = (B, D); interact = false; active = tab == 2 }
new Line { name = "oa"; pos = (O, A); active = false; interact = false }
new Line { name = "ob"; pos = (O, B); active = false; interact = false }
new Angle { name = "angO"; lines = (oa, ob) }
draw Angle { name = "arcO"; angle = "angO"; lock = isPerpO > 0.5 }
new Claster { name = "tabDiag"; elements = (O, ac, bd, arcO); active = false }

new UI { name = "btnSides"; type = button; label = "По сторонам"; action = "tab = 1; tabSides.active = true; tabDiag.active = false" }
new UI { name = "btnDiag"; type = button; label = "По диагоналям"; action = "tab = 2; tabSides.active = false; tabDiag.active = true" }

float tab = 1; float isSq = 0; float isPerpB = 0; float isPerpO = 0;
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

  isPerpB = 0; if (abs(angB.measure - 90) < 1) { isPerpB = 1; }
  isPerpO = 0; if (abs(angO.measure - 90) < 1) { isPerpO = 1; }
  isSq = 0; if (abs(ab.length - bc.length) < 0.03 && isPerpB > 0.5) { isSq = 1; }
  clSq.active = isSq > 0.5;

  if (tab == 1) {
    info = "**Признак квадрата по сторонам:** сейчас AB = " + format(ab.length, 2) + ", BC = " + format(bc.length, 2) + ", ∠B = " + format(angB.measure, 0) + "°. Равенство смежных сторон делает параллелограмм ромбом, а прямой угол между ними — прямоугольником; вместе — квадрат.\n\n";
    if (isSq > 0.5) { info = info + "**AB = BC и ∠B = 90° — это квадрат.**"; } else { info = info + "Сейчас условие не выполнено — обычный параллелограмм. Двигайте вершины, чтобы уравнять AB, BC и сделать угол B прямым."; }
  } else {
    info = "**Признак квадрата по диагоналям:** диагонали параллелограмма всегда делятся точкой O пополам. Сейчас AC = " + format(ac.length, 2) + ", BD = " + format(bd.length, 2) + ", угол между ними ∠AOB = " + format(angO.measure, 0) + "°. Равенство диагоналей даёт прямоугольник, их перпендикулярность — ромб; вместе — квадрат.\n\n";
    if (abs(ac.length - bd.length) < 0.05 && isPerpO > 0.5) { info = info + "**Диагонали равны и перпендикулярны — это квадрат.**"; } else { info = info + "Сейчас условие не выполнено — обычный параллелограмм."; }
  }
}
]
