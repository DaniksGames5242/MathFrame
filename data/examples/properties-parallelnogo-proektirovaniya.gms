[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (30, 55);
camera start zoom = 1.3;

// ---- Отрезки AB и CD ∥ AB (CD = μ·AB; A, B, C свободны), точка M ∈ AB (M = A + λ·AB) проектируются
// на плоскость π (y = −1,8) параллельными лучами; ползунки θ, φ задают их направление. Образы
// (жёлтые) считаются по лучам, а свойства проверяются по координатам образов. ----
new Point3D { name = "A"; pos = (-1.2, 0.2, -0.8); text = true("A"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (1.2, 0.9, -0.4); text = true("B"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "C"; pos = (-0.6, -0.5, 1.2); text = true("C"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "M"; pos = (0, 0, 0); text = true("M"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "D"; pos = (0, 0, 0); text = true("D"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "A1"; pos = (0, -1.8, 0); text = true("A'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "B1"; pos = (0, -1.8, 0); text = true("B'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "C1"; pos = (0, -1.8, 0); text = true("C'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "D1"; pos = (0, -1.8, 0); text = true("D'"); color = #f59e0b; dynamic = false; collision = false }
new Point3D { name = "M1"; pos = (0, -1.8, 0); text = true("M'"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "G1"; pos = (-3, -1.8, -3); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (3, -1.8, -3); dynamic = false; collision = false; active = false }
new Point3D { name = "G3"; pos = (-3, -1.8, 3); dynamic = false; collision = false; active = false }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "a1b1"; pos = (A1, B1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "c1d1"; pos = (C1, D1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "ra"; pos = (A, A1); interact = false; thickness = 1.5 }
new Line3D { name = "rb"; pos = (B, B1); interact = false; thickness = 1.5 }
new Line3D { name = "rc"; pos = (C, C1); interact = false; thickness = 1.5 }
new Line3D { name = "rd"; pos = (D, D1); interact = false; thickness = 1.5 }
new Line3D { name = "rm"; pos = (M, M1); interact = false; thickness = 1.5 }
draw Punctir { name = "punA"; edge = "ra" }
draw Punctir { name = "punB"; edge = "rb" }
draw Punctir { name = "punC"; edge = "rc" }
draw Punctir { name = "punD"; edge = "rd" }
draw Punctir { name = "punM"; edge = "rm" }
draw InfPlane { name = "pi"; points = (G1, G2, G3); size = 4.4; opacity = 0.12; color = #22c55e }

new UI { name = "sTh"; type = slider; label = "угол лучей с плоскостью π, °"; variable = th; min = 50; max = 90; step = 1; default = 62 }
new UI { name = "sPh"; type = slider; label = "азимут лучей, °"; variable = ph; min = 0; max = 359; step = 1; default = 35 }
new UI { name = "sLa"; type = slider; label = "точка M на AB: AM/AB"; variable = la; min = 0.1; max = 0.9; step = 0.05; default = 0.4 }
new UI { name = "sMu"; type = slider; label = "длина CD / длина AB"; variable = mu; min = 0.4; max = 1.6; step = 0.05; default = 0.8 }

string info = "";
float th = 62; float ph = 35; float la = 0.4; float mu = 0.8;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inB(x, y, z) { return abs(x) <= 1.5 && y >= -1.2 && y <= 1.2 && abs(z) <= 1.5; }
Function dst(x1, y1, z1, x2, y2, z2) { return sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2)); }
// Расстояние вдоль луча (m + t·d, t ≥ 0) до границы |координата| ≤ h.
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
// Допустимо: A ≠ B, точка C не на прямой AB (прямые AB и CD различны).
Function ok() {
  if (!inB(A.pos.x, A.pos.y, A.pos.z) || !inB(B.pos.x, B.pos.y, B.pos.z) || !inB(C.pos.x, C.pos.y, C.pos.z)) { return false; }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float l = sqrt(bx * bx + by * by + bz * bz);
  if (l < 0.8) { return false; }
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  return sqrt(nx * nx + ny * ny + nz * nz) / l >= 0.5;
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
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  M.pos.x = A.pos.x + la * bx; M.pos.y = A.pos.y + la * by; M.pos.z = A.pos.z + la * bz;
  // D = C + μ·AB; μ уменьшается, если D выходит из области.
  float me = min(mu, min(tb(C.pos.x, bx, 1.5), tb(C.pos.y, by, 1.2), tb(C.pos.z, bz, 1.5)));
  D.pos.x = C.pos.x + me * bx; D.pos.y = C.pos.y + me * by; D.pos.z = C.pos.z + me * bz;
  float kx = cos(radians(ph)) / tan(radians(th)); float kz = sin(radians(ph)) / tan(radians(th));
  A1.pos.x = A.pos.x + (A.pos.y + 1.8) * kx; A1.pos.z = A.pos.z + (A.pos.y + 1.8) * kz; A1.pos.y = -1.8;
  B1.pos.x = B.pos.x + (B.pos.y + 1.8) * kx; B1.pos.z = B.pos.z + (B.pos.y + 1.8) * kz; B1.pos.y = -1.8;
  C1.pos.x = C.pos.x + (C.pos.y + 1.8) * kx; C1.pos.z = C.pos.z + (C.pos.y + 1.8) * kz; C1.pos.y = -1.8;
  D1.pos.x = D.pos.x + (D.pos.y + 1.8) * kx; D1.pos.z = D.pos.z + (D.pos.y + 1.8) * kz; D1.pos.y = -1.8;
  M1.pos.x = M.pos.x + (M.pos.y + 1.8) * kx; M1.pos.z = M.pos.z + (M.pos.y + 1.8) * kz; M1.pos.y = -1.8;

  float lab = dst(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z);
  float lab1 = dst(A1.pos.x, A1.pos.y, A1.pos.z, B1.pos.x, B1.pos.y, B1.pos.z);
  float lcd1 = dst(C1.pos.x, C1.pos.y, C1.pos.z, D1.pos.x, D1.pos.y, D1.pos.z);
  float lam = dst(A1.pos.x, A1.pos.y, A1.pos.z, M1.pos.x, M1.pos.y, M1.pos.z);
  float lmb = dst(M1.pos.x, M1.pos.y, M1.pos.z, B1.pos.x, B1.pos.y, B1.pos.z);
  float sinf = abs(by) / lab;
  float phi = degrees(asin(min(1, sinf)));

  info = "**Свойства параллельного проектирования.** Отрезок AB, точка M ∈ AB и отрезок CD ∥ AB (синие) проектируются на плоскость π параллельными лучами; жёлтые A'B', M', C'D' — образы.\n\n";
  if (lab1 < 0.05) {
    info = info + "**Проекция прямой.** AB параллельна направлению проектирования, поэтому вся прямая AB проецируется в **одну точку**: A' = B' = M'. Если прямая не параллельна лучам, её образ — прямая.";
  } else {
    float cr = abs((B1.pos.x - A1.pos.x) * (D1.pos.z - C1.pos.z) - (B1.pos.z - A1.pos.z) * (D1.pos.x - C1.pos.x));
    info = info + "**Параллельность.** AB ∥ CD ⟹ A'B' ∥ C'D': их направляющие векторы пропорциональны, определитель равен " + num(cr, 2) + ".\n\n";
    info = info + "**Отношение отрезков.** AM : MB = " + num(la, 2) + " : " + num(1 - la, 2) + " = " + num(la / (1 - la), 2) + ", и A'M' : M'B' = " + num(lam, 2) + " : " + num(lmb, 2) + " = " + num(lam / lmb, 2) + ". Для параллельных отрезков CD : AB = " + num(me, 2) + ", C'D' : A'B' = " + num(lcd1, 2) + " : " + num(lab1, 2) + " = " + num(lcd1 / lab1, 2) + ".\n\n";
    if (th > 89.5) {
      info = info + "**Длина.** Перпендикулярное проектирование: A'B' = AB · cos φ, где φ = " + num(phi, 0) + "° — угол AB с плоскостью π: " + num(lab, 2) + " · " + num(cos(radians(phi)), 2) + " = " + num(lab1, 2) + ".";
    } else if (abs(by) < 0.03) {
      info = info + "**Длина.** AB ∥ π, поэтому A'B' = AB = " + num(lab, 2) + " — без искажения.";
    } else {
      info = info + "**Искажения.** Отрезок AB не параллелен π: AB = " + num(lab, 2) + ", A'B' = " + num(lab1, 2) + " — длины, а с ними и углы, в общем случае не сохраняются.";
    }
  }
}
]
