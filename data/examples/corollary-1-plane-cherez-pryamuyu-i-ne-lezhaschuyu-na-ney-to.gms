[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.2;

// ---- Прямая MN (M, N перетаскиваются, прямая идёт через всё поле) и точка K вне неё.
// Плоскость MNK строится по трём точкам. Жёлтая пробная плоскость вращается вокруг
// прямой MN (ползунок φ): она содержит прямую при любом φ, но точку K — только при
// одном положении, совпадающем с плоскостью MNK. ----
new Point3D { name = "M"; pos = (-3, -2, -1); text = true("M"); pauseOnDrag = false }
new Point3D { name = "N"; pos = (3, -1, 1); text = true("N"); pauseOnDrag = false }
new Point3D { name = "K"; pos = (0, 3, -2); text = true("K"); color = #22c55e; pauseOnDrag = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "plane"; points = (M, N, K); size = 4.5; opacity = 0.25; color = #3b82f6 }
draw InfPlane { name = "trial"; points = (M, N, T); size = 4.5; opacity = 0.25; color = #f59e0b }
new Line3D { name = "mn"; pos = (L1, L2); interact = false; thickness = 4 }

new UI { name = "sPhi"; type = slider; label = "поворот φ°"; variable = phi; min = 0; max = 180; step = 1; default = 30 }

// ---- Логика ----
float phi = 30;
string info = "";
float pmx = 0; float pmy = 0; float pmz = 0;
float pnx = 0; float pny = 0; float pnz = 0;
float pkx = 0; float pky = 0; float pkz = 0;
float hx = 4.3; float hy = 4.3; float hz = 4.3;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function area2(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  return sqrt(cx * cx + cy * cy + cz * cz);
}
// Допустимо, если прямая MN не вырождена (|MN| ≥ 1,5) и K отстоит от неё не менее чем на 0,8.
Function okLine(ax, ay, az, bx, by, bz, kx, ky, kz) {
  if (!inField3(ax, ay, az) || !inField3(bx, by, bz) || !inField3(kx, ky, kz)) { return false; }
  float l = sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az));
  if (l < 1.5) { return false; }
  return area2(ax, ay, az, bx, by, bz, kx, ky, kz) / l >= 0.8;
}
Function clipLo(px, py, pz, ux, uy, uz) {
  float lo = -100; float hh = 4.5;
  if (abs(ux) > 0.000001) { lo = max(lo, min((-hh - px) / ux, (hh - px) / ux)); }
  if (abs(uy) > 0.000001) { lo = max(lo, min((-hh - py) / uy, (hh - py) / uy)); }
  if (abs(uz) > 0.000001) { lo = max(lo, min((-hh - pz) / uz, (hh - pz) / uz)); }
  return lo;
}
Function clipHi(px, py, pz, ux, uy, uz) {
  float hi = 100; float hh = 4.5;
  if (abs(ux) > 0.000001) { hi = min(hi, max((-hh - px) / ux, (hh - px) / ux)); }
  if (abs(uy) > 0.000001) { hi = min(hi, max((-hh - py) / uy, (hh - py) / uy)); }
  if (abs(uz) > 0.000001) { hi = min(hi, max((-hh - pz) / uz, (hh - pz) / uz)); }
  return hi;
}

Start {
  pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
  pnx = N.pos.x; pny = N.pos.y; pnz = N.pos.z;
  pkx = K.pos.x; pky = K.pos.y; pkz = K.pos.z;
}

Update {
  float mM = abs(M.pos.x - pmx) + abs(M.pos.y - pmy) + abs(M.pos.z - pmz);
  float mN = abs(N.pos.x - pnx) + abs(N.pos.y - pny) + abs(N.pos.z - pnz);
  float mK = abs(K.pos.x - pkx) + abs(K.pos.y - pky) + abs(K.pos.z - pkz);
  float m = max(mM, mN, mK);
  if (m > 0.000001) {
    if (mM == m) {
      if (okLine(M.pos.x, M.pos.y, M.pos.z, pnx, pny, pnz, pkx, pky, pkz)) { pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; } else { M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz; }
    } else if (mN == m) {
      if (okLine(pmx, pmy, pmz, N.pos.x, N.pos.y, N.pos.z, pkx, pky, pkz)) { pnx = N.pos.x; pny = N.pos.y; pnz = N.pos.z; } else { N.pos.x = pnx; N.pos.y = pny; N.pos.z = pnz; }
    } else {
      if (okLine(pmx, pmy, pmz, pnx, pny, pnz, K.pos.x, K.pos.y, K.pos.z)) { pkx = K.pos.x; pky = K.pos.y; pkz = K.pos.z; } else { K.pos.x = pkx; K.pos.y = pky; K.pos.z = pkz; }
    }
  }

  // Единичное направление прямой MN и ортонормированный базис e1, e2 плоскости, ей перпендикулярной.
  float dx = N.pos.x - M.pos.x; float dy = N.pos.y - M.pos.y; float dz = N.pos.z - M.pos.z;
  float dl = sqrt(dx * dx + dy * dy + dz * dz);
  float ux = dx / dl; float uy = dy / dl; float uz = dz / dl;
  float rx = 0; float ry = 1; float rz = 0;
  if (abs(uy) > 0.9) { rx = 1; ry = 0; }
  float rd = rx * ux + ry * uy + rz * uz;
  float e1x = rx - rd * ux; float e1y = ry - rd * uy; float e1z = rz - rd * uz;
  float e1l = sqrt(e1x * e1x + e1y * e1y + e1z * e1z);
  e1x = e1x / e1l; e1y = e1y / e1l; e1z = e1z / e1l;
  float e2x = uy * e1z - uz * e1y; float e2y = uz * e1x - ux * e1z; float e2z = ux * e1y - uy * e1x;

  // Прямая MN, обрезанная кубом поля.
  float lo = clipLo(M.pos.x, M.pos.y, M.pos.z, ux, uy, uz);
  float hi = clipHi(M.pos.x, M.pos.y, M.pos.z, ux, uy, uz);
  L1.pos.x = M.pos.x + ux * lo; L1.pos.y = M.pos.y + uy * lo; L1.pos.z = M.pos.z + uz * lo;
  L2.pos.x = M.pos.x + ux * hi; L2.pos.y = M.pos.y + uy * hi; L2.pos.z = M.pos.z + uz * hi;

  // Поворот плоскости MNK вокруг прямой (φK) и пробная плоскость с поворотом φ.
  float wx = K.pos.x - M.pos.x; float wy = K.pos.y - M.pos.y; float wz = K.pos.z - M.pos.z;
  float wa = wx * e1x + wy * e1y + wz * e1z;
  float wb = wx * e2x + wy * e2y + wz * e2z;
  float phiK = atan2(wb, wa) * 57.29578;
  if (phiK < 0) { phiK = phiK + 180; }
  if (phiK >= 180) { phiK = phiK - 180; }
  float c = cos(phi / 57.29578); float s = sin(phi / 57.29578);
  T.pos.x = M.pos.x + 2.5 * (c * e1x + s * e2x);
  T.pos.y = M.pos.y + 2.5 * (c * e1y + s * e2y);
  T.pos.z = M.pos.z + 2.5 * (c * e1z + s * e2z);

  float diff = abs(phi - phiK);
  if (diff > 90) { diff = 180 - diff; }
  float h = area2(M.pos.x, M.pos.y, M.pos.z, N.pos.x, N.pos.y, N.pos.z, K.pos.x, K.pos.y, K.pos.z) / dl;

  info = "**Следствие 1:** через прямую MN и точку K, не лежащую на ней, проходит ровно одна плоскость. Расстояние от K до прямой MN равно " + format(h, 2) + " > 0, поэтому точки M, N, K не лежат на одной прямой, и плоскость MNK (синяя) определена аксиомой о трёх точках.\n\n**Пробная плоскость** (жёлтая) содержит прямую MN при любом повороте φ = " + format(phi, 0) + "°, ";
  if (diff < 2.5) {
    info = info + "и сейчас она совпала с плоскостью MNK: содержит и прямую, и точку K. Такое положение единственное.";
  } else {
    info = info + "но точку K она не содержит: до совпадения с плоскостью MNK остаётся поворот на " + format(diff, 0) + "°. Плоскость MNK получается при φ ≈ " + format(phiK, 0) + "°, и только при нём.";
  }
}
]
