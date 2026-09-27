[
description = "{info}"

field width = 7;
field height = 7;
field depth = 7;
show grid = false;
show axes = false;

// ---- Бутылка Клейна в R³ (с самопересечением: горлышко проходит сквозь стенку) ----
// Ползунок «часть» отрезает кусок поверхности, чтобы заглянуть внутрь. По замкнутой
// оранжевой петле едет точка с единичной нормалью (зелёная).
draw Surface { name = "kb"; type = parametric; x = "kx(pi * u, 2 * pi * part * v)"; y = "ky(pi * u, 2 * pi * part * v)"; z = "kz(pi * u, 2 * pi * part * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 44; color = #3b82f6; opacity = 0.55 }
new Curve3D { name = "loop"; type = parametric; x = "kx(pi * t, pi / 2)"; y = "ky(pi * t, pi / 2)"; z = "kz(pi * t, pi / 2)"; segments = 160; color = #f59e0b; thickness = 4 }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; text = true("M"); color = #f59e0b }
new Point3D { name = "NT"; pos = (0, 1, 0); dynamic = false; active = false }
new Line3D { name = "nl"; pos = (M, NT); color = #22c55e; thickness = 4 }
draw Vector3D { name = "nv"; edge = "nl"; pos = 1; color = #22c55e }

new UI { name = "sS"; type = slider; label = "положение M на петле"; variable = s; min = 0; max = 1; step = 0.005; default = 0.3 }
new UI { name = "tR"; type = toggle; label = "двигать"; variable = run; default = false }
new UI { name = "sP"; type = slider; label = "часть поверхности"; variable = part; min = 0.3; max = 1; step = 0.01; default = 0.75 }

// ---- Логика ----
float s = 0.3; bool run = false; float part = 0.75;
float n0x = 0; float n0y = 0; float n0z = 0;
string info = "";

// Классическая параметризация «бутылки», u ∈ [0; π], v ∈ [0; 2π]; сдвинута и повёрнута горлышком вверх
Function fx(u, v) { float c = cos(u); float sn = sin(u); return -2 / 15 * c * (3 * cos(v) - 30 * sn + 90 * c ^ 4 * sn - 60 * c ^ 6 * sn + 5 * c * sn * cos(v)); }
Function fy(u, v) { float c = cos(u); float sn = sin(u); return -1 / 15 * sn * (3 * cos(v) - 3 * c ^ 2 * cos(v) - 48 * c ^ 4 * cos(v) + 48 * c ^ 6 * cos(v) - 60 * sn + 5 * c * cos(v) * sn - 5 * c ^ 3 * cos(v) * sn - 80 * c ^ 5 * cos(v) * sn + 80 * c ^ 7 * cos(v) * sn); }
Function fz(u, v) { return 2 / 15 * (3 + 5 * cos(u) * sin(u)) * sin(v); }
Function kx(u, v) { return 1.3 * (fx(u, v) - 0.15); }
Function ky(u, v) { return -1.3 * (fy(u, v) - 2.1); }
Function kz(u, v) { return 1.3 * fz(u, v); }
// Единичная нормаль: векторное произведение частных производных (численно)
float rnx = 0; float rny = 0; float rnz = 0;
Function normal(u, v) {
  float h = 0.001;
  float ax = (kx(u + h, v) - kx(u - h, v)) / (2 * h); float ay = (ky(u + h, v) - ky(u - h, v)) / (2 * h); float az = (kz(u + h, v) - kz(u - h, v)) / (2 * h);
  float bx = (kx(u, v + h) - kx(u, v - h)) / (2 * h); float by = (ky(u, v + h) - ky(u, v - h)) / (2 * h); float bz = (kz(u, v + h) - kz(u, v - h)) / (2 * h);
  float cx = ay * bz - az * by; float cy = az * bx - ax * bz; float cz = ax * by - ay * bx;
  float l = sqrt(cx * cx + cy * cy + cz * cz) + 0.000001;
  rnx = cx / l; rny = cy / l; rnz = cz / l;
  return 0;
}

Update {
  if (run) { s = s + 0.003; if (s > 1) { s = 0; } }
  // около u = 0 и u = π параметризация вырождена — нормаль берём чуть внутри
  float u = pi * max(0.004, min(0.996, s)); float v = pi / 2;
  normal(pi * 0.004, v); n0x = rnx; n0y = rny; n0z = rnz;
  normal(u, v);
  M.pos.x = kx(u, v); M.pos.y = ky(u, v); M.pos.z = kz(u, v);
  NT.pos.x = M.pos.x + 0.9 * rnx; NT.pos.y = M.pos.y + 0.9 * rny; NT.pos.z = M.pos.z + 0.9 * rnz;
  float dp = rnx * n0x + rny * n0y + rnz * n0z;

  info = "**Бутылка Клейна** — замкнутая поверхность без края, у которой нет внутренней и внешней стороны: она **неориентируема**. Её можно склеить из квадрата, отождествив одну пару сторон как у цилиндра, а другую — с переворотом. В трёхмерном пространстве она не помещается без самопересечения — горлышко проходит сквозь стенку (в R⁴ это не нужно).\n\nНормаль в точке M, непрерывно переносимая вдоль замкнутой оранжевой петли, возвращается в исходную точку **противоположной**: скалярное произведение с начальной нормалью n₀ меняется от 1 до −1. Сейчас n·n₀ = " + format(dp, 2) + ".";
  if (s > 0.98) { info = info + " Петля пройдена — нормаль перевернулась: выбрать одну сторону поверхности нельзя."; }
  info = info + "\n\nСцену можно вращать мышью.";
}
]
