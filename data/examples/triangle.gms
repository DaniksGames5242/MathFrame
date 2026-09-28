[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Три свободные вершины A, B, C — любой невырожденный треугольник. Вкладки
// показывают его определяющие свойства: неравенство треугольника, сумму углов,
// соотношение сторон и углов. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A") }
new Point { name = "B"; pos = (6, -3.5); text = true("B") }
new Point { name = "C"; pos = (1, 4); text = true("C") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }

new UI { name = "btn1"; type = button; label = "Неравенство треугольника"; action = "tab = 1" }
new UI { name = "btn2"; type = button; label = "Сумма углов"; action = "tab = 2" }
new UI { name = "btn3"; type = button; label = "Сторона против угла"; action = "tab = 3" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Площадь треугольника (для проверки невырожденности): не даём вершинам стать коллинеарными.
Function area2(ax, ay, bx, by, cx, cy) { return abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)); }

Function ok(ax, ay, bx, by, cx, cy) { return inField(ax, ay) && area2(ax, ay, bx, by, cx, cy) > 0.5; }

Function reach(x0, y0, dx, dy, bx, by, cx, cy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, bx, by, cx, cy)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, bx, by, cx, cy)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Start { pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y; }

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m > 0.000001) {
    if (mA == m) {
      float t = reach(pax, pay, A.pos.x - pax, A.pos.y - pay, pbx, pby, pcx, pcy);
      A.pos.x = pax + (A.pos.x - pax) * t; A.pos.y = pay + (A.pos.y - pay) * t;
    } else if (mB == m) {
      float t = reach(pbx, pby, B.pos.x - pbx, B.pos.y - pby, pax, pay, pcx, pcy);
      B.pos.x = pbx + (B.pos.x - pbx) * t; B.pos.y = pby + (B.pos.y - pby) * t;
    } else {
      float t = reach(pcx, pcy, C.pos.x - pcx, C.pos.y - pcy, pax, pay, pbx, pby);
      C.pos.x = pcx + (C.pos.x - pcx) * t; C.pos.y = pcy + (C.pos.y - pcy) * t;
    }
  }
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y) || !ok(B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y) || !ok(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  if (tab == 1) {
    info = "**Неравенство треугольника:** каждая сторона меньше суммы двух других.\n\nAB = " + num(ab.length, 2) + ", BC = " + num(bc.length, 2) + ", CA = " + num(ca.length, 2) + ".\n\nAB < BC + CA: " + num(ab.length, 2) + " < " + num(bc.length + ca.length, 2) + ".";
  } else if (tab == 2) {
    info = "**Сумма внутренних углов всегда равна 180°:** ∠A + ∠B + ∠C = " + num(angA.measure, 0) + "° + " + num(angB.measure, 0) + "° + " + num(angC.measure, 0) + "° = " + num(angA.measure + angB.measure + angC.measure, 0) + "°.";
  } else {
    string big = "A"; float bigA = angA.measure; if (angB.measure > bigA) { big = "B"; bigA = angB.measure; } if (angC.measure > bigA) { big = "C"; bigA = angC.measure; }
    string biga = "BC"; if (big == "B") { biga = "CA"; } if (big == "C") { biga = "AB"; }
    info = "**Большему углу противолежит большая сторона.** Наибольший угол — ∠" + big + " = " + num(bigA, 0) + "°, против него лежит сторона " + biga + " — она самая длинная: AB = " + num(ab.length, 2) + ", BC = " + num(bc.length, 2) + ", CA = " + num(ca.length, 2) + ".";
  }
}
]
