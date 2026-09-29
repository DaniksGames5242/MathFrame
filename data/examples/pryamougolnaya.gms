[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Прямоугольная трапеция ABCD: основания AB и DC горизонтальны (AB || DC),
// боковая сторона AD вертикальна (AD ⟂ AB и AD ⟂ DC — прямой угол при A и при D).
// BC — наклонная боковая сторона. Все четыре вершины перетаскиваются: A и B двигают
// нижнее основание и общую высоту, D меняет высоту h, C меняет длину верхнего
// основания s. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "D"; pos = (-5, 2); text = true("D"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 2); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angD"; lines = (da, cd) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
draw Angle { name = "arcD"; angle = "angD"; measure = false }

// ---- Логика ----
string info = "";
float h = 5; float s = 5;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pdx = 0; float pdy = 0; float pcx = 0; float pcy = 0;
float ps = 5; float minW = 1.2; float minH = 1.2; float minS = 0.8;

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
    float ax = pax; float ay = pay; float bx = pbx;
    if (mA == m) {
      ax = clamp(A.pos.x, -fieldMaxX, pbx - minW);
      ay = clamp(A.pos.y, -fieldMaxY, fieldMaxY - h);
      bx = pbx;
    } else if (mB == m) {
      ax = pax;
      bx = clamp(B.pos.x, pax + minW, fieldMaxX);
      ay = clamp(A.pos.y, -fieldMaxY, fieldMaxY - h);
    } else if (mD == m) {
      ax = pax; bx = pbx; ay = pay;
      h = clamp(D.pos.y - pay, minH, fieldMaxY - pay);
    } else {
      ax = pax; bx = pbx; ay = pay;
      s = clamp(C.pos.x - pax, minS, fieldMaxX - pax);
    }
    // Основания не должны стать равными (иначе BC ∥ AD и фигура — прямоугольник, а не трапеция): такой ход отменяется.
    if (abs(s - (bx - ax)) < 0.4) { ax = pax; ay = pay; bx = pbx; s = ps; h = pdy - pay; }
    A.pos.x = ax; A.pos.y = ay; B.pos.x = bx; B.pos.y = ay;
    D.pos.x = ax; D.pos.y = ay + h; C.pos.x = ax + s; C.pos.y = ay + h;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y; pcx = C.pos.x; pcy = C.pos.y; ps = s;

  info = "**Основания параллельны:** AB ∥ DC, AB = " + format(ab.length, 2) + ", DC = " + format(cd.length, 2) + ".\n\n**Боковая сторона AD перпендикулярна обоим основаниям и совпадает с высотой:** ∠A = ∠D = " + format(angA.measure, 0) + "°, AD = h = " + format(da.length, 2) + ".\n\n**Наклонная боковая сторона:** BC = " + format(bc.length, 2) + " = √(h² + (AB − DC)²) = √(" + format(da.length * da.length, 1) + " + " + format((ab.length - cd.length) * (ab.length - cd.length), 1) + ").\n\n**Площадь:** S = (AB + DC)/2 · h = " + format((ab.length + cd.length) / 2 * da.length, 2) + ".";
}
]
