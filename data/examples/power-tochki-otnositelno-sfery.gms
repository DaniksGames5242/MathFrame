[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (20, 68);
camera start zoom = 1.2;

// ---- Сфера с центром O и радиусом R, точка M (перетаскивается). Касательные из внешней точки
// заканчиваются на окружности касания; все они одной длины √(d² − R²). ----
draw Surface { name = "sph"; type = parametric; x = "R * sin(pi * u) * cos(6.283185 * v)"; y = "R * cos(pi * u)"; z = "R * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.25 }
new Curve3D { name = "touch"; type = parametric; x = "cx0 + rho * (cos(6.283185 * t) * ux + sin(6.283185 * t) * vx)"; y = "cy0 + rho * (cos(6.283185 * t) * uy + sin(6.283185 * t) * vy)"; z = "cz0 + rho * (cos(6.283185 * t) * uz + sin(6.283185 * t) * vz)"; segments = 64; color = #22c55e; thickness = 3; active = d > R + 0.05 }
new Curve3D { name = "t1"; type = parametric; x = "mx + t * (tx(0) - mx)"; y = "my + t * (ty(0) - my)"; z = "mz + t * (tz(0) - mz)"; segments = 2; color = #f59e0b; thickness = 4; active = d > R + 0.05 }
new Curve3D { name = "t2"; type = parametric; x = "mx + t * (tx(2.094395) - mx)"; y = "my + t * (ty(2.094395) - my)"; z = "mz + t * (tz(2.094395) - mz)"; segments = 2; color = #f59e0b; thickness = 4; active = d > R + 0.05 }
new Curve3D { name = "t3"; type = parametric; x = "mx + t * (tx(4.18879) - mx)"; y = "my + t * (ty(4.18879) - my)"; z = "mz + t * (tz(4.18879) - mz)"; segments = 2; color = #f59e0b; thickness = 4; active = d > R + 0.05 }
new Curve3D { name = "om"; type = parametric; x = "t * mx"; y = "t * my"; z = "t * mz"; segments = 2; thickness = 2 }
new Point3D { name = "O"; pos = (0, 0, 0); text = true("O"); interact = false; collision = false }
new Point3D { name = "M"; pos = (3.6, 2.2, 2.4); text = true("M"); pauseOnDrag = false; collideWithPoints = false }
new UI { type = slider; label = "радиус R"; variable = R; min = 1; max = 3.5; step = 0.1; default = 2.5 }

// ---- Логика ----
float R = 2.5;
float mx = 3.6; float my = 2.2; float mz = 2.4;
float d = 5; float rho = 0; float cx0 = 0; float cy0 = 0; float cz0 = 0;
float ux = 1; float uy = 0; float uz = 0; float vx = 0; float vy = 0; float vz = 1;
string info = "";

// точка касания с параметром a на окружности касания
Function tx(a) { return cx0 + rho * (cos(a) * ux + sin(a) * vx); }
Function ty(a) { return cy0 + rho * (cos(a) * uy + sin(a) * vy); }
Function tz(a) { return cz0 + rho * (cos(a) * uz + sin(a) * vz); }
Function num(x, k) { if (x < 0) { return "−" + format(-x, k); } return format(x, k); }

Update {
  mx = M.pos.x; my = M.pos.y; mz = M.pos.z;
  d = sqrt(mx * mx + my * my + mz * mz);
  if (d < 0.05) { d = 0.05; }
  float nx = mx / d; float ny = my / d; float nz = mz / d;
  // базис u, v в плоскости, перпендикулярной OM
  float hx = 0; float hy = 1; float hz = 0;
  if (abs(ny) > 0.9) { hx = 1; hy = 0; }
  ux = hy * nz - hz * ny; uy = hz * nx - hx * nz; uz = hx * ny - hy * nx;
  float lu = sqrt(ux * ux + uy * uy + uz * uz);
  ux = ux / lu; uy = uy / lu; uz = uz / lu;
  vx = ny * uz - nz * uy; vy = nz * ux - nx * uz; vz = nx * uy - ny * ux;
  float k = R * R / d;
  cx0 = k * nx; cy0 = k * ny; cz0 = k * nz;
  rho = 0;
  if (d > R) { rho = R * sqrt(d * d - R * R) / d; }
  float p = d * d - R * R;
  info = "**Степень точки M относительно сферы** с центром O и радиусом R: d² − R², где d = OM.\n\n";
  info = info + "d = " + format(d, 2) + ", R = " + format(R, 2) + ":  d² − R² = " + format(d * d, 2) + " − " + format(R * R, 2) + " = **" + num(p, 2) + "**.\n\n";
  if (d > R + 0.05) {
    info = info + "Точка **вне сферы**: степень положительна и равна квадрату длины касательной. Все касательные из M имеют одну длину MT = √(d² − R²) = " + format(sqrt(p), 2) + ", а MT² = " + format(p, 2) + " — это и есть степень.";
  } else if (d > R - 0.05) {
    info = info + "Точка **на сфере**: степень равна нулю — единственная касательная имеет нулевую длину.";
  } else {
    info = info + "Точка **внутри сферы**: степень отрицательна — касательную из M провести невозможно.";
  }
}
]
