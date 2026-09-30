[
description = "{info}"

field width = 12; field height = 12; field depth = 12;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// ---- Две сферы (центры O₁, O₂ перетаскиваются, радиусы — ползунки), радикальная плоскость
// перпендикулярна O₁O₂ на расстоянии x = (D² + r₁² − r₂²) / (2D) от O₁. ----
draw Surface { name = "s1"; type = parametric; x = "ox1 + r1 * sin(pi * u) * cos(6.283185 * v)"; y = "oy1 + r1 * cos(pi * u)"; z = "oz1 + r1 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #3b82f6; opacity = 0.25 }
draw Surface { name = "s2"; type = parametric; x = "ox2 + r2 * sin(pi * u) * cos(6.283185 * v)"; y = "oy2 + r2 * cos(pi * u)"; z = "oz2 + r2 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #22c55e; opacity = 0.25 }
draw Surface { name = "rad"; type = parametric; x = "pcx + 4 * u * (cos(6.283185 * v) * ux + sin(6.283185 * v) * vx)"; y = "pcy + 4 * u * (cos(6.283185 * v) * uy + sin(6.283185 * v) * vy)"; z = "pcz + 4 * u * (cos(6.283185 * v) * uz + sin(6.283185 * v) * vz)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #f59e0b; opacity = 0.35 }
new Curve3D { name = "circ"; type = parametric; x = "pcx + rc * (cos(6.283185 * t) * ux + sin(6.283185 * t) * vx)"; y = "pcy + rc * (cos(6.283185 * t) * uy + sin(6.283185 * t) * vy)"; z = "pcz + rc * (cos(6.283185 * t) * uz + sin(6.283185 * t) * vz)"; segments = 64; color = #f59e0b; thickness = 4; active = cross > 0.5 }
new Curve3D { name = "axis"; type = parametric; x = "ox1 + t * (ox2 - ox1)"; y = "oy1 + t * (oy2 - oy1)"; z = "oz1 + t * (oz2 - oz1)"; segments = 2; thickness = 2 }
new Point3D { name = "O1"; pos = (-3, 0, 0); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "O2"; pos = (2.5, 0.8, 0.5); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "P"; pos = (0, 0, 0); text = true("P"); dynamic = false; collision = false }
new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 3; step = 0.1; default = 1.5 }
new UI { type = slider; label = "точка P: расстояние"; variable = pr; min = 0; max = 3.5; step = 0.05; default = 1.8 }
new UI { type = slider; label = "точка P: направление"; variable = pa; min = 0; max = 6.28; step = 0.05; default = 1 }

// ---- Логика ----
float r1 = 2; float r2 = 1.5; float pr = 1.8; float pa = 1;
float ox1 = -3; float oy1 = 0; float oz1 = 0; float ox2 = 2.5; float oy2 = 0.8; float oz2 = 0.5;
float pcx = 0; float pcy = 0; float pcz = 0; float rc = 0; float cross = 0;
float ux = 0; float uy = 1; float uz = 0; float vx = 0; float vy = 0; float vz = 1;
string info = "";

Function num(x, k) { if (x < 0) { return "−" + format(-x, k); } return format(x, k); }

Update {
  ox1 = O1.pos.x; oy1 = O1.pos.y; oz1 = O1.pos.z;
  float dx = O2.pos.x - ox1; float dy = O2.pos.y - oy1; float dz = O2.pos.z - oz1;
  float dd = sqrt(dx * dx + dy * dy + dz * dz);
  // центры не сливаются: иначе радикальная плоскость не определена
  if (dd < 1.2) {
    if (dd < 0.001) { dx = 1; dy = 0; dz = 0; dd = 1; }
    O2.pos.x = ox1 + 1.2 * dx / dd; O2.pos.y = oy1 + 1.2 * dy / dd; O2.pos.z = oz1 + 1.2 * dz / dd;
    dx = O2.pos.x - ox1; dy = O2.pos.y - oy1; dz = O2.pos.z - oz1; dd = 1.2;
  }
  ox2 = O2.pos.x; oy2 = O2.pos.y; oz2 = O2.pos.z;
  float nx = dx / dd; float ny = dy / dd; float nz = dz / dd;
  float x = (dd * dd + r1 * r1 - r2 * r2) / (2 * dd);
  pcx = ox1 + x * nx; pcy = oy1 + x * ny; pcz = oz1 + x * nz;
  float hx = 0; float hy = 1; float hz = 0;
  if (abs(ny) > 0.9) { hx = 1; hy = 0; }
  ux = hy * nz - hz * ny; uy = hz * nx - hx * nz; uz = hx * ny - hy * nx;
  float lu = sqrt(ux * ux + uy * uy + uz * uz);
  ux = ux / lu; uy = uy / lu; uz = uz / lu;
  vx = ny * uz - nz * uy; vy = nz * ux - nx * uz; vz = nx * uy - ny * ux;
  P.pos.x = pcx + pr * (cos(pa) * ux + sin(pa) * vx);
  P.pos.y = pcy + pr * (cos(pa) * uy + sin(pa) * vy);
  P.pos.z = pcz + pr * (cos(pa) * uz + sin(pa) * vz);
  float e1 = P.pos.x - ox1; float f1 = P.pos.y - oy1; float g1 = P.pos.z - oz1;
  float e2 = P.pos.x - ox2; float f2 = P.pos.y - oy2; float g2 = P.pos.z - oz2;
  float w1 = e1 * e1 + f1 * f1 + g1 * g1 - r1 * r1;
  float w2 = e2 * e2 + f2 * f2 + g2 * g2 - r2 * r2;
  cross = 0; rc = 0;
  if (r1 * r1 - x * x > 0) { if (dd < r1 + r2) { if (dd > abs(r1 - r2)) { cross = 1; rc = sqrt(r1 * r1 - x * x); } } }
  info = "**Радикальная плоскость двух сфер** — множество точек с равными степенями относительно обеих сфер; она перпендикулярна линии центров O₁O₂.\n\n";
  info = info + "O₁O₂ = " + format(dd, 2) + ", r₁ = " + format(r1, 1) + ", r₂ = " + format(r2, 1) + ". Плоскость пересекает O₁O₂ на расстоянии (O₁O₂² + r₁² − r₂²) / (2·O₁O₂) = " + num(x, 2) + " от O₁.\n\n";
  info = info + "Точка P плоскости: степень относительно первой сферы PO₁² − r₁² = " + num(w1, 2) + ", относительно второй PO₂² − r₂² = " + num(w2, 2) + " — они равны.\n\n";
  if (cross > 0.5) {
    info = info + "Сферы **пересекаются**: плоскость содержит окружность их пересечения радиуса " + format(rc, 2) + ".";
  } else if (abs(dd - r1 - r2) < 0.05 || abs(dd - abs(r1 - r2)) < 0.05) {
    info = info + "Сферы **касаются**: плоскость проходит через точку касания.";
  } else {
    info = info + "Сферы **не пересекаются**: плоскость проходит между ними или вне их, общих точек со сферами у неё нет.";
  }
}
]
