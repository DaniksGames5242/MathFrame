[
description = "{info}"

field width = 16; field height = 12; field depth = 12;
show grid = false; show axes = true;
camera start rot = (-30, 62);
camera start zoom = 1.05;

// Тетраэдр ABCD и его образ A′B′C′D′ при выбранном движении. Ось вращения и осевой симметрии — Oy, центр — начало координат.
new Point3D { name = "A"; pos = (-1.5, -1, 1.5); pauseOnDrag = false; text = true("A"); color = #3b82f6 }
new Point3D { name = "B"; pos = (1, -1.5, 1); pauseOnDrag = false; text = true("B"); color = #3b82f6 }
new Point3D { name = "C"; pos = (0.5, 1.5, 2.5); pauseOnDrag = false; text = true("C"); color = #3b82f6 }
new Point3D { name = "D"; pos = (2, 1, -1); pauseOnDrag = false; text = true("D"); color = #3b82f6 }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A′"); color = #f59e0b }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B′"); color = #f59e0b }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C′"); color = #f59e0b }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D′"); color = #f59e0b }
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

new UI { type = slider; label = "вид движения (1–6)"; variable = kind; min = 1; max = 6; step = 1; default = 1 }
new UI { type = slider; label = "сдвиг"; variable = p; min = -3; max = 3; step = 0.5; default = 2 }
new UI { type = slider; label = "угол поворота, °"; variable = ang; min = 0; max = 180; step = 15; default = 60 }

string info = "";
float kind = 1; float p = 2; float ang = 60; float ph = 1;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P, m) { if (P.pos.x > m) { P.pos.x = m; } if (P.pos.x < -m) { P.pos.x = -m; } if (P.pos.y > m) { P.pos.y = m; } if (P.pos.y < -m) { P.pos.y = -m; } if (P.pos.z > m) { P.pos.z = m; } if (P.pos.z < -m) { P.pos.z = -m; } }
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function sv(P, Q, R, S) { float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z; float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z; float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z; return (ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx)) / 6; }
Function mx(x, y, z) { if (kind == 1) { return x + p; } if (kind == 2 || kind == 6) { return x * cos(ph) + z * sin(ph); } if (kind == 5) { return x; } return -x; }
Function my(x, y, z) { if (kind == 1 || kind == 6) { return y + p / 2; } if (kind == 3 || kind == 5) { return -y; } return y; }
Function mz(x, y, z) { if (kind == 2 || kind == 6) { return z * cos(ph) - x * sin(ph); } if (kind == 1 || kind == 5) { return z; } return -z; }
Function kn() { if (kind == 1) { return "параллельный перенос на вектор (p; p/2; 0), p = " + num(p, 1); } if (kind == 2) { return "поворот вокруг оси Oy на " + format(ang, 0) + "°"; } if (kind == 3) { return "центральная симметрия относительно начала координат"; } if (kind == 4) { return "осевая симметрия относительно оси Oy"; } if (kind == 5) { return "зеркальная симметрия относительно плоскости Oxz"; } return "винтовое движение: поворот вокруг Oy на " + format(ang, 0) + "° и перенос вдоль оси на p/2 = " + num(p / 2, 2); }

Update {
  clampP(A, 3);
  clampP(B, 3);
  clampP(C, 3);
  clampP(D, 3);
  ph = ang * pi / 180;
  A1.pos.x = mx(A.pos.x, A.pos.y, A.pos.z); A1.pos.y = my(A.pos.x, A.pos.y, A.pos.z); A1.pos.z = mz(A.pos.x, A.pos.y, A.pos.z);
  B1.pos.x = mx(B.pos.x, B.pos.y, B.pos.z); B1.pos.y = my(B.pos.x, B.pos.y, B.pos.z); B1.pos.z = mz(B.pos.x, B.pos.y, B.pos.z);
  C1.pos.x = mx(C.pos.x, C.pos.y, C.pos.z); C1.pos.y = my(C.pos.x, C.pos.y, C.pos.z); C1.pos.z = mz(C.pos.x, C.pos.y, C.pos.z);
  D1.pos.x = mx(D.pos.x, D.pos.y, D.pos.z); D1.pos.y = my(D.pos.x, D.pos.y, D.pos.z); D1.pos.z = mz(D.pos.x, D.pos.y, D.pos.z);
  float v0 = sv(A, B, C, D); float v1 = sv(A1, B1, C1, D1);
  info = "**Движение пространства** — преобразование, сохраняющее расстояния между любыми двумя точками. Сейчас: **" + kn() + "**.\n\n";
  info = info + "Расстояния до и после: AB = " + format(dist(A, B), 2) + " → A′B′ = " + format(dist(A1, B1), 2) + "; AC = " + format(dist(A, C), 2) + " → A′C′ = " + format(dist(A1, C1), 2) + "; AD = " + format(dist(A, D), 2) + " → A′D′ = " + format(dist(A1, D1), 2) + "; BC = " + format(dist(B, C), 2) + " → B′C′ = " + format(dist(B1, C1), 2) + "; BD = " + format(dist(B, D), 2) + " → B′D′ = " + format(dist(B1, D1), 2) + "; CD = " + format(dist(C, D), 2) + " → C′D′ = " + format(dist(C1, D1), 2) + ".\n\n";
  info = info + "Ориентация: V(ABCD) = " + num(v0, 2) + ", V(A′B′C′D′) = " + num(v1, 2);
  if (abs(v0) < 0.01) { info = info + " — тетраэдр почти плоский.\n\n"; } else if (v0 * v1 > 0) { info = info + " — знак сохраняется.\n\n"; } else { info = info + " — знак меняется на противоположный.\n\n"; }
  info = info + "Образы четырёх точек A, B, C, D, не лежащих в одной плоскости, однозначно задают движение.";
}
]
