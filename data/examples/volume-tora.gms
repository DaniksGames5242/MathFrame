[
description = "{info}"

field width = 10;
field height = 10;
field depth = 10;
show grid = false;
show axes = false;

// ---- Объём тора: V = πr² · 2πR; сечение плоскостью y = z₀, перпендикулярной оси, — кольцо площади 4πR√(r² − z₀²) ----
draw Surface { name = "torus"; type = parametric; x = "(bR + sr * cos(2 * pi * v)) * cos(2 * pi * u)"; y = "sr * sin(2 * pi * v)"; z = "(bR + sr * cos(2 * pi * v)) * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 48; color = #3b82f6; opacity = 0.3 }
draw Surface { name = "ring"; type = parametric; x = "(ri + (ro - ri) * u) * cos(2 * pi * v)"; y = "z0"; z = "(ri + (ro - ri) * u) * sin(2 * pi * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #f59e0b; opacity = 0.8 }
new Curve3D { name = "gen"; type = parametric; x = "bR + sr * cos(2 * pi * t)"; y = "sr * sin(2 * pi * t)"; z = "0"; segments = 60; color = #22c55e; thickness = 4 }
new Point3D { name = "Q1"; pos = (0, -4, 0); dynamic = false; active = false }
new Point3D { name = "Q2"; pos = (0, 4, 0); dynamic = false; active = false }
new Line3D { name = "axis"; pos = (Q1, Q2); thickness = 2 }
new Point3D { name = "C1"; pos = (2.5, 0, 0); dynamic = false; text = true("C") }

new UI { name = "sR"; type = slider; label = "большой радиус R"; variable = bR; min = 0.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sr"; type = slider; label = "малый радиус r"; variable = sr; min = 0.3; max = 2; step = 0.1; default = 1 }
new UI { name = "sZ"; type = slider; label = "высота сечения z"; variable = z0; min = -2; max = 2; step = 0.05; default = 0.4 }

float bR = 2.5; float sr = 1; float z0 = 0.4;
float ri = 1.5; float ro = 3.5;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (z0 > sr) { z0 = sr; }
  if (z0 < -sr) { z0 = -sr; }
  C1.pos.x = bR;
  float s = sqrt(max(sr * sr - z0 * z0, 0));
  ri = bR - s; ro = bR + s;
  float A = pi * sr * sr; float L = 2 * pi * bR;
  info = "**Объём тора.** Площадь образующего круга πr² = " + format(A, 2) + " (r = " + format(sr, 1) + "), центр удалён от оси на R = " + format(bR, 1) + " и проходит путь 2πR = " + format(L, 2) + ". Тогда\n\nV = πr² · 2πR = 2π²Rr² = " + format(A * L, 2) + ".\n\nТот же результат даёт метод сечений: на высоте z = " + num(z0, 2) + " сечение — кольцо с радиусами R ∓ √(r² − z²) = " + num(ri, 2) + " и " + num(ro, 2) + ", его площадь π(ro² − ri²) = 4πR√(r² − z²) = " + format(pi * (ro * ro - ri * ri), 2) + "; интеграл по z от −r до r равен V.";
  if (bR - sr < -0.05) { info = info + "\n\nR < r: кольцо частично «вывернуто» (внутренний радиус отрицателен), формула объёма сохраняется."; }
}
]
