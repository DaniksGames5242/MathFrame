[
description = "{info}"

field width = 16; field height = 16; field depth = 16;
show grid = false; show axes = false;
camera start rot = (-30, 62);
camera start zoom = 0.95;

// Отражение в плоскости n·x = d, n = (cos β cos α; sin β; cos β sin α): образ X′ = X − 2(n·X − d)n.
new Point3D { name = "A"; pos = (-1.5, 0.5, 1); pauseOnDrag = false; text = true("A"); color = #3b82f6 }
new Point3D { name = "B"; pos = (-0.5, 2, -1); pauseOnDrag = false; text = true("B"); color = #3b82f6 }
new Point3D { name = "C"; pos = (0.5, 0.5, 2); pauseOnDrag = false; text = true("C"); color = #3b82f6 }
new Point3D { name = "D"; pos = (1.5, 1.5, 0); pauseOnDrag = false; text = true("D"); color = #3b82f6 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A′"); color = #f59e0b }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B′"); color = #f59e0b }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C′"); color = #f59e0b }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D′"); color = #f59e0b }
new Point3D { name = "Q0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "FA"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Line3D { name = "oAB"; pos = (A, B); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "oAC"; pos = (A, C); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "oAD"; pos = (A, D); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "oBC"; pos = (B, C); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "oBD"; pos = (B, D); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "oCD"; pos = (C, D); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "iAB"; pos = (A1, B1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "iAC"; pos = (A1, C1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "iAD"; pos = (A1, D1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "iBC"; pos = (B1, C1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "iBD"; pos = (B1, D1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "iCD"; pos = (C1, D1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "aa"; pos = (A, A1); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "bb"; pos = (B, B1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "cc"; pos = (C, C1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "dd"; pos = (D, D1); interact = false; thickness = 1; color = #22c55e }
draw InfPlane { name = "mir"; points = (Q0, Q1, Q2); size = 6; opacity = 0.22; color = #22c55e }

new UI { type = slider; label = "азимут нормали α, °"; variable = al; min = -90; max = 90; step = 5; default = 30 }
new UI { type = slider; label = "наклон нормали β, °"; variable = be; min = -60; max = 60; step = 5; default = 15 }
new UI { type = slider; label = "смещение плоскости d"; variable = dd; min = -1.5; max = 1.5; step = 0.25; default = 0.5 }

string info = "";
float al = 30; float be = 15; float dd = 0.5; float nx = 1; float ny = 0; float nz = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P, m) { if (P.pos.x > m) { P.pos.x = m; } if (P.pos.x < -m) { P.pos.x = -m; } if (P.pos.y > m) { P.pos.y = m; } if (P.pos.y < -m) { P.pos.y = -m; } if (P.pos.z > m) { P.pos.z = m; } if (P.pos.z < -m) { P.pos.z = -m; } }
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function sv(P, Q, R, S) { float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z; float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z; float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z; return (ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6; }
Function sd(X) { return (X.pos.x * nx + X.pos.y * ny + X.pos.z * nz) - dd; }
Function co(X) { return "(" + num(X.pos.x, 2) + "; " + num(X.pos.y, 2) + "; " + num(X.pos.z, 2) + ")"; }

Update {
  clampP(A, 2.5);
  clampP(B, 2.5);
  clampP(C, 2.5);
  clampP(D, 2.5);
  float ra = al * pi / 180; float rb = be * pi / 180;
  nx = cos(rb) * cos(ra); ny = sin(rb); nz = cos(rb) * sin(ra);
  Q0.pos.x = dd * nx; Q0.pos.y = dd * ny; Q0.pos.z = dd * nz;
  Q1.pos.x = Q0.pos.x - 4 * sin(ra); Q1.pos.y = Q0.pos.y; Q1.pos.z = Q0.pos.z + 4 * cos(ra);
  Q2.pos.x = Q0.pos.x + 4 * sin(rb) * cos(ra); Q2.pos.y = Q0.pos.y - 4 * cos(rb); Q2.pos.z = Q0.pos.z + 4 * sin(rb) * sin(ra);
  FA.pos.x = A.pos.x - sd(A) * nx; FA.pos.y = A.pos.y - sd(A) * ny; FA.pos.z = A.pos.z - sd(A) * nz;
  A1.pos.x = A.pos.x - 2 * sd(A) * nx; A1.pos.y = A.pos.y - 2 * sd(A) * ny; A1.pos.z = A.pos.z - 2 * sd(A) * nz;
  B1.pos.x = B.pos.x - 2 * sd(B) * nx; B1.pos.y = B.pos.y - 2 * sd(B) * ny; B1.pos.z = B.pos.z - 2 * sd(B) * nz;
  C1.pos.x = C.pos.x - 2 * sd(C) * nx; C1.pos.y = C.pos.y - 2 * sd(C) * ny; C1.pos.z = C.pos.z - 2 * sd(C) * nz;
  D1.pos.x = D.pos.x - 2 * sd(D) * nx; D1.pos.y = D.pos.y - 2 * sd(D) * ny; D1.pos.z = D.pos.z - 2 * sd(D) * nz;
  float v0 = sv(A, B, C, D); float v1 = sv(A1, B1, C1, D1);
  info = "**Зеркальная симметрия** относительно плоскости " + num(nx, 2) + "·x + " + num(ny, 2) + "·y + " + num(nz, 2) + "·z = " + num(dd, 2) + ": образ точки лежит на том же перпендикуляре к плоскости на том же расстоянии, но по другую сторону.\n\n";
  if (al == 0 && be == 0 && dd == 0) { info = info + "Плоскость совпала с Oyz: (x; y; z) ↦ (−x; y; z) — первая координата меняет знак, остальные не меняются.\n\n"; }
  info = info + "A" + co(A) + " ↦ A′" + co(A1) + ". Знаковое расстояние до плоскости: " + num(sd(A), 2) + " у A и " + num(sd(A1), 2) + " у A′; середина AA′ — точка F" + co(FA) + " лежит на плоскости, AA′ ∥ n.\n\n";
  info = info + "Расстояния сохраняются: AB = " + format(dist(A, B), 2) + " = A′B′ = " + format(dist(A1, B1), 2) + ". Ориентация: V(ABCD) = " + num(v0, 2) + ", V(A′B′C′D′) = " + num(v1, 2) + ". Повторное отражение возвращает точку на место.";
}
]
