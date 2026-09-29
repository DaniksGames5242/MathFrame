[
description = "{info}"

field width = 10;
field height = 10;
field depth = 10;
show grid = false;
show axes = false;

// ---- Площадь поверхности тора по Паппу — Гульдину: S = (длина образующей 2πr) · (путь центра 2πR) ----
draw Surface { name = "torus"; type = parametric; x = "(bR + sr * cos(2 * pi * v)) * cos(2 * pi * u)"; y = "sr * sin(2 * pi * v)"; z = "(bR + sr * cos(2 * pi * v)) * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 48; color = #3b82f6; opacity = 0.35 }
draw Surface { name = "strip"; type = parametric; x = "(bR + sr * cos(2 * pi * v)) * cos(2 * pi * part * u)"; y = "sr * sin(2 * pi * v)"; z = "(bR + sr * cos(2 * pi * v)) * sin(2 * pi * part * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 36; color = #f59e0b; opacity = 0.8 }
new Curve3D { name = "gen"; type = parametric; x = "bR + sr * cos(2 * pi * t)"; y = "sr * sin(2 * pi * t)"; z = "0"; segments = 60; color = #f59e0b; thickness = 4 }
new Curve3D { name = "path"; type = parametric; x = "bR * cos(2 * pi * part * t)"; y = "0"; z = "bR * sin(2 * pi * part * t)"; segments = 100; color = #22c55e; thickness = 4 }
new Point3D { name = "Oc"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Point3D { name = "C1"; pos = (2.5, 0, 0); dynamic = false; text = true("C") }
new Point3D { name = "Q1"; pos = (0, -4, 0); dynamic = false; active = false }
new Point3D { name = "Q2"; pos = (0, 4, 0); dynamic = false; active = false }
new Line3D { name = "axis"; pos = (Q1, Q2); thickness = 2 }

new UI { name = "sR"; type = slider; label = "большой радиус R"; variable = bR; min = 0.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sr"; type = slider; label = "малый радиус r"; variable = sr; min = 0.3; max = 2; step = 0.1; default = 1 }
new UI { name = "sP"; type = slider; label = "доля оборота"; variable = part; min = 0.05; max = 1; step = 0.01; default = 0.25 }

float bR = 2.5; float sr = 1; float part = 0.25;
string info = "";

Update {
  C1.pos.x = bR;
  float lg = 2 * pi * sr; float lp = 2 * pi * bR;
  float S = lg * lp;
  info = "**Площадь поверхности тора.** Длина образующей окружности 2πr = " + format(lg, 2) + " (r = " + format(sr, 1) + "), центр C проходит окружность длины 2πR = " + format(lp, 2) + " (R = " + format(bR, 1) + "). По теореме Паппа — Гульдина\n\nS = 2πr · 2πR = 4π²Rr = " + format(S, 2) + ".\n\nОранжевая полоса — " + format(100 * part, 0) + " % оборота, её площадь " + format(part * S, 2) + " = " + format(part, 2) + " · S. Эквивалентно S = π²((R + r)² − (R − r)²) = " + format(pi * pi * (pow(bR + sr, 2) - pow(bR - sr, 2)), 2) + ".";
  if (bR - sr < 0.05) { info = info + "\n\nПри R ≤ r поверхность касается оси или самопересекается, но формула площади та же (площадь параметризации)."; }
}
]
