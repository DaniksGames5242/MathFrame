[
description = "{info}"

field width = 20;
field height = 14;
camera type = fixed;

// ---- Треугольник ABC — вершины свободно перетаскиваются (никакая форма не фиксируется).
// Все производные точки вычисляются в Update: dynamic = false, collision = false. ----
new Point { name = "A"; pos = (-7, -4); text = true("A") }
new Point { name = "B"; pos = (7, -4.5); text = true("B") }
new Point { name = "C"; pos = (1, 5); text = true("C") }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "ca"; pos = (C, A); interact = false }
new Figure { name = "abc"; elements = (ab, bc, ca); interact = false }

// ---- Прямая Эйлера и её точки: O (центр описанной окружности), H (ортоцентр), G (центроид) ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; text = true("G") }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("N") }
new Line { name = "euler"; pos = (O, H); interact = false; active = false }
draw Punctir { name = "eulerLine"; edge = "euler" }

// ---- Девять точек: середины сторон, основания высот, середины отрезков от вершин до H ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Fa"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Fb"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Fc"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Ea"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Eb"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Ec"; pos = (0, 0); dynamic = false; collision = false }

new Curve { name = "circ9"; type = parametric; x = "nx + nr * cos(6.2831853 * t)"; y = "ny + nr * sin(6.2831853 * t)"; color = #3b82f6 }

// ---- Логика ----
float nx = 0; float ny = 0; float nr = 1;
string info = "";
float ix = 0; float iy = 0;

// Пересечение прямых P1 + t·D1 и P2 + s·D2 — результат в (ix, iy).
Function interLL(p1x, p1y, d1x, d1y, p2x, p2y, d2x, d2y) {
  float den = d1x * d2y - d1y * d2x;
  if (abs(den) < 0.000001) { return 0; }
  float t = ((p2x - p1x) * d2y - (p2y - p1y) * d2x) / den;
  ix = p1x + t * d1x; iy = p1y + t * d1y;
  return 1;
}

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;

  // Ортоцентр — пересечение высот из A и из B.
  float ok1 = interLL(ax, ay, -(cy - by), cx - bx, bx, by, -(cy - ay), cx - ax);
  float hx = ix; float hy = iy;
  // Центр описанной окружности — пересечение серединных перпендикуляров к AB и к BC.
  float ok2 = interLL((ax + bx) / 2, (ay + by) / 2, -(by - ay), bx - ax, (bx + cx) / 2, (by + cy) / 2, -(cy - by), cx - bx);
  float ox = ix; float oy = iy;

  if (ok1 == 1 && ok2 == 1) {
    H.pos.x = hx; H.pos.y = hy;
    O.pos.x = ox; O.pos.y = oy;
    G.pos.x = (ax + bx + cx) / 3; G.pos.y = (ay + by + cy) / 3;
    nx = (ox + hx) / 2; ny = (oy + hy) / 2;
    N.pos.x = nx; N.pos.y = ny;
    nr = sqrt((ox - ax) * (ox - ax) + (oy - ay) * (oy - ay)) / 2;

    Ma.pos.x = (bx + cx) / 2; Ma.pos.y = (by + cy) / 2;
    Mb.pos.x = (cx + ax) / 2; Mb.pos.y = (cy + ay) / 2;
    Mc.pos.x = (ax + bx) / 2; Mc.pos.y = (ay + by) / 2;

    // Основание высоты из A на BC: проекция A на прямую BC.
    float dbx = cx - bx; float dby = cy - by;
    float ta = ((ax - bx) * dbx + (ay - by) * dby) / (dbx * dbx + dby * dby);
    Fa.pos.x = bx + ta * dbx; Fa.pos.y = by + ta * dby;
    float dcx = ax - cx; float dcy = ay - cy;
    float tb = ((bx - cx) * dcx + (by - cy) * dcy) / (dcx * dcx + dcy * dcy);
    Fb.pos.x = cx + tb * dcx; Fb.pos.y = cy + tb * dcy;
    float dax = bx - ax; float day = by - ay;
    float tc = ((cx - ax) * dax + (cy - ay) * day) / (dax * dax + day * day);
    Fc.pos.x = ax + tc * dax; Fc.pos.y = ay + tc * day;

    Ea.pos.x = (ax + hx) / 2; Ea.pos.y = (ay + hy) / 2;
    Eb.pos.x = (bx + hx) / 2; Eb.pos.y = (by + hy) / 2;
    Ec.pos.x = (cx + hx) / 2; Ec.pos.y = (cy + hy) / 2;

    float ng = sqrt((nx - G.pos.x) * (nx - G.pos.x) + (ny - G.pos.y) * (ny - G.pos.y));
    float gh = sqrt((G.pos.x - hx) * (G.pos.x - hx) + (G.pos.y - hy) * (G.pos.y - hy));
    info = "**N — центр окружности девяти точек**, проходящей через середины сторон (Ma, Mb, Mc), основания высот (Fa, Fb, Fc) и середины отрезков от вершин до ортоцентра H (Ea, Eb, Ec). Радиус окружности R₉ = " + format(nr, 2) + " — вдвое меньше радиуса описанной окружности.\n\n**N лежит на прямой Эйлера** и делит отрезок OH пополам: ON = NH = " + num(sqrt((nx - ox) * (nx - ox) + (ny - oy) * (ny - oy)), 2) + ". Центроид G делит отрезок OH в отношении OG : GH = " + num(sqrt((ox - G.pos.x) * (ox - G.pos.x) + (oy - G.pos.y) * (oy - G.pos.y)), 2) + " : " + num(gh, 2) + " ≈ 1 : 2.";
  }
}
]
