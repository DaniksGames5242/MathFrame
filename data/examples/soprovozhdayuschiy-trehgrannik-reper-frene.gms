[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = false;

// ---- Кривая r(t) и точка M = r(t₀) на ней; в M — репер Френе: касательная T (красная),
// главная нормаль N (зелёная), бинормаль B (синяя), соприкасающаяся плоскость (T, N)
// и соприкасающаяся окружность радиуса 1/κ с центром на главной нормали ----
new Curve3D { name = "crv"; type = parametric; x = "cx(t0m + (t1m - t0m) * t)"; y = "cy(t0m + (t1m - t0m) * t)"; z = "cz(t0m + (t1m - t0m) * t)"; segments = 400; color = #6b7280; thickness = 3 }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; text = true("M"); color = #f59e0b }
new Point3D { name = "PT"; pos = (1, 0, 0); dynamic = false; active = false }
new Point3D { name = "PN"; pos = (0, 1, 0); dynamic = false; active = false }
new Point3D { name = "PB"; pos = (0, 0, 1); dynamic = false; active = false }
new Line3D { name = "lT"; pos = (M, PT); color = #ef4444; thickness = 4 }
new Line3D { name = "lN"; pos = (M, PN); color = #22c55e; thickness = 4 }
new Line3D { name = "lB"; pos = (M, PB); color = #3b82f6; thickness = 4 }
draw Vector3D { name = "vT"; edge = "lT"; pos = 1; color = #ef4444 }
draw Vector3D { name = "vN"; edge = "lN"; pos = 1; color = #22c55e }
draw Vector3D { name = "vB"; edge = "lB"; pos = 1; color = #3b82f6 }
draw InfPlane { name = "osc"; points = (M, PT, PN); size = 1.6; opacity = 0.25; color = #f59e0b }
new Curve3D { name = "circ"; type = parametric; x = "ocx + Rk * (-nx * cos(2 * pi * t) + tx * sin(2 * pi * t))"; y = "ocy + Rk * (-ny * cos(2 * pi * t) + ty * sin(2 * pi * t))"; z = "ocz + Rk * (-nz * cos(2 * pi * t) + tz * sin(2 * pi * t))"; segments = 120; color = #f59e0b; thickness = 2 }

new UI { name = "sK"; type = select; label = "кривая"; variable = kind; options = (0, 1, 2); labels = ("винтовая линия", "трилистник", "кривая Вивиани"); default = 0 }
new UI { name = "sT"; type = slider; label = "положение M"; variable = s; min = 0; max = 1; step = 0.002; default = 0.3 }
new UI { name = "tR"; type = toggle; label = "двигать"; variable = run; default = false }

// ---- Логика ----
float kind = 0;
float s = 0.3;
bool run = false;
float t0m = -9.42; float t1m = 9.42;
float tx = 1; float ty = 0; float tz = 0; float nx = 0; float ny = 1; float nz = 0;
float ocx = 0; float ocy = 0; float ocz = 0; float Rk = 1;
string info = "";

Function cx(t) { if (kind == 0) { return 2 * cos(t); } if (kind == 1) { return 0.9 * (sin(t) + 2 * sin(2 * t)); } return 1.4 * (1 + cos(t)) - 1.4; }
Function cy(t) { if (kind == 0) { return 0.33 * t; } if (kind == 1) { return -0.9 * sin(3 * t); } return 2.8 * sin(t / 2); }
Function cz(t) { if (kind == 0) { return 2 * sin(t); } if (kind == 1) { return 0.9 * (cos(t) - 2 * cos(2 * t)); } return 1.4 * sin(t); }

Update {
  if (kind == 0) { t0m = -9.42; t1m = 9.42; }
  if (kind == 1) { t0m = 0; t1m = 6.2832; }
  if (kind == 2) { t0m = -6.2832; t1m = 6.2832; }
  if (run) { s = s + 0.002; if (s > 1) { s = 0; } }
  float t = t0m + (t1m - t0m) * s;
  float h = 0.002;
  // Производные r′, r″, r‴ — центральными разностями
  float x0 = cx(t); float y0 = cy(t); float z0 = cz(t);
  float xp = cx(t + h); float yp = cy(t + h); float zp = cz(t + h);
  float xm = cx(t - h); float ym = cy(t - h); float zm = cz(t - h);
  float xpp = cx(t + 2 * h); float ypp = cy(t + 2 * h); float zpp = cz(t + 2 * h);
  float xmm = cx(t - 2 * h); float ymm = cy(t - 2 * h); float zmm = cz(t - 2 * h);
  float d1x = (xp - xm) / (2 * h); float d1y = (yp - ym) / (2 * h); float d1z = (zp - zm) / (2 * h);
  float d2x = (xp - 2 * x0 + xm) / (h * h); float d2y = (yp - 2 * y0 + ym) / (h * h); float d2z = (zp - 2 * z0 + zm) / (h * h);
  float d3x = (xpp - 2 * xp + 2 * xm - xmm) / (2 * h * h * h); float d3y = (ypp - 2 * yp + 2 * ym - ymm) / (2 * h * h * h); float d3z = (zpp - 2 * zp + 2 * zm - zmm) / (2 * h * h * h);
  // r′ × r″
  float cxx = d1y * d2z - d1z * d2y; float cyy = d1z * d2x - d1x * d2z; float czz = d1x * d2y - d1y * d2x;
  float v = sqrt(d1x * d1x + d1y * d1y + d1z * d1z); float cn = sqrt(cxx * cxx + cyy * cyy + czz * czz);
  float kap = cn / (v * v * v);
  float tau = (cxx * d3x + cyy * d3y + czz * d3z) / max(cn * cn, 0.000001);
  tx = d1x / v; ty = d1y / v; tz = d1z / v;
  float bx = cxx / max(cn, 0.000001); float by = cyy / max(cn, 0.000001); float bz = czz / max(cn, 0.000001);
  // N = B × T
  nx = by * tz - bz * ty; ny = bz * tx - bx * tz; nz = bx * ty - by * tx;
  float L = 1.3;
  M.pos.x = x0; M.pos.y = y0; M.pos.z = z0;
  PT.pos.x = x0 + L * tx; PT.pos.y = y0 + L * ty; PT.pos.z = z0 + L * tz;
  PN.pos.x = x0 + L * nx; PN.pos.y = y0 + L * ny; PN.pos.z = z0 + L * nz;
  PB.pos.x = x0 + L * bx; PB.pos.y = y0 + L * by; PB.pos.z = z0 + L * bz;
  Rk = min(1 / max(kap, 0.000001), 12);
  ocx = x0 + Rk * nx; ocy = y0 + Rk * ny; ocz = z0 + Rk * nz;

  info = "**Сопровождающий трёхгранник (репер Френе)** в точке кривой — три взаимно перпендикулярных единичных вектора: касательный T = r′/|r′| (красный), главная нормаль N (зелёный) — к центру кривизны, бинормаль B = T × N (синий). Плоскость (T, N) — соприкасающаяся: в ней лежит соприкасающаяся окружность радиуса 1/κ, лучше всего приближающая кривую около M. Формулы Френе: T′ = κN, N′ = −κT + τB, B′ = −τN (производные по длине дуги).\n\nВ точке M:  кривизна κ = " + format(kap, 3) + " (радиус 1/κ = " + format(1 / max(kap, 0.000001), 2) + "),  кручение τ = " + format(tau, 3) + ".";
  if (kind == 0) { info = info + " У винтовой линии κ и τ постоянны — репер движется «равномерно», вращаясь вокруг оси."; }
  if (abs(tau) < 0.01) { info = info + " τ ≈ 0: кривая здесь почти не выходит из соприкасающейся плоскости."; }
  info = info + "\n\nСцену можно вращать мышью.";
}
]
