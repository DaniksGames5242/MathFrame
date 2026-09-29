[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 62);
camera start zoom = 1.15;

// Расстояние между объектами — длина кратчайшего отрезка между ними (зелёный). Три случая:
// точка — плоскость, точка — прямая, скрещивающиеся прямые. Все определяющие точки перетаскиваются.
new Point3D { name = "P"; pos = (1.5, 2.2, 1); text = true("P"); pauseOnDrag = false; active = v12 }
new Point3D { name = "A1"; pos = (-3, -1.5, -2.5); text = true("A"); color = #3b82f6; pauseOnDrag = false; active = v23 }
new Point3D { name = "B1"; pos = (2.5, 0.5, -2); text = true("B"); color = #3b82f6; pauseOnDrag = false; active = v23 }
new Point3D { name = "A2"; pos = (-1, 2, -3); text = true("C"); color = #f59e0b; pauseOnDrag = false; active = v3 }
new Point3D { name = "B2"; pos = (1.5, -2, 3); text = true("D"); color = #f59e0b; pauseOnDrag = false; active = v3 }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "K"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("K"); active = v3 }
new Point3D { name = "Pa"; pos = (2, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pb"; pos = (-1, 0, 1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "Pc"; pos = (-1, 0, -1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "alpha"; points = (Pa, Pb, Pc); size = 3.6; opacity = 0.2; color = #3b82f6; active = v1 }
new Line3D { name = "ll"; pos = (L1, L2); interact = false; thickness = 3; color = #3b82f6; active = v23 }
new Line3D { name = "lm"; pos = (N1, N2); interact = false; thickness = 3; color = #f59e0b; active = v3 }
new Line3D { name = "dist1"; pos = (P, H); interact = false; thickness = 4; color = #22c55e; active = v12 }
new Line3D { name = "dist3"; pos = (H, K); interact = false; thickness = 4; color = #22c55e; active = v3 }

new UI { name = "b1"; type = button; label = "Точка — плоскость"; action = "tab = 1" }
new UI { name = "b2"; type = button; label = "Точка — прямая"; action = "tab = 2" }
new UI { name = "b3"; type = button; label = "Скрещивающиеся прямые"; action = "tab = 3" }

string info = "";
float tab = 1; float v1 = 1; float v12 = 1; float v23 = 0; float v3 = 0;
float hx = 4.3;
float ppx = 0; float ppy = 0; float ppz = 0;
float pax = 0; float pay = 0; float paz = 0; float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0; float pdx = 0; float pdy = 0; float pdz = 0;
float nx = 0.3; float ny = 0.9; float nz = 0.3;

Function num(x, d) { if (abs(x) < 0.005) { return "0"; } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inF(x, y, z) { return abs(x) <= hx && abs(y) <= hx && abs(z) <= hx; }
// Наибольшее t ≥ 0, при котором m + t·d остаётся в поле.
Function tb(m, d) {
  if (d > 0.000001) { return (hx - m) / d; }
  if (d < -0.000001) { return (-hx - m) / d; }
  return 1000;
}
Function cl(ax, ay, az, ux, uy, uz) { return min(tb(ax, ux), min(tb(ay, uy), tb(az, uz))); }
// Расстояние между прямыми AB и CD (скрещивающиеся): |(s1, s2, AC)| / |s1 × s2|; знаменатель в параметре den.
Function ok(px, py, pz, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, mode) {
  if (!inF(px, py, pz) || !inF(ax, ay, az) || !inF(bx, by, bz) || !inF(cx, cy, cz) || !inF(dx, dy, dz)) { return false; }
  float s1x = bx - ax; float s1y = by - ay; float s1z = bz - az;
  float a = s1x * s1x + s1y * s1y + s1z * s1z;
  if (mode > 1.5) {
    if (a < 1) { return false; }
    float qx = px - ax; float qy = py - ay; float qz = pz - az;
    float kx = s1y * qz - s1z * qy; float ky = s1z * qx - s1x * qz; float kz = s1x * qy - s1y * qx;
    if (mode < 2.5 && sqrt(kx * kx + ky * ky + kz * kz) / sqrt(a) < 0.25) { return false; }
  }
  if (mode > 2.5) {
    float s2x = dx - cx; float s2y = dy - cy; float s2z = dz - cz;
    float c = s2x * s2x + s2y * s2y + s2z * s2z;
    if (c < 1) { return false; }
    float b = s1x * s2x + s1y * s2y + s1z * s2z;
    float den = a * c - b * b;
    if (den < 0.05 * a * c) { return false; }
    float w0x = ax - cx; float w0y = ay - cy; float w0z = az - cz;
    float d1 = s1x * w0x + s1y * w0y + s1z * w0z; float e1 = s2x * w0x + s2y * w0y + s2z * w0z;
    float t1 = (b * e1 - c * d1) / den; float t2 = (a * e1 - b * d1) / den;
    float x1 = ax + t1 * s1x; float y1 = ay + t1 * s1y; float z1 = az + t1 * s1z;
    float x2 = cx + t2 * s2x; float y2 = cy + t2 * s2y; float z2 = cz + t2 * s2z;
    if (!inF(x1, y1, z1) || !inF(x2, y2, z2)) { return false; }
    float ddx = x1 - x2; float ddy = y1 - y2; float ddz = z1 - z2;
    if (sqrt(ddx * ddx + ddy * ddy + ddz * ddz) < 0.4) { return false; }
  }
  return true;
}

Start {
  float nl = sqrt(nx * nx + ny * ny + nz * nz); nx = nx / nl; ny = ny / nl; nz = nz / nl;
  ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z;
  pax = A1.pos.x; pay = A1.pos.y; paz = A1.pos.z; pbx = B1.pos.x; pby = B1.pos.y; pbz = B1.pos.z;
  pcx = A2.pos.x; pcy = A2.pos.y; pcz = A2.pos.z; pdx = B2.pos.x; pdy = B2.pos.y; pdz = B2.pos.z;
}

Update {
  // В 3D active принимает имя переменной (0 — скрыто), а не выражение.
  v1 = 0; v12 = 0; v23 = 0; v3 = 0;
  if (tab < 1.5) { v1 = 1; }
  if (tab < 2.5) { v12 = 1; }
  if (tab > 1.5) { v23 = 1; }
  if (tab > 2.5) { v3 = 1; }
  if (ok(P.pos.x, P.pos.y, P.pos.z, A1.pos.x, A1.pos.y, A1.pos.z, B1.pos.x, B1.pos.y, B1.pos.z, A2.pos.x, A2.pos.y, A2.pos.z, B2.pos.x, B2.pos.y, B2.pos.z, tab)) {
    ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z;
    pax = A1.pos.x; pay = A1.pos.y; paz = A1.pos.z; pbx = B1.pos.x; pby = B1.pos.y; pbz = B1.pos.z;
    pcx = A2.pos.x; pcy = A2.pos.y; pcz = A2.pos.z; pdx = B2.pos.x; pdy = B2.pos.y; pdz = B2.pos.z;
  } else {
    P.pos.x = ppx; P.pos.y = ppy; P.pos.z = ppz;
    A1.pos.x = pax; A1.pos.y = pay; A1.pos.z = paz; B1.pos.x = pbx; B1.pos.y = pby; B1.pos.z = pbz;
    A2.pos.x = pcx; A2.pos.y = pcy; A2.pos.z = pcz; B2.pos.x = pdx; B2.pos.y = pdy; B2.pos.z = pdz;
  }
  // Плоскость α: проходит через O, нормаль n; базис (e1, e2) плоскости для опорных точек.
  float e1x = ny; float e1y = -nx; float e1z = 0;
  float el = sqrt(e1x * e1x + e1y * e1y); e1x = e1x / el; e1y = e1y / el;
  float e2x = -e1y * nz; float e2y = e1x * nz; float e2z = e1y * nx - e1x * ny;
  Pa.pos.x = 2 * e1x; Pa.pos.y = 2 * e1y; Pa.pos.z = 2 * e1z;
  Pb.pos.x = -e1x + 1.7 * e2x; Pb.pos.y = -e1y + 1.7 * e2y; Pb.pos.z = -e1z + 1.7 * e2z;
  Pc.pos.x = -e1x - 1.7 * e2x; Pc.pos.y = -e1y - 1.7 * e2y; Pc.pos.z = -e1z - 1.7 * e2z;

  float sx = B1.pos.x - A1.pos.x; float sy = B1.pos.y - A1.pos.y; float sz = B1.pos.z - A1.pos.z;
  float sl = sqrt(sx * sx + sy * sy + sz * sz);
  float ux = sx / sl; float uy = sy / sl; float uz = sz / sl;
  float tf = cl(A1.pos.x, A1.pos.y, A1.pos.z, ux, uy, uz); float tk = cl(A1.pos.x, A1.pos.y, A1.pos.z, -ux, -uy, -uz);
  L1.pos.x = A1.pos.x - tk * ux; L1.pos.y = A1.pos.y - tk * uy; L1.pos.z = A1.pos.z - tk * uz;
  L2.pos.x = A1.pos.x + tf * ux; L2.pos.y = A1.pos.y + tf * uy; L2.pos.z = A1.pos.z + tf * uz;
  float tx = B2.pos.x - A2.pos.x; float ty = B2.pos.y - A2.pos.y; float tz = B2.pos.z - A2.pos.z;
  float tl = sqrt(tx * tx + ty * ty + tz * tz);
  float vx = tx / tl; float vy = ty / tl; float vz = tz / tl;
  float uf = cl(A2.pos.x, A2.pos.y, A2.pos.z, vx, vy, vz); float ub = cl(A2.pos.x, A2.pos.y, A2.pos.z, -vx, -vy, -vz);
  N1.pos.x = A2.pos.x - ub * vx; N1.pos.y = A2.pos.y - ub * vy; N1.pos.z = A2.pos.z - ub * vz;
  N2.pos.x = A2.pos.x + uf * vx; N2.pos.y = A2.pos.y + uf * vy; N2.pos.z = A2.pos.z + uf * vz;

  info = "**Расстояние между объектами в пространстве** — длина кратчайшего отрезка, концы которого лежат на этих объектах; для непересекающихся объектов он перпендикулярен им.\n\n";
  if (tab < 1.5) {
    float sg = nx * P.pos.x + ny * P.pos.y + nz * P.pos.z;
    H.pos.x = P.pos.x - sg * nx; H.pos.y = P.pos.y - sg * ny; H.pos.z = P.pos.z - sg * nz;
    info = info + "**Точка — плоскость.** Плоскость α: " + num(nx, 2) + "x + " + num(ny, 2) + "y + " + num(nz, 2) + "z = 0 (|n| = 1), P(" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + "; " + num(P.pos.z, 2) + "). PH ⟂ α, H — ортогональная проекция P.\n\n**d = |Ax₀ + By₀ + Cz₀ + D| / √(A² + B² + C²) = |" + num(sg, 2) + "| = " + format(abs(sg), 2) + "**. Расстояние между параллельными плоскостями и от прямой до параллельной ей плоскости сводится к этому же случаю.";
  }
  if (tab > 1.5 && tab < 2.5) {
    float qx = P.pos.x - A1.pos.x; float qy = P.pos.y - A1.pos.y; float qz = P.pos.z - A1.pos.z;
    float tt = (qx * ux + qy * uy + qz * uz);
    H.pos.x = A1.pos.x + tt * ux; H.pos.y = A1.pos.y + tt * uy; H.pos.z = A1.pos.z + tt * uz;
    float kx = uy * qz - uz * qy; float ky = uz * qx - ux * qz; float kz = ux * qy - uy * qx;
    info = info + "**Точка — прямая.** Прямая l = AB, s = AB = (" + num(sx, 2) + "; " + num(sy, 2) + "; " + num(sz, 2) + "). PH ⟂ l, H — основание перпендикуляра в плоскости, заданной точкой P и прямой l.\n\n**d = |s × AP| / |s| = " + format(sqrt(kx * kx + ky * ky + kz * kz), 2) + "**.";
  }
  if (tab > 2.5) {
    float w0x = A1.pos.x - A2.pos.x; float w0y = A1.pos.y - A2.pos.y; float w0z = A1.pos.z - A2.pos.z;
    float a = sx * sx + sy * sy + sz * sz; float b = sx * tx + sy * ty + sz * tz; float c = tx * tx + ty * ty + tz * tz;
    float d1 = sx * w0x + sy * w0y + sz * w0z; float f1 = tx * w0x + ty * w0y + tz * w0z;
    float den = a * c - b * b;
    float t1 = (b * f1 - c * d1) / den; float t2 = (a * f1 - b * d1) / den;
    H.pos.x = A1.pos.x + t1 * sx; H.pos.y = A1.pos.y + t1 * sy; H.pos.z = A1.pos.z + t1 * sz;
    K.pos.x = A2.pos.x + t2 * tx; K.pos.y = A2.pos.y + t2 * ty; K.pos.z = A2.pos.z + t2 * tz;
    float cx = sy * tz - sz * ty; float cy = sz * tx - sx * tz; float cz = sx * ty - sy * tx;
    float vol = cx * w0x + cy * w0y + cz * w0z;
    float cn = sqrt(cx * cx + cy * cy + cz * cz);
    info = info + "**Скрещивающиеся прямые.** Общий перпендикуляр HK существует и единствен, перпендикулярен обеим прямым.\n\n**d = |(s₁, s₂, CA)| / |s₁ × s₂| = |" + num(vol, 2) + "| / " + format(cn, 2) + " = " + format(abs(vol) / cn, 2) + "** — объём параллелепипеда, делённый на площадь основания.";
  }
}
]
