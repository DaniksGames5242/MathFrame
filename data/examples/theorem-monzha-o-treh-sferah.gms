[
description = "{info}"

field width = 12; field height = 12; field depth = 12;
show grid = false; show axes = false;
camera start rot = (35, 68);
camera start zoom = 1.1;

// ---- Три сферы с центрами в плоскости z = 0 (центры перетаскиваются, радиусы — ползунки). Три радикальные
// плоскости (по парам сфер) — вертикальные, и все проходят через одну прямую, перпендикулярную плоскости центров. ----
draw Surface { name = "s1"; type = parametric; x = "ox1 + r1 * sin(pi * u) * cos(6.283185 * v)"; y = "oy1 + r1 * cos(pi * u)"; z = "r1 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.22 }
draw Surface { name = "s2"; type = parametric; x = "ox2 + r2 * sin(pi * u) * cos(6.283185 * v)"; y = "oy2 + r2 * cos(pi * u)"; z = "r2 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #22c55e; opacity = 0.22 }
draw Surface { name = "s3"; type = parametric; x = "ox3 + r3 * sin(pi * u) * cos(6.283185 * v)"; y = "oy3 + r3 * cos(pi * u)"; z = "r3 * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #f59e0b; opacity = 0.22 }
draw Surface { name = "p12"; type = parametric; x = "c12x + (10 * u - 5) * m12x"; y = "c12y + (10 * u - 5) * m12y"; z = "8 * v - 4"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 8; color = #3b82f6; opacity = 0.3 }
draw Surface { name = "p13"; type = parametric; x = "c13x + (10 * u - 5) * m13x"; y = "c13y + (10 * u - 5) * m13y"; z = "8 * v - 4"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 8; color = #22c55e; opacity = 0.3 }
draw Surface { name = "p23"; type = parametric; x = "c23x + (10 * u - 5) * m23x"; y = "c23y + (10 * u - 5) * m23y"; z = "8 * v - 4"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 8; color = #f59e0b; opacity = 0.3 }
new Curve3D { name = "axis"; type = parametric; x = "qx"; y = "qy"; z = "8 * t - 4"; segments = 2; thickness = 5 }
new Point3D { name = "O1"; pos = (-3.5, -1.5, 0); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "O2"; pos = (2.5, -2.5, 0); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "O3"; pos = (0.5, 3, 0); text = true("O₃"); pauseOnDrag = false; collideWithPoints = false }
new Point3D { name = "Q"; pos = (0, 0, 0); text = true("Q"); dynamic = false; collision = false }
new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 2.5; step = 0.1; default = 2 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 2.5; step = 0.1; default = 1.6 }
new UI { type = slider; label = "радиус r₃"; variable = r3; min = 1; max = 2.5; step = 0.1; default = 1.3 }
new UI { type = slider; label = "точка Q на прямой: высота"; variable = qz; min = -4; max = 4; step = 0.1; default = 1.5 }

// ---- Логика ----
float r1 = 2; float r2 = 1.6; float r3 = 1.3; float qz = 1.5;
float ox1 = -3.5; float oy1 = -1.5; float ox2 = 2.5; float oy2 = -2.5; float ox3 = 0.5; float oy3 = 3;
float qx = 0; float qy = 0;
float c12x = 0; float c12y = 0; float m12x = 0; float m12y = 1;
float c13x = 0; float c13y = 0; float m13x = 0; float m13y = 1;
float c23x = 0; float c23y = 0; float m23x = 0; float m23y = 1;
string info = "";

Function num(x, k) { if (x < 0) { return "−" + format(-x, k); } return format(x, k); }
// степень точки (x, y, z) относительно сферы с центром (ox, oy, 0) и радиусом r
Function pw(x, y, z, ox, oy, r) { return (x - ox) * (x - ox) + (y - oy) * (y - oy) + z * z - r * r; }

Update {
  // центры не должны лежать на одной прямой (иначе радикальные плоскости параллельны): ход отменяется
  float ax = O1.pos.x; float ay = O1.pos.y; float bx = O2.pos.x; float by = O2.pos.y; float cx = O3.pos.x; float cy = O3.pos.y;
  float det = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  if (abs(det) > 2.5) { ox1 = ax; oy1 = ay; ox2 = bx; oy2 = by; ox3 = cx; oy3 = cy; }
  O1.pos.x = ox1; O1.pos.y = oy1; O1.pos.z = 0; O2.pos.x = ox2; O2.pos.y = oy2; O2.pos.z = 0; O3.pos.x = ox3; O3.pos.y = oy3; O3.pos.z = 0;
  det = (ox2 - ox1) * (oy3 - oy1) - (oy2 - oy1) * (ox3 - ox1);
  // радикальные плоскости пар: точка на линии центров и направление в плоскости центров
  float d12 = sqrt((ox2 - ox1) * (ox2 - ox1) + (oy2 - oy1) * (oy2 - oy1));
  float k12 = (d12 * d12 + r1 * r1 - r2 * r2) / (2 * d12);
  c12x = ox1 + k12 * (ox2 - ox1) / d12; c12y = oy1 + k12 * (oy2 - oy1) / d12;
  m12x = -(oy2 - oy1) / d12; m12y = (ox2 - ox1) / d12;
  float d13 = sqrt((ox3 - ox1) * (ox3 - ox1) + (oy3 - oy1) * (oy3 - oy1));
  float k13 = (d13 * d13 + r1 * r1 - r3 * r3) / (2 * d13);
  c13x = ox1 + k13 * (ox3 - ox1) / d13; c13y = oy1 + k13 * (oy3 - oy1) / d13;
  m13x = -(oy3 - oy1) / d13; m13y = (ox3 - ox1) / d13;
  float d23 = sqrt((ox3 - ox2) * (ox3 - ox2) + (oy3 - oy2) * (oy3 - oy2));
  float k23 = (d23 * d23 + r2 * r2 - r3 * r3) / (2 * d23);
  c23x = ox2 + k23 * (ox3 - ox2) / d23; c23y = oy2 + k23 * (oy3 - oy2) / d23;
  m23x = -(oy3 - oy2) / d23; m23y = (ox3 - ox2) / d23;
  // общая точка плоскостей 12 и 13 (они содержат ось z): (Q − C)·(O − O₁) = 0 для обеих пар
  float e1 = c12x * (ox2 - ox1) + c12y * (oy2 - oy1); float e2 = c13x * (ox3 - ox1) + c13y * (oy3 - oy1);
  qx = (e1 * (oy3 - oy1) - e2 * (oy2 - oy1)) / det;
  qy = ((ox2 - ox1) * e2 - (ox3 - ox1) * e1) / det;
  Q.pos.x = qx; Q.pos.y = qy; Q.pos.z = qz;
  float w1 = pw(qx, qy, qz, ox1, oy1, r1); float w2 = pw(qx, qy, qz, ox2, oy2, r2); float w3 = pw(qx, qy, qz, ox3, oy3, r3);
  info = "**Теорема Монжа о трёх сферах.** Радикальные плоскости пар сфер (1–2, 1–3, 2–3) пересекаются по одной прямой — радикальной оси. Она перпендикулярна плоскости центров, если центры не лежат на одной прямой.\n\n";
  info = info + "Точка Q на радикальной оси, высота " + num(qz, 1) + ". Её степени относительно трёх сфер: " + num(w1, 3) + ", " + num(w2, 3) + ", " + num(w3, 3) + " — одинаковы.\n\n";
  info = info + "При изменении центров и радиусов каждая плоскость смещается, но общая прямая остаётся: она всегда перпендикулярна плоскости центров.";
}
]
