[
description = "{info}"
field width = 26; field height = 18;
camera type = fixed;
float xa = -6; float ya = 1.5; float za = 4; float xb = 3; float yb = 4; float zb = 1;
float txp = 0; float typ = 0; string info = "";
float axOn = 0;
new Point { name = "A2"; pos = (-6, 4); text = true("A₂"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B2"; pos = (3, 1); text = true("B₂"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "A1"; pos = (-6, -1.5); text = true("A₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B1"; pos = (3, -4); text = true("B₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "T"; pos = (3, -3); dynamic = false; collision = false; color = #f59e0b; text = true("B₀") }
new Line { name = "l2"; pos = (A2, B2); interact = false; thickness = 2 }
new Line { name = "l1"; pos = (A1, B1); interact = false; thickness = 2 }
new Line { name = "ca"; pos = (A2, A1); interact = false; thickness = 1 }
new Line { name = "cb"; pos = (B2, B1); interact = false; thickness = 1 }
new Line { name = "leg"; pos = (B1, T); interact = false; thickness = 2; color = #22c55e }
new Line { name = "hyp"; pos = (A1, T); interact = false; thickness = 3; color = #f59e0b }
draw Graph { name = "dAxis"; graph = "gAxis"; nodeRadius = 0; labels = false; interactive = false; edgeWidth = 1.5 }
draw Text { name = "tx"; pos = (12, 0.6); text = "x" }
draw Text { name = "tH"; pos = (-11.5, -8); text = "H"; align = left }
draw Text { name = "tV"; pos = (-11.5, 8); text = "V"; align = left }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function okS(x1, y1, z1, x2, y2, z2) {
  if (x1 < -11 || x1 > 11 || x2 < -11 || x2 > 11) { return 0; }
  if (y1 < 0.5 || y1 > 4.5 || y2 < 0.5 || y2 > 4.5 || z1 < 0.5 || z1 > 4.5 || z2 < 0.5 || z2 > 4.5) { return 0; }
  float dx = x2 - x1; float dy = y2 - y1;
  if (sqrt(dx * dx + dy * dy) < 0.8) { return 0; }
  if (sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1)) < 0.8) { return 0; }
  return 1;
}
Update {
  if (axOn == 0) { axOn = 1; gAxis = newGraph(); addNode(gAxis, "l", [-12.4, 0]); addNode(gAxis, "r", [12.4, 0]); addEdge(gAxis, "l", "r"); }
  // какая из четырёх точек сдвинута
  float d1 = abs(A2.pos.x - xa) + abs(A2.pos.y - za);
  float d2 = abs(B2.pos.x - xb) + abs(B2.pos.y - zb);
  float d3 = abs(A1.pos.x - xa) + abs(-A1.pos.y - ya);
  float d4 = abs(B1.pos.x - xb) + abs(-B1.pos.y - yb);
  float m = max(max(d1, d2), max(d3, d4));
  if (m > 0.00001) {
    float nxa = xa; float nya = ya; float nza = za; float nxb = xb; float nyb = yb; float nzb = zb;
    if (m == d1) { nxa = A2.pos.x; nza = A2.pos.y; }
    else if (m == d2) { nxb = B2.pos.x; nzb = B2.pos.y; }
    else if (m == d3) { nxa = A1.pos.x; nya = -A1.pos.y; }
    else { nxb = B1.pos.x; nyb = -B1.pos.y; }
    if (okS(nxa, nya, nza, nxb, nyb, nzb) == 1) { xa = nxa; ya = nya; za = nza; xb = nxb; yb = nyb; zb = nzb; }
    else {
      // скольжение: пробуем сдвиг только по одной оси
      if (m == d1 || m == d3) { if (okS(nxa, ya, za, xb, yb, zb) == 1) { xa = nxa; } else if (m == d1 && okS(xa, ya, nza, xb, yb, zb) == 1) { za = nza; } else if (m == d3 && okS(xa, nya, za, xb, yb, zb) == 1) { ya = nya; } }
      else { if (okS(xa, ya, za, nxb, yb, zb) == 1) { xb = nxb; } else if (m == d2 && okS(xa, ya, za, xb, yb, nzb) == 1) { zb = nzb; } else if (m == d4 && okS(xa, ya, za, xb, nyb, zb) == 1) { yb = nyb; } }
    }
  }
  if (abs(A2.pos.x - xa) + abs(A2.pos.y - za) + abs(A1.pos.x - xa) + abs(A1.pos.y + ya) > 0.00001) { A2.pos.x = xa; A2.pos.y = za; A1.pos.x = xa; A1.pos.y = -ya; }
  if (abs(B2.pos.x - xb) + abs(B2.pos.y - zb) + abs(B1.pos.x - xb) + abs(B1.pos.y + yb) > 0.00001) { B2.pos.x = xb; B2.pos.y = zb; B1.pos.x = xb; B1.pos.y = -yb; }
  // прямоугольный треугольник: катет A₁B₁ (горизонтальная проекция) и перпендикулярный ему катет B₁B₀ = |z_A − z_B|
  float dx = xb - xa; float dy = -(yb - ya);
  float l = sqrt(dx * dx + dy * dy);
  float dz = abs(za - zb);
  float nx = dy / l; float ny = -dx / l;
  if (ny > 0) { nx = -nx; ny = -ny; }
  if (abs(T.pos.x - (xb + dz * nx)) + abs(T.pos.y - (-yb + dz * ny)) > 0.00001) { T.pos.x = xb + dz * nx; T.pos.y = -yb + dz * ny; }
  float len = sqrt(l * l + dz * dz);
  float ang = atan2(dz, l) * 180 / pi;
  info = "**Метрическая задача по эпюру.** Отрезок AB общего положения задан проекциями A₁B₁ (горизонтальная) и A₂B₂ (фронтальная), лежащими на линиях связи, перпендикулярных оси x. Проекции короче оригинала, истинную длину даёт прямоугольный треугольник.\n\nОдин катет — горизонтальная проекция: **A₁B₁ = " + format(l, 2) + "**, второй — разность аппликат (высот) концов, отложенная перпендикулярно A₁B₁ в точке B₁: **B₁B₀ = |z_A − z_B| = |" + num(za, 2) + " − " + num(zb, 2) + "| = " + format(dz, 2) + "**.\n\nГипотенуза A₁B₀ — истинная величина: **|AB| = " + format(len, 2) + "**. Угол при A₁ — угол прямой с плоскостью H: tg α = |z_A − z_B| / A₁B₁ = " + format(dz / l, 3) + ", **α = " + format(ang, 1) + "°**.";
  if (dz < 0.02) { info = info + "\n\nAB параллелен H: гипотенуза совпадает с катетом, горизонтальная проекция даёт истинную длину."; }
}
]
