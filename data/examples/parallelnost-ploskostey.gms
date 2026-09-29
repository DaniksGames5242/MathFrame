[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

new UI { name = "sH"; type = slider; label = "сдвиг β вдоль нормали, h"; variable = h; min = -3; max = 3; step = 0.1; default = 2 }

// ---- Плоскость α = P1P2P3 (точки свободны). Плоскость β получена сдвигом α на h вдоль
// нормали: нормали коллинеарны, расстояние между плоскостями равно |h|. Третья плоскость γ
// проходит через P1, P2 и свободную точку W и пересекает α и β по параллельным прямым. ----
new Point3D { name = "P1"; pos = (-3, -1.5, -2.5); text = true("P1"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P2"; pos = (3, -1, -2); text = true("P2"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P3"; pos = (0, -1, 3); text = true("P3"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "W"; pos = (-1, 2.5, -1); text = true("W"); color = #22c55e; pauseOnDrag = false }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; color = #f59e0b }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; color = #f59e0b }
new Point3D { name = "T3"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; color = #f59e0b }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "D2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "alpha"; points = (P1, P2, P3); size = 3.2; opacity = 0.2; color = #3b82f6 }
draw InfPlane { name = "beta"; points = (T1, T2, T3); size = 3.2; opacity = 0.2; color = #f59e0b }
draw InfPlane { name = "gamma"; points = (P1, P2, W); size = 2.6; opacity = 0.1; color = #22c55e }
new Line3D { name = "c1"; pos = (C1, C2); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "c2"; pos = (D1, D2); interact = false; thickness = 3; color = #22c55e; active = showD }
new Line3D { name = "h1"; pos = (P2, T2); interact = false }
new Line3D { name = "h2"; pos = (P3, T3); interact = false }
draw Punctir { name = "punH1"; edge = "h1" }
draw Punctir { name = "punH2"; edge = "h2" }

string info = "";
float h = 2; float showD = 0;
float p1x = 0; float p1y = 0; float p1z = 0; float p2x = 0; float p2y = 0; float p2z = 0;
float p3x = 0; float p3y = 0; float p3z = 0; float pwx = 0; float pwy = 0; float pwz = 0;

Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, hh) {
  if (d > 0.000001) { return (hh - m) / d; }
  if (d < -0.000001) { return (-hh - m) / d; }
  return 1000;
}
// Допустимо: P1 ≠ P2, треугольник P1P2P3 невырожден, W не ближе 0,9 к плоскости α.
Function ok() {
  float ux = P2.pos.x - P1.pos.x; float uy = P2.pos.y - P1.pos.y; float uz = P2.pos.z - P1.pos.z;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  float cl = sqrt(cx * cx + cy * cy + cz * cz);
  if (ux * ux + uy * uy + uz * uz < 2.25 || cl < 3) { return false; }
  float s = (cx * (W.pos.x - P1.pos.x) + cy * (W.pos.y - P1.pos.y) + cz * (W.pos.z - P1.pos.z)) / cl;
  return abs(s) >= 0.9;
}

Start {
  p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
  p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pwx = W.pos.x; pwy = W.pos.y; pwz = W.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(P1.pos.x) > 4.3 || abs(P1.pos.y) > 4.3 || abs(P1.pos.z) > 4.3) { P1.pos.x = cl4(P1.pos.x); P1.pos.y = cl4(P1.pos.y); P1.pos.z = cl4(P1.pos.z); }
  if (abs(P2.pos.x) > 4.3 || abs(P2.pos.y) > 4.3 || abs(P2.pos.z) > 4.3) { P2.pos.x = cl4(P2.pos.x); P2.pos.y = cl4(P2.pos.y); P2.pos.z = cl4(P2.pos.z); }
  if (abs(P3.pos.x) > 4.3 || abs(P3.pos.y) > 4.3 || abs(P3.pos.z) > 4.3) { P3.pos.x = cl4(P3.pos.x); P3.pos.y = cl4(P3.pos.y); P3.pos.z = cl4(P3.pos.z); }
  if (abs(W.pos.x) > 4.3 || abs(W.pos.y) > 4.3 || abs(W.pos.z) > 4.3) { W.pos.x = cl4(W.pos.x); W.pos.y = cl4(W.pos.y); W.pos.z = cl4(W.pos.z); }
  if (ok()) {
    p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
    p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pwx = W.pos.x; pwy = W.pos.y; pwz = W.pos.z;
  } else {
    P1.pos.x = p1x; P1.pos.y = p1y; P1.pos.z = p1z; P2.pos.x = p2x; P2.pos.y = p2y; P2.pos.z = p2z;
    P3.pos.x = p3x; P3.pos.y = p3y; P3.pos.z = p3z; W.pos.x = pwx; W.pos.y = pwy; W.pos.z = pwz;
  }
  float bx = P2.pos.x - P1.pos.x; float by = P2.pos.y - P1.pos.y; float bz = P2.pos.z - P1.pos.z;
  float bl = sqrt(bx * bx + by * by + bz * bz); bx = bx / bl; by = by / bl; bz = bz / bl;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float nx = by * vz - bz * vy; float ny = bz * vx - bx * vz; float nz = bx * vy - by * vx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz); nx = nx / nl; ny = ny / nl; nz = nz / nl;
  // β — плоскость α, сдвинутая на h вдоль нормали.
  T1.pos.x = P1.pos.x + h * nx; T1.pos.y = P1.pos.y + h * ny; T1.pos.z = P1.pos.z + h * nz;
  T2.pos.x = P2.pos.x + h * nx; T2.pos.y = P2.pos.y + h * ny; T2.pos.z = P2.pos.z + h * nz;
  T3.pos.x = P3.pos.x + h * nx; T3.pos.y = P3.pos.y + h * ny; T3.pos.z = P3.pos.z + h * nz;
  // Линия пересечения γ с α — P1P2 (на всю ширину поля).
  float a1 = min(tb(P1.pos.x, -bx, 4.3), tb(P1.pos.y, -by, 4.3), tb(P1.pos.z, -bz, 4.3));
  float a2 = min(tb(P1.pos.x, bx, 4.3), tb(P1.pos.y, by, 4.3), tb(P1.pos.z, bz, 4.3));
  C1.pos.x = P1.pos.x - bx * a1; C1.pos.y = P1.pos.y - by * a1; C1.pos.z = P1.pos.z - bz * a1;
  C2.pos.x = P1.pos.x + bx * a2; C2.pos.y = P1.pos.y + by * a2; C2.pos.z = P1.pos.z + bz * a2;
  // e — единичный вектор в γ, перпендикулярный P1P2; линия γ ∩ β проходит через P1 + (h / (e · n)) e.
  float wx = W.pos.x - P1.pos.x; float wy = W.pos.y - P1.pos.y; float wz = W.pos.z - P1.pos.z;
  float wb = wx * bx + wy * by + wz * bz;
  float ex = wx - wb * bx; float ey = wy - wb * by; float ez = wz - wb * bz;
  float el = sqrt(ex * ex + ey * ey + ez * ez); ex = ex / el; ey = ey / el; ez = ez / el;
  float en = ex * nx + ey * ny + ez * nz;
  float mx = P1.pos.x + h / en * ex; float my = P1.pos.y + h / en * ey; float mz = P1.pos.z + h / en * ez;
  showD = 0;
  if (abs(h) > 0.05 && abs(mx) < 4.3 && abs(my) < 4.3 && abs(mz) < 4.3) {
    showD = 1;
    float d1 = min(tb(mx, -bx, 4.3), tb(my, -by, 4.3), tb(mz, -bz, 4.3));
    float d2 = min(tb(mx, bx, 4.3), tb(my, by, 4.3), tb(mz, bz, 4.3));
    D1.pos.x = mx - bx * d1; D1.pos.y = my - by * d1; D1.pos.z = mz - bz * d1;
    D2.pos.x = mx + bx * d2; D2.pos.y = my + by * d2; D2.pos.z = mz + bz * d2;
  }

  info = "**Параллельность плоскостей.** Плоскости α (синяя) и β (жёлтая) параллельны, если у них нет общих точек. Нормали (" + num(nx, 2) + "; " + num(ny, 2) + "; " + num(nz, 2) + ") у обеих одинаковы — коллинеарны, поэтому плоскости параллельны.\n\n";
  if (abs(h) < 0.05) {
    info = info + "Сейчас h = 0: плоскости **совпали** — бесконечно много общих точек, это отдельный случай, а не параллельность.";
  } else {
    info = info + "**Расстояние между плоскостями** одинаково для любой точки α: перпендикуляры из P2 и P3 (пунктир) к β равны " + num(abs(h), 2) + ".\n\n";
    info = info + "Плоскость γ (зелёная) пересекает α по прямой P1P2 и β по параллельной ей прямой: лежат в одной плоскости и не пересекаются, ведь α и β общих точек не имеют.";
    if (showD < 0.5) { info = info + " Вторая прямая сейчас вне поля."; }
  }
}
]
