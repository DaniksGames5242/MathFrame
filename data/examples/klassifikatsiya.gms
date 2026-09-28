[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Свободный треугольник: классификация по сторонам (разносторонний / равнобедренный
// / равносторонний) и по углам (остроугольный / прямоугольный / тупоугольный) читается
// прямо по фигуре при любых положениях вершин. ----
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

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
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

  float a = bc.length; float b = ca.length; float c = ab.length;
  float tol = 0.05;
  string bySide = "";
  if (abs(a - b) < tol && abs(b - c) < tol) { bySide = "**равносторонний** (все стороны равны)"; }
  else if (abs(a - b) < tol || abs(b - c) < tol || abs(a - c) < tol) { bySide = "**равнобедренный** (две стороны равны)"; }
  else { bySide = "**разносторонний** (все стороны различны)"; }

  float mx = max(angA.measure, angB.measure, angC.measure);
  string byAngle = "";
  if (abs(mx - 90) < 1) { byAngle = "**прямоугольный** (один угол — 90°)"; }
  else if (mx > 90) { byAngle = "**тупоугольный** (один угол больше 90°)"; }
  else { byAngle = "**остроугольный** (все углы меньше 90°)"; }

  info = "**По сторонам:** AB = " + num(c, 2) + ", BC = " + num(a, 2) + ", CA = " + num(b, 2) + " — треугольник " + bySide + ".\n\n**По углам:** ∠A = " + num(angA.measure, 0) + "°, ∠B = " + num(angB.measure, 0) + "°, ∠C = " + num(angC.measure, 0) + "° — треугольник " + byAngle + ".";
}
]
