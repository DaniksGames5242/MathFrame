[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.5;

// Ось l — вертикальная прямая Oy. Фигура ABCD (любые четыре точки), её образ A′B′C′D′ при повороте на φ₁
// и образ A″B″C″D″ после второго поворота на φ₂ вокруг той же оси.
new Point3D { name = "ax1"; pos = (0, -4.6, 0); dynamic = false; collision = false; size = 0.1 }
new Point3D { name = "ax2"; pos = (0, 4.6, 0); dynamic = false; collision = false; size = 0.1; text = true("l") }
new Line3D { name = "axis"; pos = (ax1, ax2); interact = false; thickness = 3; color = #22c55e }
new Point3D { name = "A"; pos = (-2, -1, 1.5); pauseOnDrag = false; text = true("A") }
new Point3D { name = "B"; pos = (1.5, -1.5, 2); pauseOnDrag = false; text = true("B") }
new Point3D { name = "C"; pos = (1, 2, -1.5); pauseOnDrag = false; text = true("C") }
new Point3D { name = "D"; pos = (2.5, 0.5, 1); pauseOnDrag = false; text = true("D") }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A′"); color = #3b82f6 }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B′"); color = #3b82f6 }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C′"); color = #3b82f6 }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D′"); color = #3b82f6 }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("A″"); color = #f59e0b }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("B″"); color = #f59e0b }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("C″"); color = #f59e0b }
new Point3D { name = "D2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("D″"); color = #f59e0b }
new Line3D { name = "eAB"; pos = (A, B); interact = false; thickness = 2 }
new Line3D { name = "eAC"; pos = (A, C); interact = false; thickness = 2 }
new Line3D { name = "eAD"; pos = (A, D); interact = false; thickness = 2 }
new Line3D { name = "eBC"; pos = (B, C); interact = false; thickness = 2 }
new Line3D { name = "eBD"; pos = (B, D); interact = false; thickness = 2 }
new Line3D { name = "eCD"; pos = (C, D); interact = false; thickness = 2 }
new Line3D { name = "eAB1"; pos = (A1, B1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eAC1"; pos = (A1, C1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eAD1"; pos = (A1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eBC1"; pos = (B1, C1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eBD1"; pos = (B1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eCD1"; pos = (C1, D1); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "eAB2"; pos = (A2, B2); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "eAC2"; pos = (A2, C2); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "eAD2"; pos = (A2, D2); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "eBC2"; pos = (B2, C2); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "eBD2"; pos = (B2, D2); interact = false; thickness = 2; color = #f59e0b }
new Line3D { name = "eCD2"; pos = (C2, D2); interact = false; thickness = 2; color = #f59e0b }
new Curve3D { name = "cA1"; type = parametric; x = "rA * cos(aA - p1 * t)"; y = "yA"; z = "rA * sin(aA - p1 * t)"; segments = 40; color = #3b82f6; thickness = 2; active = rA > 0.05 && abs(p1) > 0.01 }
new Curve3D { name = "cA2"; type = parametric; x = "rA * cos(aA - p1 - p2 * t)"; y = "yA"; z = "rA * sin(aA - p1 - p2 * t)"; segments = 40; color = #f59e0b; thickness = 2; active = rA > 0.05 && abs(p2) > 0.01 }
new Curve3D { name = "cB1"; type = parametric; x = "rB * cos(aB - p1 * t)"; y = "yB"; z = "rB * sin(aB - p1 * t)"; segments = 40; color = #3b82f6; thickness = 2; active = rB > 0.05 && abs(p1) > 0.01 }
new Curve3D { name = "cB2"; type = parametric; x = "rB * cos(aB - p1 - p2 * t)"; y = "yB"; z = "rB * sin(aB - p1 - p2 * t)"; segments = 40; color = #f59e0b; thickness = 2; active = rB > 0.05 && abs(p2) > 0.01 }
new Curve3D { name = "cC1"; type = parametric; x = "rC * cos(aC - p1 * t)"; y = "yC"; z = "rC * sin(aC - p1 * t)"; segments = 40; color = #3b82f6; thickness = 2; active = rC > 0.05 && abs(p1) > 0.01 }
new Curve3D { name = "cC2"; type = parametric; x = "rC * cos(aC - p1 - p2 * t)"; y = "yC"; z = "rC * sin(aC - p1 - p2 * t)"; segments = 40; color = #f59e0b; thickness = 2; active = rC > 0.05 && abs(p2) > 0.01 }
new Curve3D { name = "cD1"; type = parametric; x = "rD * cos(aD - p1 * t)"; y = "yD"; z = "rD * sin(aD - p1 * t)"; segments = 40; color = #3b82f6; thickness = 2; active = rD > 0.05 && abs(p1) > 0.01 }
new Curve3D { name = "cD2"; type = parametric; x = "rD * cos(aD - p1 - p2 * t)"; y = "yD"; z = "rD * sin(aD - p1 - p2 * t)"; segments = 40; color = #f59e0b; thickness = 2; active = rD > 0.05 && abs(p2) > 0.01 }

new UI { type = slider; label = "первый поворот φ₁, °"; variable = d1; min = -180; max = 180; step = 5; default = 70 }
new UI { type = slider; label = "второй поворот φ₂, °"; variable = d2; min = -180; max = 180; step = 5; default = 50 }

string info = "";
float d1 = 70; float d2 = 50; float p1 = 1.2; float p2 = 0.9;
float rA = 0; float aA = 0; float yA = 0;
float rB = 0; float aB = 0; float yB = 0;
float rC = 0; float aC = 0; float yC = 0;
float rD = 0; float aD = 0; float yD = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P) {
  float r = sqrt(P.pos.x * P.pos.x + P.pos.z * P.pos.z);
  if (r > 4.2) { P.pos.x = P.pos.x * 4.2 / r; P.pos.z = P.pos.z * 4.2 / r; }
  if (P.pos.y > 4.2) { P.pos.y = 4.2; }
  if (P.pos.y < -4.2) { P.pos.y = -4.2; }
}
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
Function orient(P, Q, R, S) {
  float ux = Q.pos.x - P.pos.x; float uy = Q.pos.y - P.pos.y; float uz = Q.pos.z - P.pos.z;
  float vx = R.pos.x - P.pos.x; float vy = R.pos.y - P.pos.y; float vz = R.pos.z - P.pos.z;
  float wx = S.pos.x - P.pos.x; float wy = S.pos.y - P.pos.y; float wz = S.pos.z - P.pos.z;
  return ux * (vy * wz - vz * wy) - uy * (vx * wz - vz * wx) + uz * (vx * wy - vy * wx);
}
Function sgn(v) { if (v > 0.001) { return "положительна"; } if (v < -0.001) { return "отрицательна"; } return "равна нулю"; }
Function rot(Q, P, ph) {
  Q.pos.x = P.pos.x * cos(ph) + P.pos.z * sin(ph);
  Q.pos.y = P.pos.y;
  Q.pos.z = -P.pos.x * sin(ph) + P.pos.z * cos(ph);
}
Update {
  p1 = radians(d1); p2 = radians(d2);
  clampP(A); rA = sqrt(A.pos.x * A.pos.x + A.pos.z * A.pos.z); aA = atan2(A.pos.z, A.pos.x); yA = A.pos.y;
  rot(A1, A, p1); rot(A2, A, p1 + p2);
  clampP(B); rB = sqrt(B.pos.x * B.pos.x + B.pos.z * B.pos.z); aB = atan2(B.pos.z, B.pos.x); yB = B.pos.y;
  rot(B1, B, p1); rot(B2, B, p1 + p2);
  clampP(C); rC = sqrt(C.pos.x * C.pos.x + C.pos.z * C.pos.z); aC = atan2(C.pos.z, C.pos.x); yC = C.pos.y;
  rot(C1, C, p1); rot(C2, C, p1 + p2);
  clampP(D); rD = sqrt(D.pos.x * D.pos.x + D.pos.z * D.pos.z); aD = atan2(D.pos.z, D.pos.x); yD = D.pos.y;
  rot(D1, D, p1); rot(D2, D, p1 + p2);
  float tot = d1 + d2;
  info = "**Поворот вокруг оси** — движение, при котором каждая точка перемещается по окружности в плоскости, перпендикулярной оси l (зелёная), на один и тот же угол. Фигура ABCD повёрнута на φ₁ = " + num(d1, 0) + "° (синяя A′B′C′D′), затем ещё на φ₂ = " + num(d2, 0) + "° (оранжевая A″B″C″D″).\n\n";
  info = info + "**Сохранение расстояний.** AB = " + format(dist(A, B), 2) + ", A′B′ = " + format(dist(A1, B1), 2) + ", A″B″ = " + format(dist(A2, B2) , 2) + "; CD = " + format(dist(C, D), 2) + ", C′D′ = " + format(dist(C1, D1), 2) + ". Расстояние точки A до оси: " + format(rA, 2) + " — у A′ и A″ то же самое, ось неподвижна.\n\n";
  info = info + "**Сохранение ориентации.** Смешанное произведение векторов AB, AC, AD " + sgn(orient(A, B, C, D)) + " (" + num(orient(A, B, C, D), 2) + "), у образа A″B″C″D″ — " + num(orient(A2, B2, C2, D2), 2) + ": знак тот же, правая тройка остаётся правой.\n\n";
  info = info + "**Композиция и обратное преобразование.** Два поворота вокруг одной оси — это поворот на φ₁ + φ₂ = " + num(tot, 0) + "°.";
  if (abs(tot) < 0.5) { info = info + " Сумма равна 0° — второй поворот обратный к первому, фигура вернулась на место."; }
  if (d1 * d2 < 0 && abs(tot) >= 0.5) { info = info + " Направления вращений противоположны, поэтому углы вычитаются по модулю."; }
}
]
