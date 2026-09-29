[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 65);
camera start zoom = 1.35;

// ---- Плоскость α задана точками A, B, C (свободны); плоскость β ∥ α проходит через
// свободную точку M. H — основание перпендикуляра из M на α, MH ⟂ α и ⟂ β. Точка X ∈ α
// задаётся ползунками, X' ∈ β — её проекция вдоль нормали: любой общий перпендикуляр равен MH. ----
new Point3D { name = "A"; pos = (-3, -2.5, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -2.5, -1.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, -2, 3); text = true("C"); pauseOnDrag = false }
new Point3D { name = "M"; pos = (-1, 1.5, 0); text = true("M"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "H"; pos = (0, 0, 0); text = true("H"); color = #22c55e; dynamic = false; collision = false }
new Point3D { name = "X"; pos = (0, 0, 0); text = true("X"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "Y"; pos = (0, 0, 0); text = true("X'"); color = #3b82f6; dynamic = false; collision = false }
new Point3D { name = "G1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "mh"; pos = (M, H); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "xy"; pos = (X, Y); interact = false; thickness = 2; color = #3b82f6 }
draw InfPlane { name = "alpha"; points = (A, B, C); size = 3.6; opacity = 0.14; color = #3b82f6 }
draw InfPlane { name = "beta"; points = (M, G1, G2); size = 3.6; opacity = 0.14; color = #f59e0b }

new UI { name = "sU"; type = slider; label = "точка X ∈ α: вдоль AB"; variable = u; min = 0; max = 1; step = 0.02; default = 0.6 }
new UI { name = "sV"; type = slider; label = "точка X ∈ α: вдоль AC"; variable = v; min = 0; max = 1; step = 0.02; default = 0.3 }

string info = "";
float u = 0.6; float v = 0.3;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pmx = 0; float pmy = 0; float pmz = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(c, d, v) { if (c < 0) { return " − " + format(-c, d) + v; } return " + " + format(c, d) + v; }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function inF(x, y, z) { return abs(x) <= 4.3 && abs(y) <= 4.3 && abs(z) <= 4.3; }
// Допустимо: A, B, C не на одной прямой, плоскости различны, основание H перпендикуляра в поле.
Function ok() {
  if (!inF(A.pos.x, A.pos.y, A.pos.z) || !inF(B.pos.x, B.pos.y, B.pos.z) || !inF(C.pos.x, C.pos.y, C.pos.z) || !inF(M.pos.x, M.pos.y, M.pos.z)) { return false; }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  if (nl < 3) { return false; }
  float t = ((M.pos.x - A.pos.x) * nx + (M.pos.y - A.pos.y) * ny + (M.pos.z - A.pos.z) * nz) / nl;
  if (abs(t) < 0.7) { return false; }
  return inF(M.pos.x - t * nx / nl, M.pos.y - t * ny / nl, M.pos.z - t * nz / nl);
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
}

Update {
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz;
  }
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float nx = by * cz - bz * cy; float ny = bz * cx - bx * cz; float nz = bx * cy - by * cx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float t = ((M.pos.x - A.pos.x) * nx + (M.pos.y - A.pos.y) * ny + (M.pos.z - A.pos.z) * nz) / nl;
  H.pos.x = M.pos.x - t * nx / nl; H.pos.y = M.pos.y - t * ny / nl; H.pos.z = M.pos.z - t * nz / nl;
  G1.pos.x = M.pos.x + bx; G1.pos.y = M.pos.y + by; G1.pos.z = M.pos.z + bz;
  G2.pos.x = M.pos.x + cx; G2.pos.y = M.pos.y + cy; G2.pos.z = M.pos.z + cz;
  float wx = M.pos.x - H.pos.x; float wy = M.pos.y - H.pos.y; float wz = M.pos.z - H.pos.z;
  // X0 ∈ α внутри треугольника ABC; X = H + μ(X0 − H) — сжатие к H, чтобы X и X' остались в поле.
  float k = max(1, u + v);
  float qx = A.pos.x + (u * bx + v * cx) / k - H.pos.x;
  float qy = A.pos.y + (u * by + v * cy) / k - H.pos.y;
  float qz = A.pos.z + (u * bz + v * cz) / k - H.pos.z;
  float mu = min(1, min(tb(H.pos.x, qx, 4.3), tb(H.pos.y, qy, 4.3), tb(H.pos.z, qz, 4.3)), min(tb(M.pos.x, qx, 4.3), tb(M.pos.y, qy, 4.3), tb(M.pos.z, qz, 4.3)));
  X.pos.x = H.pos.x + mu * qx; X.pos.y = H.pos.y + mu * qy; X.pos.z = H.pos.z + mu * qz;
  Y.pos.x = X.pos.x + wx; Y.pos.y = X.pos.y + wy; Y.pos.z = X.pos.z + wz;
  float xy = sqrt(wx * wx + wy * wy + wz * wz);
  float d1 = -(nx * A.pos.x + ny * A.pos.y + nz * A.pos.z);
  float d2 = -(nx * M.pos.x + ny * M.pos.y + nz * M.pos.z);
  float dq = mu * sqrt(qx * qx + qy * qy + qz * qz);

  info = "**Расстояние между параллельными плоскостями α и β** равно длине их общего перпендикуляра — перпендикуляра, опущенного из любой точки одной плоскости на другую. Здесь α (синяя) проходит через A, B, C, а β (жёлтая) — через M параллельно α.\n\n";
  info = info + "α: " + num(nx, 1) + "x" + term(ny, 1, "y") + term(nz, 1, "z") + term(d1, 1, "") + " = 0, β: те же коэффициенты A, B, C и D₂ = " + num(d2, 1) + " (D₁ = " + num(d1, 1) + "). Расстояние |D₂ − D₁| / √(A² + B² + C²) = " + num(abs(d2 - d1), 2) + " / " + num(nl, 2) + " = **" + num(abs(d2 - d1) / nl, 2) + "**; перпендикуляр MH = " + num(xy, 2) + ".\n\n";
  info = info + "**Не зависит от выбора точек.** Из X ∈ α (на расстоянии " + num(dq, 2) + " от H) опущен перпендикуляр XX' на β: XX' ∥ MH и XX' = " + num(xy, 2) + " — все общие перпендикуляры параллельны и равны.";
}
]
