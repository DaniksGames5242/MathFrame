[
description = "{info}"

field width = 20; field height = 12;
camera type = fixed;

// ---- Квадрат: 4 вершины на общей окружности радиуса p через 90°. Все вершины
// перетаскиваются: любая задаёт p (половину диагонали) и поворот θ, остальные
// пересчитываются — фигура остаётся квадратом любого размера и поворота. Перенос
// фигуры целиком (грабом за внутренность) двигает центр (ox, oy). ----
new Point { name = "A"; pos = (0, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4, 0); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 4); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-4, 0); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Line { name = "ac"; pos = (A, C); color = "transparent"; interact = false }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

float ox = 0; float oy = 0; float p = 4; float theta = -90;
string info = "";
float pax = 0; float pay = -4; float pbx = 4; float pby = 0; float pcx = 0; float pcy = 4; float pdx = -4; float pdy = 0;

Function ang(x, y) {
  float a = atan2(y - oy, x - ox) * 180 / pi;
  if (a < 0) { a = a + 360; }
  return a;
}

Function place() {
  float a0 = theta * pi / 180;
  A.pos.x = ox + p * cos(a0); A.pos.y = oy + p * sin(a0);
  float a1 = (theta + 90) * pi / 180;
  B.pos.x = ox + p * cos(a1); B.pos.y = oy + p * sin(a1);
  float a2 = (theta + 180) * pi / 180;
  C.pos.x = ox + p * cos(a2); C.pos.y = oy + p * sin(a2);
  float a3 = (theta + 270) * pi / 180;
  D.pos.x = ox + p * cos(a3); D.pos.y = oy + p * sin(a3);
  return 0;
}

// Держит квадрат целиком в поле: центр сдвигается так, чтобы все вершины были внутри.
Function fit() {
  float t = theta * pi / 180;
  float e = p * max(abs(cos(t)), abs(sin(t)));
  float lx = fieldMaxX - 0.3 - e; float ly = fieldMaxY - 0.3 - e;
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
  // Перенос фигуры целиком: все вершины сдвинуты на общий вектор.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));

  if (m > 0.000001 && shift > 0.000001) {
    float wx = 0; float wy = 0; float k = 0;
    if (mA == m) { wx = A.pos.x; wy = A.pos.y; k = 0; }
    else if (mB == m) { wx = B.pos.x; wy = B.pos.y; k = 1; }
    else if (mC == m) { wx = C.pos.x; wy = C.pos.y; k = 2; }
    else { wx = D.pos.x; wy = D.pos.y; k = 3; }
    float newP = sqrt((wx - ox) * (wx - ox) + (wy - oy) * (wy - oy));
    float newTheta = ang(wx, wy) - k * 90;
    float maxP = min(fieldMaxX, fieldMaxY) - 0.3;
    if (newP < 0.9) { newP = 0.9; }
    if (newP > maxP) { newP = maxP; }
    p = newP; theta = newTheta;
    fit();
  } else if (m > 0.000001) {
    ox = ox + (A.pos.x - pax); oy = oy + (A.pos.y - pay);
    fit();
  }

  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  float side = ab.length;
  float diag = ac.length;
  info = "**Площадь квадрата равна квадрату стороны:** S = a² = " + format(side, 2) + "² = " + format(side * side, 2) + ".\n\n**Через диагональ:** S = d²/2 = " + format(diag, 2) + "²/2 = " + format(diag * diag / 2, 2) + ".";
}
]
