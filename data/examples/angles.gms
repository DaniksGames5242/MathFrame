[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Вкладка 1: углы треугольника — сумма внутренних и внешний угол при C. Все вершины
// свободны; невырожденность и то, чтобы отрезок продолжения CE помещался в поле, держит ok(). ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 3.2); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }
new Point { name = "E"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ce"; pos = (C, E); interact = false }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
new Angle { name = "angE"; lines = (ce, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcE"; angle = "angE"; color = #f59e0b; radius = 1.5 }
new Claster { name = "tab1"; elements = (A, B, C, ab, bc, ca, abc, E, ce, arcA, arcB, arcC, arcE); active = true }

// ---- Вкладка 2: вписанный и центральный углы на одной дуге ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; interact = false; text = true("O") }
new Circle { name = "w"; center = O; radius = 4.5; interact = false }
new Point { name = "P"; circle = "w"; t = 0.12; text = true("P"); pauseOnDrag = false }
new Point { name = "Q"; circle = "w"; t = 0.42; text = true("Q"); pauseOnDrag = false }
new Point { name = "R"; circle = "w"; t = 0.78; text = true("R"); pauseOnDrag = false }
new Line { name = "op"; pos = (O, P); interact = false }
new Line { name = "oq"; pos = (O, Q); interact = false }
new Line { name = "rp"; pos = (R, P); interact = false }
new Line { name = "rq"; pos = (R, Q); interact = false }
new Angle { name = "angO"; lines = (op, oq) }
new Angle { name = "angR"; lines = (rp, rq) }
draw Angle { name = "arcO"; angle = "angO"; color = #f59e0b }
draw Angle { name = "arcR"; angle = "angR"; color = #3b82f6 }
new Claster { name = "tab2"; elements = (O, w, P, Q, R, op, oq, rp, rq, arcO, arcR); active = false }

// ---- Вкладка 3: две пересекающиеся прямые — вертикальные и смежные углы ----
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; interact = false; text = true("X") }
new Circle { name = "wx"; center = X; radius = 4; active = false }
new Point { name = "U"; circle = "wx"; t = 0.08; text = true("U"); pauseOnDrag = false }
new Point { name = "V"; circle = "wx"; t = 0.3; text = true("V"); pauseOnDrag = false }
new Point { name = "Up"; pos = (0, 0); dynamic = false; collision = false; text = true("U'") }
new Point { name = "Vp"; pos = (0, 0); dynamic = false; collision = false; text = true("V'") }
new Line { name = "xu"; pos = (X, U); interact = false }
new Line { name = "xv"; pos = (X, V); interact = false }
new Line { name = "xup"; pos = (X, Up); interact = false }
new Line { name = "xvp"; pos = (X, Vp); interact = false }
new Angle { name = "a1"; lines = (xu, xv) }
new Angle { name = "a2"; lines = (xv, xup) }
new Angle { name = "a3"; lines = (xup, xvp) }
new Angle { name = "a4"; lines = (xvp, xu) }
draw Angle { name = "r1"; angle = "a1"; color = #3b82f6 }
draw Angle { name = "r2"; angle = "a2"; count = 2; radius = 1.5 }
draw Angle { name = "r3"; angle = "a3"; color = #3b82f6 }
draw Angle { name = "r4"; angle = "a4"; count = 2; radius = 1.5 }
new Claster { name = "tab3"; elements = (X, wx, U, V, Up, Vp, xu, xv, xup, xvp, r1, r2, r3, r4); active = false }

new UI { name = "btn1"; type = button; label = "Углы треугольника"; action = "tab = 1; tab1.active = true; tab2.active = false; tab3.active = false" }
new UI { name = "btn2"; type = button; label = "Вписанный и центральный"; action = "tab = 2; tab1.active = false; tab2.active = true; tab3.active = false" }
new UI { name = "btn3"; type = button; label = "Вертикальные и смежные"; action = "tab = 3; tab1.active = false; tab2.active = false; tab3.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float puT = 0.08; float pvT = 0.3;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли положение (x, y) двигаемой вершины треугольника (who: 0 — A, 1 — B, 2 — C) при двух
// других (o1, o2; для B это A и C, для C — A и B). Вершины в поле, стороны не короче 0.9,
// треугольник не слишком плоский, продолжение стороны BC за C (длина 1.4) остаётся в поле.
Function ok(x, y, o1x, o1y, o2x, o2y, who) {
  if (!inField(x, y)) { return false; }
  float d1 = sqrt((x - o1x) * (x - o1x) + (y - o1y) * (y - o1y));
  float d2 = sqrt((x - o2x) * (x - o2x) + (y - o2y) * (y - o2y));
  if (d1 < 0.9 || d2 < 0.9) { return false; }
  if (abs((o2x - o1x) * (y - o1y) - (o2y - o1y) * (x - o1x)) < 1.5) { return false; }
  if (who == 1) {
    float l = sqrt((o2x - x) * (o2x - x) + (o2y - y) * (o2y - y));
    return inField(o2x + (o2x - x) / l * 1.4, o2y + (o2y - y) / l * 1.4);
  }
  if (who == 2) {
    return inField(x + (x - o2x) / d2 * 1.4, y + (y - o2y) / d2 * 1.4);
  }
  return true;
}

Function reach(x0, y0, dx, dy, o1x, o1y, o2x, o2y, who) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, o1x, o1y, o2x, o2y, who)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, o1x, o1y, o2x, o2y, who)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Function slide(px, py, nx, ny, o1x, o1y, o2x, o2y, who) {
  float t = reach(px, py, nx - px, ny - py, o1x, o1y, o2x, o2y, who);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, o1x, o1y, o2x, o2y, who);
    cy = cy + ry * reach(cx, cy, 0, ry, o1x, o1y, o2x, o2y, who);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  // ---- треугольник (вкладка 1) ----
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (m >= 0.000001 && shift >= 0.000001) {
    if (mA == m) {
      slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy, 0);
      A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    } else if (mB == m) {
      slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy, 1);
      B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    } else {
      slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby, 2);
      C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    }
  }
  float bcl = bc.length;
  float ex = C.pos.x + (C.pos.x - B.pos.x) / bcl * 1.4; float ey = C.pos.y + (C.pos.y - B.pos.y) / bcl * 1.4;
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(ex, ey)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    ex = pcx + (pcx - pbx) / bcl * 1.4; ey = pcy + (pcy - pby) / bcl * 1.4;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
  E.pos.x = ex; E.pos.y = ey;

  // Центры O и X неподвижны: если за угол (его дугу) потянули вершину, возвращаем её на место.
  if (abs(O.pos.x) + abs(O.pos.y) > 0.000001) { O.pos.x = 0; O.pos.y = 0; }
  if (abs(X.pos.x) + abs(X.pos.y) > 0.000001) { X.pos.x = 0; X.pos.y = 0; }

  // ---- пересекающиеся прямые (вкладка 3): U' и V' — противоположные концы; лучи не должны
  // сливаться (угол между прямыми не меньше ~10°), иначе ход отменяется ----
  float cr = (U.pos.x * V.pos.y - U.pos.y * V.pos.x) / 16;
  if (abs(cr) < 0.17) { U.t = puT; V.t = pvT; }
  puT = U.t; pvT = V.t;
  Up.pos.x = -U.pos.x; Up.pos.y = -U.pos.y; Vp.pos.x = -V.pos.x; Vp.pos.y = -V.pos.y;

  if (tab == 1) {
    info = "**Сумма внутренних углов треугольника равна 180°:** ∠A + ∠B + ∠C = " + format(angA.measure, 1) + "° + " + format(angB.measure, 1) + "° + " + format(angC.measure, 1) + "° = " + format(angA.measure + angB.measure + angC.measure, 0) + "°.\n\n**Внешний угол равен сумме двух несмежных внутренних:** внешний угол при C = " + format(angE.measure, 1) + "° = ∠A + ∠B = " + format(angA.measure + angB.measure, 1) + "°; вместе с ∠C он даёт развёрнутый угол: " + format(angE.measure + angC.measure, 0) + "°.";
  } else if (tab == 2) {
    float ins = angR.measure; float cen = angO.measure;
    string cline = "**Центральный угол** ∠POQ = " + format(cen, 1) + "°.";
    if (abs(cen - 2 * ins) > 0.5) { cline = "**Дуга PQ, не содержащая R, больше полуокружности:** центральный угол на неё — 360° − ∠POQ = " + format(360 - cen, 1) + "°."; }
    info = "**Вписанный угол измеряется половиной дуги, на которую опирается:** ∠PRQ = " + format(ins, 1) + "°, дуга PQ (не содержащая R) = " + format(2 * ins, 1) + "°.\n\n" + cline + " Он вдвое больше вписанного: 2·∠PRQ = " + format(2 * ins, 1) + "°.";
    if (abs(cen - 180) < 1) { info = info + "\n\n**PQ — диаметр:** вписанный угол, опирающийся на диаметр, прямой."; }
  } else {
    info = "**Вертикальные углы равны:** ∠UXV = ∠U'XV' = " + format(a1.measure, 1) + "°, ∠VXU' = ∠V'XU = " + format(a2.measure, 1) + "°.\n\n**Смежные углы в сумме дают 180°:** ∠UXV + ∠VXU' = " + format(a1.measure, 1) + "° + " + format(a2.measure, 1) + "° = " + format(a1.measure + a2.measure, 0) + "°.";
  }
}
]
