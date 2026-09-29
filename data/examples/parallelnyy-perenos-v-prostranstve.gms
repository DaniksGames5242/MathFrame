[
description = "{info}"

field width = 16; field height = 16; field depth = 16;
show grid = false; show axes = true;
camera start rot = (-30, 62);
camera start zoom = 0.95;

// Перенос на вектор t₁ (синий), затем на t₂ (оранжевый): композиция — перенос на t₁ + t₂ (зелёный). Концы векторов T₁, T₂ перетаскиваются.
new Point3D { name = "A"; pos = (-1.5, -1, 1); pauseOnDrag = false; text = true("A") }
new Point3D { name = "B"; pos = (-0.5, 1, 1.5); pauseOnDrag = false; text = true("B") }
new Point3D { name = "C"; pos = (0.5, -0.5, -1.5); pauseOnDrag = false; text = true("C") }
new Point3D { name = "D"; pos = (1, 1.5, 0); pauseOnDrag = false; text = true("D") }
new Point3D { name = "T1"; pos = (3, 1, 0); pauseOnDrag = false; text = true("t₁"); color = #3b82f6 }
new Point3D { name = "T2"; pos = (0, 2, 3); pauseOnDrag = false; text = true("t₂"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("t₁ + t₂"); color = #22c55e }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A₁"); color = #3b82f6 }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B₁"); color = #3b82f6 }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C₁"); color = #3b82f6 }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D₁"); color = #3b82f6 }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A₂"); color = #22c55e }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B₂"); color = #22c55e }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C₂"); color = #22c55e }
new Point3D { name = "D2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D₂"); color = #22c55e }
new Line3D { name = "oAB"; pos = (A, B); interact = false; thickness = 2 }
new Line3D { name = "oAC"; pos = (A, C); interact = false; thickness = 2 }
new Line3D { name = "oAD"; pos = (A, D); interact = false; thickness = 2 }
new Line3D { name = "oBC"; pos = (B, C); interact = false; thickness = 2 }
new Line3D { name = "oBD"; pos = (B, D); interact = false; thickness = 2 }
new Line3D { name = "oCD"; pos = (C, D); interact = false; thickness = 2 }
new Line3D { name = "iAB"; pos = (A1, B1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "iAC"; pos = (A1, C1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "iAD"; pos = (A1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "iBC"; pos = (B1, C1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "iBD"; pos = (B1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "iCD"; pos = (C1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "jAB"; pos = (A2, B2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "jAC"; pos = (A2, C2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "jAD"; pos = (A2, D2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "jBC"; pos = (B2, C2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "jBD"; pos = (B2, D2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "jCD"; pos = (C2, D2); interact = false; thickness = 2; color = #22c55e }
new Line3D { name = "vt1"; pos = (O, T1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "vt2"; pos = (O, T2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "vts"; pos = (O, S); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "pA"; pos = (A, A1); interact = false; thickness = 1; color = #3b82f6 }
new Line3D { name = "qA"; pos = (A1, A2); interact = false; thickness = 1; color = #f59e0b }
new Line3D { name = "pB"; pos = (B, B1); interact = false; thickness = 1; color = #3b82f6 }
new Line3D { name = "qB"; pos = (B1, B2); interact = false; thickness = 1; color = #f59e0b }
new Line3D { name = "pC"; pos = (C, C1); interact = false; thickness = 1; color = #3b82f6 }
new Line3D { name = "qC"; pos = (C1, C2); interact = false; thickness = 1; color = #f59e0b }
new Line3D { name = "pD"; pos = (D, D1); interact = false; thickness = 1; color = #3b82f6 }
new Line3D { name = "qD"; pos = (D1, D2); interact = false; thickness = 1; color = #f59e0b }
new Line3D { name = "rA"; pos = (A, A2); interact = false; thickness = 2; color = #22c55e }
draw Vector3D { name = "av1"; edge = "vt1"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "av2"; edge = "vt2"; pos = 1; color = #f59e0b }
draw Vector3D { name = "av3"; edge = "vts"; pos = 1; color = #22c55e }

string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P, m) { if (P.pos.x > m) { P.pos.x = m; } if (P.pos.x < -m) { P.pos.x = -m; } if (P.pos.y > m) { P.pos.y = m; } if (P.pos.y < -m) { P.pos.y = -m; } if (P.pos.z > m) { P.pos.z = m; } if (P.pos.z < -m) { P.pos.z = -m; } }
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function sv(P, Q, R, S) { float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z; float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z; float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z; return (ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6; }
Function co(P) { return "(" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + "; " + num(P.pos.z, 2) + ")"; }

Update {
  clampP(A, 2); clampP(B, 2); clampP(C, 2); clampP(D, 2); clampP(T1, 3); clampP(T2, 3);
  S.pos.x = T1.pos.x + T2.pos.x; S.pos.y = T1.pos.y + T2.pos.y; S.pos.z = T1.pos.z + T2.pos.z;
  A1.pos.x = A.pos.x + T1.pos.x; A1.pos.y = A.pos.y + T1.pos.y; A1.pos.z = A.pos.z + T1.pos.z;
  A2.pos.x = A1.pos.x + T2.pos.x; A2.pos.y = A1.pos.y + T2.pos.y; A2.pos.z = A1.pos.z + T2.pos.z;
  B1.pos.x = B.pos.x + T1.pos.x; B1.pos.y = B.pos.y + T1.pos.y; B1.pos.z = B.pos.z + T1.pos.z;
  B2.pos.x = B1.pos.x + T2.pos.x; B2.pos.y = B1.pos.y + T2.pos.y; B2.pos.z = B1.pos.z + T2.pos.z;
  C1.pos.x = C.pos.x + T1.pos.x; C1.pos.y = C.pos.y + T1.pos.y; C1.pos.z = C.pos.z + T1.pos.z;
  C2.pos.x = C1.pos.x + T2.pos.x; C2.pos.y = C1.pos.y + T2.pos.y; C2.pos.z = C1.pos.z + T2.pos.z;
  D1.pos.x = D.pos.x + T1.pos.x; D1.pos.y = D.pos.y + T1.pos.y; D1.pos.z = D.pos.z + T1.pos.z;
  D2.pos.x = D1.pos.x + T2.pos.x; D2.pos.y = D1.pos.y + T2.pos.y; D2.pos.z = D1.pos.z + T2.pos.z;
  float v0 = sv(A, B, C, D); float v1 = sv(A1, B1, C1, D1);
  info = "**Параллельный перенос** на вектор t = (t_x; t_y; t_z) сдвигает каждую точку на один и тот же вектор: x′ = x + t_x, y′ = y + t_y, z′ = z + t_z.\n\n";
  info = info + "При t₁ = " + co(T1) + ": A" + co(A) + " ↦ A₁" + co(A1) + ". Все смещения равны |t₁| = " + format(dist(O, T1), 2) + ": AA₁ = " + format(dist(A, A1), 2) + ", BB₁ = " + format(dist(B, B1), 2) + ", CC₁ = " + format(dist(C, C1), 2) + ", DD₁ = " + format(dist(D, D1), 2) + ". Расстояния сохраняются: AB = " + format(dist(A, B), 2) + " = A₁B₁ = " + format(dist(A1, B1), 2) + "; ориентация тоже: V(ABCD) = " + num(v0, 2) + ", V(A₁B₁C₁D₁) = " + num(v1, 2) + ".\n\n";
  info = info + "**Композиция.** После переноса на t₂ = " + co(T2) + " точка A₁ переходит в A₂" + co(A2) + " = A + (t₁ + t₂), где t₁ + t₂ = " + co(S) + ", |t₁ + t₂| = " + format(dist(O, S), 2) + "; порядок переносов не важен, так как t₁ + t₂ = t₂ + t₁. Обратный перенос на −t₁ возвращает A₁ в A.";
}
]
