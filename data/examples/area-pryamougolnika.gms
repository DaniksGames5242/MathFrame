[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Прямоугольник ABCD: сторона AB всегда горизонтальна (её направление и есть
// направление основания), AD ей перпендикулярна. Все четыре вершины перетаскиваются:
// A и B двигают основание (его длину и общую высоту фигуры), D и C двигают высоту.
// Все точки, зависящие от другой, каждый кадр пересчитываются заново из состояния
// (ширина w = |AB|, высота h). ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "D"; pos = (-5, 3); text = true("D"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }

new Line { name = "diagBD"; pos = (B, D); interact = false }
new Line { name = "diagAC"; pos = (A, C); interact = false }
new Point { name = "O"; construct = median; vertex = A; base = "diagBD"; dynamic = false; text = true("O") }
draw EquallySing { name = "eqDiag"; edges = (diagAC, diagBD); type = 1 }
new Claster { name = "tabDiag"; elements = (O, diagAC, diagBD, eqDiag); active = false }

new Claster { name = "tabSides"; elements = (arcA); active = true }

new UI { name = "btnSides"; type = button; label = "Через стороны"; action = "tab = 1; tabSides.active = true; tabDiag.active = false" }
new UI { name = "btnDiag"; type = button; label = "Через диагональ"; action = "tab = 2; tabSides.active = false; tabDiag.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float w = 10; float h = 6;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pdx = 0; float pdy = 0; float pcx = 0; float pcy = 0;
float minW = 1.5; float minH = 1.5;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

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
      // Двигают A: меняются положение и ширина основания, высота h сохраняется.
      ax = clamp(A.pos.x, -fieldMaxX, pbx - minW);
      ay = clamp(A.pos.y, -fieldMaxY, fieldMaxY - h);
      bx = pbx;
    } else if (mB == m) {
      ax = pax;
      bx = clamp(B.pos.x, pax + minW, fieldMaxX);
      ay = clamp(A.pos.y, -fieldMaxY, fieldMaxY - h);
    } else if (mD == m) {
      // Двигают D: пересчитывается только высота h (AD перпендикулярна AB).
      ax = pax; bx = pbx; ay = pay;
      h = clamp(D.pos.y - pay, minH, fieldMaxY - pay);
    } else {
      ax = pax; bx = pbx; ay = pay;
      h = clamp(C.pos.y - pay, minH, fieldMaxY - pay);
    }
    w = bx - ax;
    A.pos.x = ax; A.pos.y = ay; B.pos.x = bx; B.pos.y = ay;
    D.pos.x = ax; D.pos.y = ay + h; C.pos.x = bx; C.pos.y = ay + h;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  if (tab == 1) {
    info = "**Площадь равна произведению двух смежных сторон:** S = AB · AD = " + format(ab.length, 2) + " · " + format(da.length, 2) + " = " + format(ab.length * da.length, 2) + " — высота, опущенная на сторону, совпадает с примыкающей стороной, потому что угол между ними прямой (∠A = " + format(angA.measure, 0) + "°) и синус прямого угла равен единице.";
  } else {
    float ux = C.pos.x - A.pos.x; float uy = C.pos.y - A.pos.y;
    float vx = D.pos.x - B.pos.x; float vy = D.pos.y - B.pos.y;
    float dotUV = ux * vx + uy * vy;
    float crossUV = ux * vy - uy * vx;
    float phi = abs(atan2(crossUV, dotUV)) * 180 / pi;
    info = "**Диагонали прямоугольника равны и точкой пересечения делятся пополам:** AC = BD = " + format(diagAC.length, 2) + ", AO = BO = CO = DO = " + format(diagAC.length / 2, 2) + ".\n\n**Площадь через диагональ и угол между диагоналями:** S = ½ · d² · sin φ = ½ · " + format(diagAC.length * diagAC.length, 2) + " · sin " + format(phi, 0) + "° = " + format(0.5 * diagAC.length * diagAC.length * sin(phi * pi / 180), 2) + " ≈ AB · AD = " + format(ab.length * da.length, 2) + ".";
  }
}
]
