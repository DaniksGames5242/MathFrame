[
description = "{info}"

field width = 10;
field height = 10;
field depth = 10;
show grid = false;
show axes = false;

// ---- Тор: окружность радиуса r, центр которой на расстоянии R от оси (вертикальной оси y), вращается вокруг оси ----
draw Surface { name = "torus"; type = parametric; x = "(bR + sr * cos(2 * pi * v)) * cos(2 * pi * part * u)"; y = "sr * sin(2 * pi * v)"; z = "(bR + sr * cos(2 * pi * v)) * sin(2 * pi * part * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 48; color = #3b82f6; opacity = 0.6 }
new Curve3D { name = "gen1"; type = parametric; x = "bR + sr * cos(2 * pi * t)"; y = "sr * sin(2 * pi * t)"; z = "0"; segments = 60; color = #f59e0b; thickness = 4 }
new Curve3D { name = "gen2"; type = parametric; x = "-bR - sr * cos(2 * pi * t)"; y = "sr * sin(2 * pi * t)"; z = "0"; segments = 60; color = #f59e0b; thickness = 4 }
new Curve3D { name = "circ"; type = parametric; x = "bR * cos(2 * pi * t)"; y = "0"; z = "bR * sin(2 * pi * t)"; segments = 100; color = #22c55e; thickness = 2 }
new Point3D { name = "C1"; pos = (2.5, 0, 0); dynamic = false; text = true("C") }
new Point3D { name = "Q1"; pos = (0, -4, 0); dynamic = false; active = false }
new Point3D { name = "Q2"; pos = (0, 4, 0); dynamic = false; active = false }
new Line3D { name = "axis"; pos = (Q1, Q2); thickness = 2 }
new Point3D { name = "Oc"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Line3D { name = "oc"; pos = (Oc, C1); color = #22c55e; thickness = 4 }

new UI { name = "sR"; type = slider; label = "большой радиус R"; variable = bR; min = 0.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sr"; type = slider; label = "малый радиус r"; variable = sr; min = 0.3; max = 2; step = 0.1; default = 1 }
new UI { name = "sP"; type = slider; label = "часть оборота"; variable = part; min = 0.3; max = 1; step = 0.01; default = 1 }

float bR = 2.5; float sr = 1; float part = 1;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  C1.pos.x = bR;
  float S = 4 * pi * pi * bR * sr;
  float V = 2 * pi * pi * bR * sr * sr;
  info = "**Тор** — поверхность, образованная вращением окружности малого радиуса r = " + format(sr, 1) + " вокруг оси, лежащей в её плоскости; центр окружности удалён от оси на большой радиус R = " + format(bR, 1) + ".\n\nСечение плоскостью через ось — две окружности радиуса r с центрами на расстоянии R по обе стороны от оси. Расстояние от оси до ближайшей точки поверхности R − r = " + num(bR - sr, 1) + ", до самой дальней R + r = " + format(bR + sr, 1) + ".\n\nПлощадь поверхности S = 4π²Rr = " + format(S, 1) + ", объём V = 2π²Rr² = " + format(V, 1) + ".";
  if (abs(bR - sr) < 0.05) { info = info + "\n\nR = r: отверстие стянулось в точку, поверхность касается оси."; }
  if (bR - sr > 0.05) { info = info + "\n\nR > r: тор с отверстием посередине."; }
  if (bR - sr < -0.05) { info = info + "\n\nR < r: поверхность самопересекается, отверстия нет."; }
}
]
