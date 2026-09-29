[
description = "{info}"

field width = 20; field height = 12;
camera type = fixed;

// ---- Ромб: диагонали AC и BD пересекаются в центре под прямым углом и делятся им
// пополам — половины диагоналей p = |OA|, q = |OB| независимы, направление θ общее.
// Все 4 вершины перетаскиваются: любая задаёт (p или q) и θ, остальные пересчитываются
// так, что диагонали остаются перпендикулярны и делятся центром пополам. ----
new Point { name = "A"; pos = (0, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2.5, 0); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 4); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 0); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Line { name = "ac"; pos = (A, C); color = "transparent"; interact = false }
new Line { name = "bd"; pos = (B, D); color = "transparent"; interact = false }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

draw EquallySing { name = "eqSides"; edges = (ab, bc, cd, da); type = 1 }
new Angle { name = "angA"; lines = (da, ab) }
draw Angle { name = "arcA"; angle = "angA" }

float ox = 0; float oy = 0; float p = 4; float q = 2.5; float theta = -90;
string info = "";
float pax = 0; float pay = -4; float pbx = 2.5; float pby = 0; float pcx = 0; float pcy = 4; float pdx = -2.5; float pdy = 0;

Function ang(x, y) {
  float a = atan2(y - oy, x - ox) * 180 / pi;
  if (a < 0) { a = a + 360; }
  return a;
}

Function place() {
  float a0 = theta * pi / 180;
  A.pos.x = ox + p * cos(a0); A.pos.y = oy + p * sin(a0);
  float a1 = (theta + 90) * pi / 180;
  B.pos.x = ox + q * cos(a1); B.pos.y = oy + q * sin(a1);
  float a2 = (theta + 180) * pi / 180;
  C.pos.x = ox + p * cos(a2); C.pos.y = oy + p * sin(a2);
  float a3 = (theta + 270) * pi / 180;
  D.pos.x = ox + q * cos(a3); D.pos.y = oy + q * sin(a3);
  return 0;
}

// Держит ромб целиком в поле: центр сдвигается так, чтобы все вершины были внутри.
Function fit() {
  float t = theta * pi / 180;
  float ex = max(abs(p * cos(t)), abs(q * sin(t)));
  float ey = max(abs(p * sin(t)), abs(q * cos(t)));
  float lx = fieldMaxX - 0.3 - ex; float ly = fieldMaxY - 0.3 - ey;
  if (ox > lx) { ox = lx; } if (ox < -lx) { ox = -lx; }
  if (oy > ly) { oy = ly; } if (oy < -ly) { oy = -ly; }
  place();
  return 0;
}

Start { place(); }

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));

  if (m > 0.000001 && shift > 0.000001) {
    float wx = 0; float wy = 0; float k = 0;
    if (mA == m) { wx = A.pos.x; wy = A.pos.y; k = 0; }
    else if (mB == m) { wx = B.pos.x; wy = B.pos.y; k = 1; }
    else if (mC == m) { wx = C.pos.x; wy = C.pos.y; k = 2; }
    else { wx = D.pos.x; wy = D.pos.y; k = 3; }
    float rad = sqrt((wx - ox) * (wx - ox) + (wy - oy) * (wy - oy));
    float newTheta = ang(wx, wy) - k * 90;
    float maxR = min(fieldMaxX, fieldMaxY) - 0.3;
    if (rad < 0.6) { rad = 0.6; }
    if (rad > maxR) { rad = maxR; }
    if (k == 0 || k == 2) { p = rad; } else { q = rad; }
    theta = newTheta;
    fit();
  } else if (m > 0.000001) {
    ox = ox + (A.pos.x - pax); oy = oy + (A.pos.y - pay);
    fit();
  }

  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  float d1 = ac.length; float d2 = bd.length; float side = ab.length;
  float alphaRad = angA.measure * pi / 180;
  info = "**Диагонали перпендикулярны и делятся точкой пересечения пополам.** S = ½·d₁·d₂ = ½·" + format(d1, 2) + "·" + format(d2, 2) + " = " + format(d1 * d2 / 2, 2) + ".\n\n**Через сторону и угол:** S = a²·sin α = " + format(side, 2) + "²·sin " + format(angA.measure, 0) + "° = " + format(side * side * sin(alphaRad), 2) + ".";
}
]
