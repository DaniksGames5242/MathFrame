[
description = "{info}"

field width = 20; field height = 12;
camera type = fixed;

// ---- До 10 вершин правильного n-угольника, лишние скрыты (active = nSides > k). Все
// активные вершины перетаскиваются: любая задаёт радиус R и поворот θ (по своему
// индексу k — искомый угол θ = φ − k·360°/n), фигура пересчитывается заново. ----
new Point { name = "P0"; pos = (0, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "P1"; pos = (3.8, -2.35); pauseOnDrag = false }
new Point { name = "P2"; pos = (3.8, 2.35); active = nSides > 2; pauseOnDrag = false }
new Point { name = "P3"; pos = (0, 4); active = nSides > 3; pauseOnDrag = false }
new Point { name = "P4"; pos = (-3.8, 2.35); active = nSides > 4; pauseOnDrag = false }
new Point { name = "P5"; pos = (-3.8, -2.35); active = nSides > 5; pauseOnDrag = false }
new Point { name = "P6"; pos = (-2.5, -3); active = nSides > 6; pauseOnDrag = false }
new Point { name = "P7"; pos = (0, -4); active = nSides > 7; pauseOnDrag = false }
new Point { name = "P8"; pos = (2.5, -3); active = nSides > 8; pauseOnDrag = false }
new Point { name = "P9"; pos = (3.8, -1.2); active = nSides > 9; pauseOnDrag = false }

new Line { name = "e0"; pos = (P0, P1) }
new Line { name = "e1"; pos = (P1, P2); active = nSides > 2 }
new Line { name = "e2"; pos = (P2, P3); active = nSides > 3 }
new Line { name = "e3"; pos = (P3, P4); active = nSides > 4 }
new Line { name = "e4"; pos = (P4, P5); active = nSides > 5 }
new Line { name = "e5"; pos = (P5, P6); active = nSides > 6 }
new Line { name = "e6"; pos = (P6, P7); active = nSides > 7 }
new Line { name = "e7"; pos = (P7, P8); active = nSides > 8 }
new Line { name = "e8"; pos = (P8, P9); active = nSides > 9 }
// Замыкающая сторона — от последней активной вершины к P0; для каждого n своя (номер
// последней вершины меняется), поэтому здесь 8 кандидатов, активен ровно один.
new Line { name = "c3"; pos = (P2, P0); active = nSides == 3 }
new Line { name = "c4"; pos = (P3, P0); active = nSides == 4 }
new Line { name = "c5"; pos = (P4, P0); active = nSides == 5 }
new Line { name = "c6"; pos = (P5, P0); active = nSides == 6 }
new Line { name = "c7"; pos = (P6, P0); active = nSides == 7 }
new Line { name = "c8"; pos = (P7, P0); active = nSides == 8 }
new Line { name = "c9"; pos = (P8, P0); active = nSides == 9 }
new Line { name = "c10"; pos = (P9, P0); active = nSides == 10 }

// Фигура — по одной на каждое n: у фигуры с неактивными сторонами не работает перенос целиком.
new Figure { name = "poly3"; elements = (e0, e1, c3); active = nSides == 3 }
new Figure { name = "poly4"; elements = (e0, e1, e2, c4); active = nSides == 4 }
new Figure { name = "poly5"; elements = (e0, e1, e2, e3, c5); active = nSides == 5 }
new Figure { name = "poly6"; elements = (e0, e1, e2, e3, e4, c6); active = nSides == 6 }
new Figure { name = "poly7"; elements = (e0, e1, e2, e3, e4, e5, c7); active = nSides == 7 }
new Figure { name = "poly8"; elements = (e0, e1, e2, e3, e4, e5, e6, c8); active = nSides == 8 }
new Figure { name = "poly9"; elements = (e0, e1, e2, e3, e4, e5, e6, e7, c9); active = nSides == 9 }
new Figure { name = "poly10"; elements = (e0, e1, e2, e3, e4, e5, e6, e7, e8, c10); active = nSides == 10 }

// ---- Центральный угол между радиусами O-P0 и O-P1, проведёнными к соседним вершинам ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Line { name = "r0"; pos = (O, P0); interact = false }
new Line { name = "r1"; pos = (O, P1); interact = false }
new Angle { name = "angCentr"; lines = (r0, r1) }
draw Angle { name = "arcCentr"; angle = "angCentr" }

new UI { name = "slN"; type = slider; label = "Число сторон n"; variable = nSides; min = 3; max = 10; step = 1; default = 6 }

float nSides = 6;
float ox = 0; float oy = 0;
float theta = 90;
float R = 4;
float lastN = 6;
string info = "";
float p0x = 0; float p0y = -4; float p1x = 3.8; float p1y = -2.35; float p2x = 3.8; float p2y = 2.35;
float p3x = 0; float p3y = 4; float p4x = -3.8; float p4y = 2.35; float p5x = -3.8; float p5y = -2.35;
float p6x = -2.5; float p6y = -3; float p7x = 0; float p7y = -4; float p8x = 2.5; float p8y = -3;
float p9x = 3.8; float p9y = -1.2;

// Угол в градусах точки (x, y) относительно центра (ox, oy), нормированный в [0, 360).
Function ang(x, y) {
  float a = atan2(y - oy, x - ox) * 180 / pi;
  if (a < 0) { a = a + 360; }
  return a;
}

Function place() {
  repeat (10) {
    float k = i;
    float a = (theta + k * 360 / nSides) * pi / 180;
    float nx = ox + R * cos(a); float ny = oy + R * sin(a);
    if (i == 0) { P0.pos.x = nx; P0.pos.y = ny; }
    if (i == 1) { P1.pos.x = nx; P1.pos.y = ny; }
    if (i == 2) { P2.pos.x = nx; P2.pos.y = ny; }
    if (i == 3) { P3.pos.x = nx; P3.pos.y = ny; }
    if (i == 4) { P4.pos.x = nx; P4.pos.y = ny; }
    if (i == 5) { P5.pos.x = nx; P5.pos.y = ny; }
    if (i == 6) { P6.pos.x = nx; P6.pos.y = ny; }
    if (i == 7) { P7.pos.x = nx; P7.pos.y = ny; }
    if (i == 8) { P8.pos.x = nx; P8.pos.y = ny; }
    if (i == 9) { P9.pos.x = nx; P9.pos.y = ny; }
  }
  O.pos.x = ox; O.pos.y = oy;
  return 0;
}

Start { place(); }

Update {
  // Смена n — заново расставить вершины правильного n-угольника.
  if (nSides != lastN) { lastN = nSides; place(); p0x = P0.pos.x; p0y = P0.pos.y; p1x = P1.pos.x; p1y = P1.pos.y; p2x = P2.pos.x; p2y = P2.pos.y; p3x = P3.pos.x; p3y = P3.pos.y; p4x = P4.pos.x; p4y = P4.pos.y; p5x = P5.pos.x; p5y = P5.pos.y; p6x = P6.pos.x; p6y = P6.pos.y; p7x = P7.pos.x; p7y = P7.pos.y; p8x = P8.pos.x; p8y = P8.pos.y; p9x = P9.pos.x; p9y = P9.pos.y; }
  float m0 = abs(P0.pos.x - p0x) + abs(P0.pos.y - p0y);
  float m1 = abs(P1.pos.x - p1x) + abs(P1.pos.y - p1y);
  float m2 = (nSides > 2) ? abs(P2.pos.x - p2x) + abs(P2.pos.y - p2y) : 0;
  float m3 = (nSides > 3) ? abs(P3.pos.x - p3x) + abs(P3.pos.y - p3y) : 0;
  float m4 = (nSides > 4) ? abs(P4.pos.x - p4x) + abs(P4.pos.y - p4y) : 0;
  float m5 = (nSides > 5) ? abs(P5.pos.x - p5x) + abs(P5.pos.y - p5y) : 0;
  float m6 = (nSides > 6) ? abs(P6.pos.x - p6x) + abs(P6.pos.y - p6y) : 0;
  float m7 = (nSides > 7) ? abs(P7.pos.x - p7x) + abs(P7.pos.y - p7y) : 0;
  float m8 = (nSides > 8) ? abs(P8.pos.x - p8x) + abs(P8.pos.y - p8y) : 0;
  float m9 = (nSides > 9) ? abs(P9.pos.x - p9x) + abs(P9.pos.y - p9y) : 0;
  float m = max(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9);

  // Перенос фигуры целиком: все активные вершины сдвинуты на один вектор — сдвигаем центр.
  float d0x = P0.pos.x - p0x; float d0y = P0.pos.y - p0y;
  float shift = abs(P1.pos.x - p1x - d0x) + abs(P1.pos.y - p1y - d0y);
  shift = shift + ((nSides > 2) ? abs(P2.pos.x - p2x - d0x) + abs(P2.pos.y - p2y - d0y) : 0);
  shift = shift + ((nSides > 3) ? abs(P3.pos.x - p3x - d0x) + abs(P3.pos.y - p3y - d0y) : 0);
  shift = shift + ((nSides > 4) ? abs(P4.pos.x - p4x - d0x) + abs(P4.pos.y - p4y - d0y) : 0);
  shift = shift + ((nSides > 5) ? abs(P5.pos.x - p5x - d0x) + abs(P5.pos.y - p5y - d0y) : 0);
  shift = shift + ((nSides > 6) ? abs(P6.pos.x - p6x - d0x) + abs(P6.pos.y - p6y - d0y) : 0);
  shift = shift + ((nSides > 7) ? abs(P7.pos.x - p7x - d0x) + abs(P7.pos.y - p7y - d0y) : 0);
  shift = shift + ((nSides > 8) ? abs(P8.pos.x - p8x - d0x) + abs(P8.pos.y - p8y - d0y) : 0);
  shift = shift + ((nSides > 9) ? abs(P9.pos.x - p9x - d0x) + abs(P9.pos.y - p9y - d0y) : 0);

  if (m > 0.000001 && shift < 0.000001) {
    float lx = fieldMaxX - R - 0.3; float ly = fieldMaxY - R - 0.3;
    float nox = ox + d0x; float noy = oy + d0y;
    if (nox > lx) { nox = lx; } if (nox < -lx) { nox = -lx; }
    if (noy > ly) { noy = ly; } if (noy < -ly) { noy = -ly; }
    ox = nox; oy = noy;
    place();
  } else if (m > 0.000001) {
    float wx = 0; float wy = 0; float k = 0;
    if (m0 == m) { wx = P0.pos.x; wy = P0.pos.y; k = 0; }
    else if (m1 == m) { wx = P1.pos.x; wy = P1.pos.y; k = 1; }
    else if (m2 == m) { wx = P2.pos.x; wy = P2.pos.y; k = 2; }
    else if (m3 == m) { wx = P3.pos.x; wy = P3.pos.y; k = 3; }
    else if (m4 == m) { wx = P4.pos.x; wy = P4.pos.y; k = 4; }
    else if (m5 == m) { wx = P5.pos.x; wy = P5.pos.y; k = 5; }
    else if (m6 == m) { wx = P6.pos.x; wy = P6.pos.y; k = 6; }
    else if (m7 == m) { wx = P7.pos.x; wy = P7.pos.y; k = 7; }
    else if (m8 == m) { wx = P8.pos.x; wy = P8.pos.y; k = 8; }
    else { wx = P9.pos.x; wy = P9.pos.y; k = 9; }
    float newR = sqrt((wx - ox) * (wx - ox) + (wy - oy) * (wy - oy));
    float newTheta = ang(wx, wy) - k * 360 / nSides;
    float maxR = min(fieldMaxX - abs(ox), fieldMaxY - abs(oy)) - 0.3;
    if (newR < 1.2) { newR = 1.2; }
    if (newR > maxR) { newR = maxR; }
    R = newR; theta = newTheta;
    place();
  }

  p0x = P0.pos.x; p0y = P0.pos.y; p1x = P1.pos.x; p1y = P1.pos.y;
  p2x = P2.pos.x; p2y = P2.pos.y; p3x = P3.pos.x; p3y = P3.pos.y;
  p4x = P4.pos.x; p4y = P4.pos.y; p5x = P5.pos.x; p5y = P5.pos.y;
  p6x = P6.pos.x; p6y = P6.pos.y; p7x = P7.pos.x; p7y = P7.pos.y;
  p8x = P8.pos.x; p8y = P8.pos.y; p9x = P9.pos.x; p9y = P9.pos.y;

  float alpha = 360 / nSides;
  info = "**Центральный угол** — угол между радиусами, проведёнными к двум соседним вершинам: α = 360°/n = 360°/" + format(nSides, 0) + " = " + format(alpha, 1) + "°.\n\nПри радиусе описанной окружности R = " + format(R, 2) + " сторона a = 2R·sin(α/2) = " + format(2 * R * sin(alpha / 2 * pi / 180), 2) + " = " + format(e0.length, 2) + ", а n одинаковых центральных углов в сумме дают " + format(nSides, 0) + " · " + format(alpha, 1) + "° = 360°.";
}
]
