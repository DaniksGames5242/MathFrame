[
description = "{info}"

field width = 14; field height = 12; field depth = 14;
show grid = false; show axes = false;
camera start rot = (-30, 62);
camera start zoom = 1.1;

// Центральная симметрия относительно точки O: образ X′ = 2O − X. Точка O тоже перетаскивается.
new Point3D { name = "A"; pos = (-2.5, -1, 1); pauseOnDrag = false; text = true("A"); color = #3b82f6 }
new Point3D { name = "B"; pos = (-1, 1.5, 2); pauseOnDrag = false; text = true("B"); color = #3b82f6 }
new Point3D { name = "C"; pos = (-2, 0.5, -1.5); pauseOnDrag = false; text = true("C"); color = #3b82f6 }
new Point3D { name = "D"; pos = (-0.5, -2, -1); pauseOnDrag = false; text = true("D"); color = #3b82f6 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A′"); color = #f59e0b }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B′"); color = #f59e0b }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C′"); color = #f59e0b }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D′"); color = #f59e0b }
new Point3D { name = "O"; pos = (0.5, 0, 0); pauseOnDrag = false; text = true("O"); color = #22c55e }
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
new Line3D { name = "mA"; pos = (A, A1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mB"; pos = (B, B1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mC"; pos = (C, C1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mD"; pos = (D, D1); interact = false; thickness = 1; color = #22c55e }

string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P, m) { if (P.pos.x > m) { P.pos.x = m; } if (P.pos.x < -m) { P.pos.x = -m; } if (P.pos.y > m) { P.pos.y = m; } if (P.pos.y < -m) { P.pos.y = -m; } if (P.pos.z > m) { P.pos.z = m; } if (P.pos.z < -m) { P.pos.z = -m; } }
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function sv(P, Q, R, S) { float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z; float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z; float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z; return (ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6; }
Function co(P) { return "(" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + "; " + num(P.pos.z, 2) + ")"; }

Update {
  clampP(A, 3);
  clampP(B, 3);
  clampP(C, 3);
  clampP(D, 3);
  clampP(O, 1.5);
  A1.pos.x = 2 * O.pos.x - A.pos.x; A1.pos.y = 2 * O.pos.y - A.pos.y; A1.pos.z = 2 * O.pos.z - A.pos.z;
  B1.pos.x = 2 * O.pos.x - B.pos.x; B1.pos.y = 2 * O.pos.y - B.pos.y; B1.pos.z = 2 * O.pos.z - B.pos.z;
  C1.pos.x = 2 * O.pos.x - C.pos.x; C1.pos.y = 2 * O.pos.y - C.pos.y; C1.pos.z = 2 * O.pos.z - C.pos.z;
  D1.pos.x = 2 * O.pos.x - D.pos.x; D1.pos.y = 2 * O.pos.y - D.pos.y; D1.pos.z = 2 * O.pos.z - D.pos.z;
  float v0 = sv(A, B, C, D); float v1 = sv(A1, B1, C1, D1);
  info = "**Центральная симметрия** с центром O" + co(O) + " переводит каждую точку X в такую точку X′, что O — середина отрезка XX′: X′ = 2O − X. Все прямые XX′ проходят через O.\n\n";
  info = info + "A" + co(A) + " ↦ A′" + co(A1) + ". Середина AA′ = (" + num((A.pos.x + A1.pos.x) / 2, 2) + "; " + num((A.pos.y + A1.pos.y) / 2, 2) + "; " + num((A.pos.z + A1.pos.z) / 2, 2) + ") — это O; OA = " + format(dist(O, A), 2) + " = OA′ = " + format(dist(O, A1), 2) + ".";
  if (dist(O, A) < 0.05) { info = info + " Точка A совпала с центром — единственной неподвижной точкой, поэтому A′ = A."; }
  info = info + "\n\nРасстояния сохраняются: AB = " + format(dist(A, B), 2) + " = A′B′ = " + format(dist(A1, B1), 2) + ". Образ отрезка параллелен ему: для AB и A′B′ векторы противоположны.\n\n";
  info = info + "Ориентация: V(ABCD) = " + num(v0, 2) + ", V(A′B′C′D′) = " + num(v1, 2) + " — знаки противоположны: правая тройка переходит в левую. Повторная симметрия возвращает точку: 2O − A′ = (" + num(2 * O.pos.x - A1.pos.x, 2) + "; " + num(2 * O.pos.y - A1.pos.y, 2) + "; " + num(2 * O.pos.z - A1.pos.z, 2) + ") = A.";
}
]
