[
description = "{info}"

field width = 20; field height = 12;
camera type = fixed;

// ---- Произвольный n-угольник (n = 3…10), звёздный относительно центра O: вершина k живёт
// в своём секторе вокруг O (угол — в пределах ±¼ сектора от «базового», радиус — от 1,5
// до 4,5), поэтому стороны никогда не пересекаются, а длины сторон и углы у фигуры
// разные — и выпуклые, и вогнутые положения. Все вершины перетаскиваются, фигура — целиком. ----
new Point { name = "P0"; pos = (0, -3.6); text = true("A"); pauseOnDrag = false }
new Point { name = "P1"; pos = (3.118, -1.8); text = true("B"); pauseOnDrag = false }
new Point { name = "P2"; pos = (3.118, 1.8); text = true("C"); pauseOnDrag = false; active = nSides > 2 }
new Point { name = "P3"; pos = (0, 3.6); text = true("D"); pauseOnDrag = false; active = nSides > 3 }
new Point { name = "P4"; pos = (-3.118, 1.8); text = true("E"); pauseOnDrag = false; active = nSides > 4 }
new Point { name = "P5"; pos = (-3.118, -1.8); text = true("F"); pauseOnDrag = false; active = nSides > 5 }
new Point { name = "P6"; pos = (0, -3.6); text = true("G"); pauseOnDrag = false; active = nSides > 6 }
new Point { name = "P7"; pos = (3.118, -1.8); text = true("H"); pauseOnDrag = false; active = nSides > 7 }
new Point { name = "P8"; pos = (3.118, 1.8); text = true("I"); pauseOnDrag = false; active = nSides > 8 }
new Point { name = "P9"; pos = (0, 3.6); text = true("J"); pauseOnDrag = false; active = nSides > 9 }

new Line { name = "e0"; pos = (P0, P1) }
new Line { name = "e1"; pos = (P1, P2) ; active = nSides > 2}
new Line { name = "e2"; pos = (P2, P3) ; active = nSides > 3}
new Line { name = "e3"; pos = (P3, P4) ; active = nSides > 4}
new Line { name = "e4"; pos = (P4, P5) ; active = nSides > 5}
new Line { name = "e5"; pos = (P5, P6) ; active = nSides > 6}
new Line { name = "e6"; pos = (P6, P7) ; active = nSides > 7}
new Line { name = "e7"; pos = (P7, P8) ; active = nSides > 8}
new Line { name = "e8"; pos = (P8, P9) ; active = nSides > 9}
// Замыкающая сторона — от последней активной вершины к P0 (активен ровно один из кандидатов).
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

// Диагонали из вершины A — ко всем вершинам, кроме себя и двух соседних.
new Line { name = "d2"; pos = (P0, P2); color = #f59e0b; interact = false; active = nSides > 3 }
new Line { name = "d3"; pos = (P0, P3); color = #f59e0b; interact = false; active = nSides > 4 }
new Line { name = "d4"; pos = (P0, P4); color = #f59e0b; interact = false; active = nSides > 5 }
new Line { name = "d5"; pos = (P0, P5); color = #f59e0b; interact = false; active = nSides > 6 }
new Line { name = "d6"; pos = (P0, P6); color = #f59e0b; interact = false; active = nSides > 7 }
new Line { name = "d7"; pos = (P0, P7); color = #f59e0b; interact = false; active = nSides > 8 }
new Line { name = "d8"; pos = (P0, P8); color = #f59e0b; interact = false; active = nSides > 9 }

new UI { name = "slN"; type = slider; label = "Число сторон n"; variable = nSides; min = 3; max = 10; step = 1; default = 6 }

float nSides = 6;
float ox = 0; float oy = 0;
float theta = -90;
string info = "";
float p0x = 0; float p0y = -3.6;
float p1x = 3.118; float p1y = -1.8;
float p2x = 3.118; float p2y = 1.8;
float p3x = 0; float p3y = 3.6;
float p4x = -3.118; float p4y = 1.8;
float p5x = -3.118; float p5y = -1.8;
float p6x = 0; float p6y = -3.6;
float p7x = 3.118; float p7y = -1.8;
float p8x = 3.118; float p8y = 1.8;
float p9x = 0; float p9y = 3.6;

Function vx(k) {
  if (k == 0) { return P0.pos.x; }
  else if (k == 1) { return P1.pos.x; }
  else if (k == 2) { return P2.pos.x; }
  else if (k == 3) { return P3.pos.x; }
  else if (k == 4) { return P4.pos.x; }
  else if (k == 5) { return P5.pos.x; }
  else if (k == 6) { return P6.pos.x; }
  else if (k == 7) { return P7.pos.x; }
  else if (k == 8) { return P8.pos.x; }
  else if (k == 9) { return P9.pos.x; }
  return 0;
}
Function vy(k) {
  if (k == 0) { return P0.pos.y; }
  else if (k == 1) { return P1.pos.y; }
  else if (k == 2) { return P2.pos.y; }
  else if (k == 3) { return P3.pos.y; }
  else if (k == 4) { return P4.pos.y; }
  else if (k == 5) { return P5.pos.y; }
  else if (k == 6) { return P6.pos.y; }
  else if (k == 7) { return P7.pos.y; }
  else if (k == 8) { return P8.pos.y; }
  else if (k == 9) { return P9.pos.y; }
  return 0;
}
Function sx(k) {
  if (k == 0) { return p0x; }
  else if (k == 1) { return p1x; }
  else if (k == 2) { return p2x; }
  else if (k == 3) { return p3x; }
  else if (k == 4) { return p4x; }
  else if (k == 5) { return p5x; }
  else if (k == 6) { return p6x; }
  else if (k == 7) { return p7x; }
  else if (k == 8) { return p8x; }
  else if (k == 9) { return p9x; }
  return 0;
}
Function sy(k) {
  if (k == 0) { return p0y; }
  else if (k == 1) { return p1y; }
  else if (k == 2) { return p2y; }
  else if (k == 3) { return p3y; }
  else if (k == 4) { return p4y; }
  else if (k == 5) { return p5y; }
  else if (k == 6) { return p6y; }
  else if (k == 7) { return p7y; }
  else if (k == 8) { return p8y; }
  else if (k == 9) { return p9y; }
  return 0;
}
Function setv(k, x, y) {
  if (k == 0) { P0.pos.x = x; P0.pos.y = y; }
  else if (k == 1) { P1.pos.x = x; P1.pos.y = y; }
  else if (k == 2) { P2.pos.x = x; P2.pos.y = y; }
  else if (k == 3) { P3.pos.x = x; P3.pos.y = y; }
  else if (k == 4) { P4.pos.x = x; P4.pos.y = y; }
  else if (k == 5) { P5.pos.x = x; P5.pos.y = y; }
  else if (k == 6) { P6.pos.x = x; P6.pos.y = y; }
  else if (k == 7) { P7.pos.x = x; P7.pos.y = y; }
  else if (k == 8) { P8.pos.x = x; P8.pos.y = y; }
  else if (k == 9) { P9.pos.x = x; P9.pos.y = y; }
  return 0;
}

// Угол точки (x, y) относительно центра, в градусах [0, 360).
Function ang(x, y) {
  float a = atan2(y - oy, x - ox) * 180 / pi;
  if (a < 0) { a = a + 360; }
  return a;
}

// Внутренний угол при вершине k (вершины идут против часовой стрелки).
Function interior(k) {
  float kp = k - 1; if (kp < 0) { kp = nSides - 1; }
  float kn = k + 1; if (kn > nSides - 1) { kn = 0; }
  float ux = vx(k) - vx(kp); float uy = vy(k) - vy(kp);
  float wx = vx(kn) - vx(k); float wy = vy(kn) - vy(k);
  float turn = atan2(ux * wy - uy * wx, ux * wx + uy * wy) * 180 / pi;
  return 180 - turn;
}

// Втиснуть вершину k в её сектор и кольцо радиусов; при нарушении вернуть точку на место.
Function fit(k) {
  float x = vx(k); float y = vy(k);
  float r = sqrt((x - ox) * (x - ox) + (y - oy) * (y - oy));
  float sector = 360 / nSides;
  float d = ang(x, y) - (theta + k * sector);
  d = d - 360 * round(d / 360);
  float w = sector / 4;
  float nd = d; if (nd > w) { nd = w; } if (nd < -w) { nd = -w; }
  float nr = r; if (nr < 1.5) { nr = 1.5; } if (nr > 4.5) { nr = 4.5; }
  if (abs(nd - d) > 0.000001 || abs(nr - r) > 0.000001) {
    float a = (theta + k * sector + nd) * pi / 180;
    setv(k, ox + nr * cos(a), oy + nr * sin(a));
  }
  return 0;
}

// Разложить n вершин по умолчанию (при смене n): правильные положения на радиусе 3,6.
Function reset() {
  repeat (10) {
    float a = (theta + i * 360 / nSides) * pi / 180;
    setv(i, ox + 3.6 * cos(a), oy + 3.6 * sin(a));
  }
  return 0;
}

float lastN = 6;

Start { reset(); }

Update {
  if (nSides != lastN) { lastN = nSides; reset(); }
  float dx0 = P0.pos.x - p0x; float dy0 = P0.pos.y - p0y;
  float m = 0; float shift = 0; float worst = 0;
  repeat (10) {
    float mk = 0;
    if (i < nSides) {
      float dxk = vx(i) - sx(i); float dyk = vy(i) - sy(i);
      mk = abs(dxk) + abs(dyk);
      shift = shift + abs(dxk - dx0) + abs(dyk - dy0);
    }
    if (mk > m) { m = mk; }
  }
  if (m > 0.000001 && shift < 0.000001) {
    // Перенос фигуры целиком: сдвигаем центр и все вершины на один вектор, не выходя за поле.
    float nox = ox + dx0; float noy = oy + dy0;
    float lx = fieldMaxX - 4.8; float ly = fieldMaxY - 4.8;
    if (nox > lx) { nox = lx; } if (nox < -lx) { nox = -lx; }
    if (noy > ly) { noy = ly; } if (noy < -ly) { noy = -ly; }
    repeat (10) { setv(i, sx(i) + nox - ox, sy(i) + noy - oy); }
    ox = nox; oy = noy;
  } else {
    repeat (10) { if (i < nSides) { fit(i); } }
  }
  p0x = P0.pos.x; p0y = P0.pos.y; p1x = P1.pos.x; p1y = P1.pos.y; p2x = P2.pos.x; p2y = P2.pos.y;
  p3x = P3.pos.x; p3y = P3.pos.y; p4x = P4.pos.x; p4y = P4.pos.y; p5x = P5.pos.x; p5y = P5.pos.y;
  p6x = P6.pos.x; p6y = P6.pos.y; p7x = P7.pos.x; p7y = P7.pos.y; p8x = P8.pos.x; p8y = P8.pos.y;
  p9x = P9.pos.x; p9y = P9.pos.y;

  float sum = 0; float perim = 0;
  repeat (10) {
    if (i < nSides) {
      sum = sum + interior(i);
      float kn = i + 1; if (kn > nSides - 1) { kn = 0; }
      perim = perim + sqrt((vx(kn) - vx(i)) * (vx(kn) - vx(i)) + (vy(kn) - vy(i)) * (vy(kn) - vy(i)));
    }
  }
  float nn = nSides;
  info = "**Вершины и стороны.** У многоугольника n = " + format(nn, 0) + " вершин и столько же сторон; периметр — сумма длин сторон: P = " + format(perim, 2) + ". Угол при вершине A равен " + format(interior(0), 1) + "°.\n\n**Диагонали** — отрезки между несмежными вершинами. Из вершины A (оранжевые) их n − 3 = " + format(nn - 3, 0) + ", всего n(n − 3)/2 = " + format(nn * (nn - 3) / 2, 0) + ".\n\n**Сумма углов** (n − 2)·180° = " + format((nn - 2) * 180, 0) + "°; сложив измеренные углы, получаем " + format(sum, 1) + "°.";
}
]
