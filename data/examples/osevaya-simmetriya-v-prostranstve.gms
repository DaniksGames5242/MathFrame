[
description = "{info}"

field width = 14; field height = 12; field depth = 14;
show grid = false; show axes = false;
camera start rot = (-30, 62);
camera start zoom = 1.1;

// Осевая симметрия относительно прямой PQ: образ X′ = 2H − X, где H — основание перпендикуляра из X на ось. Точки P и Q тоже перетаскиваются.
new Point3D { name = "A"; pos = (-2, 1, 1.5); pauseOnDrag = false; text = true("A"); color = #3b82f6 }
new Point3D { name = "B"; pos = (-1, 2, -1.5); pauseOnDrag = false; text = true("B"); color = #3b82f6 }
new Point3D { name = "C"; pos = (1, 1.5, 2); pauseOnDrag = false; text = true("C"); color = #3b82f6 }
new Point3D { name = "D"; pos = (0.5, 2.5, 0); pauseOnDrag = false; text = true("D"); color = #3b82f6 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A′"); color = #f59e0b }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B′"); color = #f59e0b }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C′"); color = #f59e0b }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D′"); color = #f59e0b }
new Point3D { name = "P"; pos = (-3, -2, 0); pauseOnDrag = false; text = true("P"); color = #22c55e }
new Point3D { name = "Q"; pos = (2, -2.5, 1); pauseOnDrag = false; text = true("Q"); color = #22c55e }
new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "HA"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "HB"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "HC"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point3D { name = "HD"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
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
new Line3D { name = "ax"; pos = (E1, E2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "mA"; pos = (A, A1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mB"; pos = (B, B1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mC"; pos = (C, C1); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "mD"; pos = (D, D1); interact = false; thickness = 1; color = #22c55e }

string info = "";
float ux = 1; float uy = 0; float uz = 0; float px = -3; float py = -2; float pz = 0; float qx = 2; float qy = -2.5; float qz = 1;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P, m) { if (P.pos.x > m) { P.pos.x = m; } if (P.pos.x < -m) { P.pos.x = -m; } if (P.pos.y > m) { P.pos.y = m; } if (P.pos.y < -m) { P.pos.y = -m; } if (P.pos.z > m) { P.pos.z = m; } if (P.pos.z < -m) { P.pos.z = -m; } }
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function sv(P, Q, R, S) { float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z; float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z; float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z; return (ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6; }
Function z0(x) { if (abs(x) < 0.005) { return 0; } return x; }
Function ft(X, k) { float s = (X.pos.x - P.pos.x) * ux + (X.pos.y - P.pos.y) * uy + (X.pos.z - P.pos.z) * uz; if (k == 0) { return P.pos.x + s * ux; } if (k == 1) { return P.pos.y + s * uy; } return P.pos.z + s * uz; }
Function co(X) { return "(" + num(X.pos.x, 2) + "; " + num(X.pos.y, 2) + "; " + num(X.pos.z, 2) + ")"; }

Update {
  clampP(A, 3);
  clampP(B, 3);
  clampP(C, 3);
  clampP(D, 3);
  clampP(P, 3); clampP(Q, 3);
  if (dist(P, Q) < 2) { P.pos.x = px; P.pos.y = py; P.pos.z = pz; Q.pos.x = qx; Q.pos.y = qy; Q.pos.z = qz; }
  px = P.pos.x; py = P.pos.y; pz = P.pos.z; qx = Q.pos.x; qy = Q.pos.y; qz = Q.pos.z;
  float len = dist(P, Q); ux = (qx - px) / len; uy = (qy - py) / len; uz = (qz - pz) / len;
  E1.pos.x = px - 2.5 * ux; E1.pos.y = py - 2.5 * uy; E1.pos.z = pz - 2.5 * uz; E2.pos.x = qx + 2.5 * ux; E2.pos.y = qy + 2.5 * uy; E2.pos.z = qz + 2.5 * uz;
  HA.pos.x = ft(A, 0); HA.pos.y = ft(A, 1); HA.pos.z = ft(A, 2);
  HB.pos.x = ft(B, 0); HB.pos.y = ft(B, 1); HB.pos.z = ft(B, 2);
  HC.pos.x = ft(C, 0); HC.pos.y = ft(C, 1); HC.pos.z = ft(C, 2);
  HD.pos.x = ft(D, 0); HD.pos.y = ft(D, 1); HD.pos.z = ft(D, 2);
  A1.pos.x = 2 * ft(A, 0) - A.pos.x; A1.pos.y = 2 * ft(A, 1) - A.pos.y; A1.pos.z = 2 * ft(A, 2) - A.pos.z;
  B1.pos.x = 2 * ft(B, 0) - B.pos.x; B1.pos.y = 2 * ft(B, 1) - B.pos.y; B1.pos.z = 2 * ft(B, 2) - B.pos.z;
  C1.pos.x = 2 * ft(C, 0) - C.pos.x; C1.pos.y = 2 * ft(C, 1) - C.pos.y; C1.pos.z = 2 * ft(C, 2) - C.pos.z;
  D1.pos.x = 2 * ft(D, 0) - D.pos.x; D1.pos.y = 2 * ft(D, 1) - D.pos.y; D1.pos.z = 2 * ft(D, 2) - D.pos.z;
  float v0 = sv(A, B, C, D); float v1 = sv(A1, B1, C1, D1);
  float dp = z0((A1.pos.x - A.pos.x) * ux + (A1.pos.y - A.pos.y) * uy + (A1.pos.z - A.pos.z) * uz);
  info = "**Осевая симметрия** относительно прямой ℓ = PQ: образ X′ точки X лежит на том же расстоянии от оси, отрезок XX′ перпендикулярен ℓ и делится ею пополам в точке H. Точки оси неподвижны.\n\n";
  info = info + "A" + co(A) + " ↦ A′" + co(A1) + "; основание перпендикуляра H" + co(HA) + ". Расстояние до оси: AH = " + format(dist(A, HA), 2) + " = A′H = " + format(dist(A1, HA), 2) + "; AA′ ⟂ ℓ: (A′ − A)·u = " + format(dp, 2) + ".";
  if (dist(A, HA) < 0.05) { info = info + " Точка A лежит на оси, поэтому A′ = A."; }
  info = info + "\n\nРасстояния сохраняются: AB = " + format(dist(A, B), 2) + " = A′B′ = " + format(dist(A1, B1), 2) + ". Ориентация: V(ABCD) = " + num(v0, 2) + ", V(A′B′C′D′) = " + num(v1, 2) + ". Повторное отражение относительно той же оси возвращает A′ в A. В плоскости, перпендикулярной оси, действие то же, что у центральной симметрии относительно точки пересечения с осью (поворот на 180°).";
}
]
