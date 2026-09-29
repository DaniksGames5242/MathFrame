[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (30, 55);
camera start zoom = 1.3;

// ---- Треугольник ABC (вершины свободны) проектируется на плоскость π (y = −1,8) параллельными
// лучами. Направление лучей задают ползунки: θ — угол лучей с π (θ = 90° — перпендикулярное
// проектирование), φ — азимут. A', B', C' — образы вершин. ----
new Point3D { name = "A"; pos = (-1.2, 0.6, -0.8); text = true("A"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (1.2, 0.2, -0.4); text = true("B"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "C"; pos = (0.2, 0.8, 1.2); text = true("C"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "A1"; pos = (0, -1.8, 0); text = true("A'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "B1"; pos = (0, -1.8, 0); text = true("B'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "C1"; pos = (0, -1.8, 0); text = true("C'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "G1"; pos = (-3, -1.8, -3); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (3, -1.8, -3); dynamic = false; collision = false; active = false }
new Point3D { name = "G3"; pos = (-3, -1.8, 3); dynamic = false; collision = false; active = false }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "ca"; pos = (C, A); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "a1b1"; pos = (A1, B1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "b1c1"; pos = (B1, C1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "c1a1"; pos = (C1, A1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "ra"; pos = (A, A1); interact = false; thickness = 1.5 }
new Line3D { name = "rb"; pos = (B, B1); interact = false; thickness = 1.5 }
new Line3D { name = "rc"; pos = (C, C1); interact = false; thickness = 1.5 }
draw Punctir { name = "punA"; edge = "ra" }
draw Punctir { name = "punB"; edge = "rb" }
draw Punctir { name = "punC"; edge = "rc" }
draw InfPlane { name = "pi"; points = (G1, G2, G3); size = 4.4; opacity = 0.12; color = #22c55e }

new UI { name = "sTh"; type = slider; label = "угол лучей с плоскостью π, °"; variable = th; min = 50; max = 90; step = 1; default = 62 }
new UI { name = "sPh"; type = slider; label = "азимут лучей, °"; variable = ph; min = 0; max = 359; step = 1; default = 35 }

string info = "";
float th = 62; float ph = 35;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inB(x, y, z) { return abs(x) <= 1.5 && y >= -1.2 && y <= 1.2 && abs(z) <= 1.5; }
Function dst(x1, y1, z1, x2, y2, z2) { return sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2)); }
// Угол при вершине (x2, y2, z2) между лучами к первой и третьей точкам, в градусах.
Function ang(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  float ux = x1 - x2; float uy = y1 - y2; float uz = z1 - z2;
  float vx = x3 - x2; float vy = y3 - y2; float vz = z3 - z2;
  float c = (ux * vx + uy * vy + uz * vz) / (sqrt(ux * ux + uy * uy + uz * uz) * sqrt(vx * vx + vy * vy + vz * vz));
  return degrees(acos(max(-1, min(1, c))));
}
// Допустимо: вершины в области над π, треугольник не вырожден.
Function ok() {
  if (!inB(A.pos.x, A.pos.y, A.pos.z) || !inB(B.pos.x, B.pos.y, B.pos.z) || !inB(C.pos.x, C.pos.y, C.pos.z)) { return false; }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  return sqrt(nx * nx + ny * ny + nz * nz) >= 0.6 && dst(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z) >= 0.6 && dst(B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z) >= 0.6 && dst(C.pos.x, C.pos.y, C.pos.z, A.pos.x, A.pos.y, A.pos.z) >= 0.6;
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
}

Update {
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz;
  }
  // Образ точки: сдвиг по горизонтали (высота над π) / tg θ в направлении азимута.
  float kx = cos(radians(ph)) / tan(radians(th)); float kz = sin(radians(ph)) / tan(radians(th));
  A1.pos.x = A.pos.x + (A.pos.y + 1.8) * kx; A1.pos.z = A.pos.z + (A.pos.y + 1.8) * kz; A1.pos.y = -1.8;
  B1.pos.x = B.pos.x + (B.pos.y + 1.8) * kx; B1.pos.z = B.pos.z + (B.pos.y + 1.8) * kz; B1.pos.y = -1.8;
  C1.pos.x = C.pos.x + (C.pos.y + 1.8) * kx; C1.pos.z = C.pos.z + (C.pos.y + 1.8) * kz; C1.pos.y = -1.8;

  float lab = dst(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z);
  float lab1 = dst(A1.pos.x, A1.pos.y, A1.pos.z, B1.pos.x, B1.pos.y, B1.pos.z);
  float lbc = dst(B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z);
  float lbc1 = dst(B1.pos.x, B1.pos.y, B1.pos.z, C1.pos.x, C1.pos.y, C1.pos.z);
  float lca = dst(C.pos.x, C.pos.y, C.pos.z, A.pos.x, A.pos.y, A.pos.z);
  float lca1 = dst(C1.pos.x, C1.pos.y, C1.pos.z, A1.pos.x, A1.pos.y, A1.pos.z);
  float angB = ang(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z);
  float angB1 = ang(A1.pos.x, A1.pos.y, A1.pos.z, B1.pos.x, B1.pos.y, B1.pos.z, C1.pos.x, C1.pos.y, C1.pos.z);
  float ray = dst(A.pos.x, A.pos.y, A.pos.z, A1.pos.x, A1.pos.y, A1.pos.z);

  info = "**Параллельное проектирование.** Точки треугольника ABC (синий) проектируются на плоскость π (зелёная) лучами, параллельными друг другу: образы A', B', C' (жёлтый) лежат на лучах, проведённых через вершины в одном и том же направлении. ";
  if (th > 89.5) {
    info = info + "Лучи составляют с π угол θ = 90°: проектирование **перпендикулярное (ортогональное)**.\n\n";
  } else {
    info = info + "Лучи составляют с π угол θ = " + num(th, 0) + "° ≠ 90°: проектирование **наклонное (косоугольное)**.\n\n";
  }
  info = info + "Длины: AB = " + num(lab, 2) + " → A'B' = " + num(lab1, 2) + ", BC = " + num(lbc, 2) + " → B'C' = " + num(lbc1, 2) + ", CA = " + num(lca, 2) + " → C'A' = " + num(lca1, 2) + "; угол ∠ABC = " + num(angB, 0) + "° → ∠A'B'C' = " + num(angB1, 0) + "°. Отрезок, параллельный плоскости π (его концы на одной высоте), изображается без искажения; остальные длины и углы, вообще говоря, меняются.\n\n";
  info = info + "В любом положении параллельные лучи сохраняют параллельность: параллельные прямые изображаются параллельными; единой точки схода, как при центральном проектировании, нет (длина луча AA' = " + num(ray, 2) + ").";
}
]
