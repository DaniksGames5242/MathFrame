[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

new UI { name = "sPsi"; type = slider; label = "поворот a вокруг A, °"; variable = psi; min = 0; max = 180; step = 1; default = 35 }
new UI { name = "sU"; type = slider; label = "точка Y на a"; variable = u; min = -4; max = 4; step = 0.1; default = 2 }

// ---- Плоскость α = P1P2P3 и прямая a ∥ α через свободную точку A: направление a лежит
// в α (s · n = 0), поворот ползунком. Показаны: расстояния от A и Y до α (равны),
// проекция a′ прямой a на α и прямая g через P3, параллельная a (она лежит в α). ----
new Point3D { name = "P1"; pos = (-3, -1.5, -2.5); text = true("P1"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P2"; pos = (3, -1, -2); text = true("P2"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P3"; pos = (0, -0.5, 3); text = true("P3"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "A"; pos = (-1, 2, 0); text = true("A"); pauseOnDrag = false }
new Point3D { name = "Y"; pos = (0, 0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("Y") }
new Point3D { name = "F"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08 }
new Point3D { name = "FY"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08 }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "K1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "K2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "alpha"; points = (P1, P2, P3); size = 3.6; opacity = 0.2; color = #3b82f6 }
new Line3D { name = "la"; pos = (L1, L2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "lp"; pos = (K1, K2); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "lg"; pos = (G1, G2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "af"; pos = (A, F); interact = false }
new Line3D { name = "yf"; pos = (Y, FY); interact = false }
draw Punctir { name = "punAf"; edge = "af" }
draw Punctir { name = "punYf"; edge = "yf" }

string info = "";
float psi = 35; float u = 2;
float p1x = 0; float p1y = 0; float p1z = 0; float p2x = 0; float p2y = 0; float p2z = 0;
float p3x = 0; float p3y = 0; float p3z = 0; float pax = 0; float pay = 0; float paz = 0;

Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
// Допустимо: P1 ≠ P2, треугольник P1P2P3 невырожден, A не ближе 0,9 к плоскости.
Function ok() {
  float ux = P2.pos.x - P1.pos.x; float uy = P2.pos.y - P1.pos.y; float uz = P2.pos.z - P1.pos.z;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  float cl = sqrt(cx * cx + cy * cy + cz * cz);
  if (ux * ux + uy * uy + uz * uz < 2.25 || cl < 3) { return false; }
  float s = (cx * (A.pos.x - P1.pos.x) + cy * (A.pos.y - P1.pos.y) + cz * (A.pos.z - P1.pos.z)) / cl;
  return abs(s) >= 0.9;
}

Start {
  p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
  p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(P1.pos.x) > 4.3 || abs(P1.pos.y) > 4.3 || abs(P1.pos.z) > 4.3) { P1.pos.x = cl4(P1.pos.x); P1.pos.y = cl4(P1.pos.y); P1.pos.z = cl4(P1.pos.z); }
  if (abs(P2.pos.x) > 4.3 || abs(P2.pos.y) > 4.3 || abs(P2.pos.z) > 4.3) { P2.pos.x = cl4(P2.pos.x); P2.pos.y = cl4(P2.pos.y); P2.pos.z = cl4(P2.pos.z); }
  if (abs(P3.pos.x) > 4.3 || abs(P3.pos.y) > 4.3 || abs(P3.pos.z) > 4.3) { P3.pos.x = cl4(P3.pos.x); P3.pos.y = cl4(P3.pos.y); P3.pos.z = cl4(P3.pos.z); }
  if (abs(A.pos.x) > 4.3 || abs(A.pos.y) > 4.3 || abs(A.pos.z) > 4.3) { A.pos.x = cl4(A.pos.x); A.pos.y = cl4(A.pos.y); A.pos.z = cl4(A.pos.z); }
  if (ok()) {
    p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
    p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  } else {
    P1.pos.x = p1x; P1.pos.y = p1y; P1.pos.z = p1z; P2.pos.x = p2x; P2.pos.y = p2y; P2.pos.z = p2z;
    P3.pos.x = p3x; P3.pos.y = p3y; P3.pos.z = p3z; A.pos.x = pax; A.pos.y = pay; A.pos.z = paz;
  }
  float bx = P2.pos.x - P1.pos.x; float by = P2.pos.y - P1.pos.y; float bz = P2.pos.z - P1.pos.z;
  float bl = sqrt(bx * bx + by * by + bz * bz); bx = bx / bl; by = by / bl; bz = bz / bl;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float nx = by * vz - bz * vy; float ny = bz * vx - bx * vz; float nz = bx * vy - by * vx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz); nx = nx / nl; ny = ny / nl; nz = nz / nl;
  float cx = ny * bz - nz * by; float cy = nz * bx - nx * bz; float cz = nx * by - ny * bx;
  float cp = cos(psi * pi / 180); float sp = sin(psi * pi / 180);
  // s — направляющий вектор a: лежит в плоскости, параллельной α.
  float dx = cp * bx + sp * cx; float dy = cp * by + sp * cy; float dz = cp * bz + sp * cz;
  float sA = nx * (A.pos.x - P1.pos.x) + ny * (A.pos.y - P1.pos.y) + nz * (A.pos.z - P1.pos.z);

  float t1 = min(tb(A.pos.x, -dx, 4.3), tb(A.pos.y, -dy, 4.3), tb(A.pos.z, -dz, 4.3));
  float t2 = min(tb(A.pos.x, dx, 4.3), tb(A.pos.y, dy, 4.3), tb(A.pos.z, dz, 4.3));
  L1.pos.x = A.pos.x - dx * t1; L1.pos.y = A.pos.y - dy * t1; L1.pos.z = A.pos.z - dz * t1;
  L2.pos.x = A.pos.x + dx * t2; L2.pos.y = A.pos.y + dy * t2; L2.pos.z = A.pos.z + dz * t2;
  // Точка Y на a (в пределах поля) и основания перпендикуляров на α.
  float uy = max(-t1, min(t2, u));
  Y.pos.x = A.pos.x + dx * uy; Y.pos.y = A.pos.y + dy * uy; Y.pos.z = A.pos.z + dz * uy;
  float sY = nx * (Y.pos.x - P1.pos.x) + ny * (Y.pos.y - P1.pos.y) + nz * (Y.pos.z - P1.pos.z);
  F.pos.x = A.pos.x - sA * nx; F.pos.y = A.pos.y - sA * ny; F.pos.z = A.pos.z - sA * nz;
  FY.pos.x = Y.pos.x - sY * nx; FY.pos.y = Y.pos.y - sY * ny; FY.pos.z = Y.pos.z - sY * nz;
  // Проекция a′ (через F) и прямая g через P3, обе параллельны a; концы — на границе поля.
  float k1 = min(tb(F.pos.x, -dx, 4.3), tb(F.pos.y, -dy, 4.3), tb(F.pos.z, -dz, 4.3));
  float k2 = min(tb(F.pos.x, dx, 4.3), tb(F.pos.y, dy, 4.3), tb(F.pos.z, dz, 4.3));
  K1.pos.x = F.pos.x - dx * k1; K1.pos.y = F.pos.y - dy * k1; K1.pos.z = F.pos.z - dz * k1;
  K2.pos.x = F.pos.x + dx * k2; K2.pos.y = F.pos.y + dy * k2; K2.pos.z = F.pos.z + dz * k2;
  float g1 = min(tb(P3.pos.x, -dx, 4.3), tb(P3.pos.y, -dy, 4.3), tb(P3.pos.z, -dz, 4.3));
  float g2 = min(tb(P3.pos.x, dx, 4.3), tb(P3.pos.y, dy, 4.3), tb(P3.pos.z, dz, 4.3));
  G1.pos.x = P3.pos.x - dx * g1; G1.pos.y = P3.pos.y - dy * g1; G1.pos.z = P3.pos.z - dz * g1;
  G2.pos.x = P3.pos.x + dx * g2; G2.pos.y = P3.pos.y + dy * g2; G2.pos.z = P3.pos.z + dz * g2;

  float sn = dx * nx + dy * ny + dz * nz;
  info = "**Свойства параллельности прямой и плоскости.** Прямая a (жёлтая) параллельна плоскости α = P1P2P3: её направляющий вектор s = (" + num(dx, 2) + "; " + num(dy, 2) + "; " + num(dz, 2) + ") ортогонален нормали n = (" + num(nx, 2) + "; " + num(ny, 2) + "; " + num(nz, 2) + "), s · n = " + num(abs(sn), 2) + ".\n\n";
  info = info + "**Расстояние постоянно:** от A до α — " + num(abs(sA), 2) + ", от Y до α — " + num(abs(sY), 2) + " (точка Y движется по a), это и есть расстояние между прямой и плоскостью. Параллельный перенос a вдоль нормали (перемещение A) не нарушает параллельности.\n\n";
  info = info + "Ортогональная проекция a на α — прямая a′ (синяя) — параллельна a; прямая g через точку P3 параллельно a (зелёная) лежит в α.";
}
]
