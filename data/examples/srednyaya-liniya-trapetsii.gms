[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Трапеция ABCD: основания AB и DC горизонтальны (единственная пара
// параллельных сторон). A, B двигают нижнее основание. D — свободная точка (задаёт
// высоту и смещение боковой стороны AD), C = D + (s, 0) — верхнее основание всегда
// горизонтально, его длина s меняется перетаскиванием C. M, N — середины боковых
// сторон AD и BC, MN — средняя линия. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, 3); text = true("D"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Point { name = "M"; construct = median; vertex = A; base = "da"; dynamic = false; text = true("M") }
new Point { name = "N"; construct = median; vertex = B; base = "bc"; dynamic = false; text = true("N") }
new Line { name = "mn"; pos = (M, N); interact = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pdx = 0; float pdy = 0; float pcx = 0; float pcy = 0;
float s = 4; float ps = 4;
float minW = 1.5; float minH = 1.5; float minS = 0.6;

Function clamp(x, lo, hi) { if (x < lo) { return lo; } if (x > hi) { return hi; } return x; }

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mD, mC);
  if (m >= 0.000001) {
    float ax = pax; float ay = pay; float bx = pbx; float dx = pdx; float dy = pdy;
    if (mA == m) {
      ax = clamp(A.pos.x, -fieldMaxX, pbx - minW);
      ay = clamp(A.pos.y, -fieldMaxY, pdy - minH);
      bx = pbx; dx = pdx; dy = pdy;
    } else if (mB == m) {
      ax = pax;
      bx = clamp(B.pos.x, pax + minW, fieldMaxX);
      ay = clamp(A.pos.y, -fieldMaxY, pdy - minH);
      dx = pdx; dy = pdy;
    } else if (mD == m) {
      ax = pax; bx = pbx; ay = pay;
      dx = clamp(D.pos.x, -fieldMaxX, fieldMaxX - s);
      dy = clamp(D.pos.y, ay + minH, fieldMaxY);
    } else {
      ax = pax; bx = pbx; ay = pay; dx = pdx; dy = pdy;
      s = clamp(C.pos.x - pdx, minS, fieldMaxX - pdx);
    }
    // Основания не должны стать равными (иначе фигура — параллелограмм, а не трапеция): такой ход отменяется.
    if (abs(s - (bx - ax)) < 0.4) { ax = pax; ay = pay; bx = pbx; dx = pdx; dy = pdy; s = ps; }
    A.pos.x = ax; A.pos.y = ay; B.pos.x = bx; B.pos.y = ay;
    D.pos.x = dx; D.pos.y = dy; C.pos.x = dx + s; C.pos.y = dy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y; pcx = C.pos.x; pcy = C.pos.y; ps = s;

  info = "**Средняя линия соединяет середины боковых сторон** AD и BC: M — середина AD, N — середина BC.\n\n**Параллельна основаниям и равна их полусумме:** MN = " + format(mn.length, 2) + " = (AB + DC)/2 = (" + format(ab.length, 2) + " + " + format(cd.length, 2) + ")/2.\n\n**Площадь трапеции через среднюю линию:** S = MN · h = " + format(mn.length, 2) + " · " + format(abs(D.pos.y - A.pos.y), 2) + " = " + format(mn.length * abs(D.pos.y - A.pos.y), 2) + ", где h — расстояние между основаниями (высота трапеции).";
}
]
