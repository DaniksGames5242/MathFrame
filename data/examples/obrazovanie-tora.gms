[
description = "{info}"

field width = 10;
field height = 10;
field depth = 10;
show grid = false;
show axes = false;

// ---- Образование тора: окружность радиуса r (центр C на расстоянии R от оси y) поворачивается на угол ω ----
draw Surface { name = "swept"; type = parametric; x = "(bR + sr * cos(2 * pi * v)) * cos(om * u)"; y = "sr * sin(2 * pi * v)"; z = "(bR + sr * cos(2 * pi * v)) * sin(om * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 48; color = #3b82f6; opacity = 0.55 }
new Curve3D { name = "gen0"; type = parametric; x = "bR + sr * cos(2 * pi * t)"; y = "sr * sin(2 * pi * t)"; z = "0"; segments = 60; color = #3b82f6; thickness = 2 }
new Curve3D { name = "gen"; type = parametric; x = "(bR + sr * cos(2 * pi * t)) * cos(om)"; y = "sr * sin(2 * pi * t)"; z = "(bR + sr * cos(2 * pi * t)) * sin(om)"; segments = 60; color = #f59e0b; thickness = 4 }
new Curve3D { name = "path"; type = parametric; x = "bR * cos(om * t)"; y = "0"; z = "bR * sin(om * t)"; segments = 100; color = #22c55e; thickness = 4 }
new Curve3D { name = "par"; type = parametric; x = "(bR + sr * cos(pp)) * cos(om * t)"; y = "sr * sin(pp)"; z = "(bR + sr * cos(pp)) * sin(om * t)"; segments = 100; color = #f59e0b; thickness = 2 }
new Point3D { name = "Oc"; pos = (0, 0, 0); dynamic = false; text = true("O") }
new Point3D { name = "C1"; pos = (2.5, 0, 0); dynamic = false; text = true("C") }
new Point3D { name = "C2"; pos = (2.5, 0, 0); dynamic = false; text = true("C′") }
new Point3D { name = "Q1"; pos = (0, -4, 0); dynamic = false; active = false }
new Point3D { name = "Q2"; pos = (0, 4, 0); dynamic = false; active = false }
new Line3D { name = "axis"; pos = (Q1, Q2); thickness = 2 }

new UI { name = "sO"; type = slider; label = "угол поворота ω°"; variable = deg; min = 5; max = 360; step = 1; default = 120 }
new UI { name = "sR"; type = slider; label = "большой радиус R"; variable = bR; min = 0.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sr"; type = slider; label = "малый радиус r"; variable = sr; min = 0.3; max = 2; step = 0.1; default = 1 }

float bR = 2.5; float sr = 1; float deg = 120; float om = 2.09; float pp = 0.8;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  om = radians(deg);
  C1.pos.x = bR; C2.pos.x = bR * cos(om); C2.pos.z = bR * sin(om);
  float L = bR * om;
  info = "**Образование тора.** Окружность радиуса r = " + format(sr, 1) + " (малый радиус), центр C которой удалён от оси на R = " + format(bR, 1) + " (большой радиус), поворачивается вокруг оси на угол ω = " + format(deg, 0) + "°. Каждая её точка описывает окружность (параллель) с центром на оси; центр C движется по окружности радиуса R и за поворот проходит путь Rω = " + format(L, 2) + ".\n\nОкружность в каждом положении — меридиан радиуса r; меридиан и параллель через точку поверхности перпендикулярны.";
  if (deg > 359.5) { info = info + " Оборот завершён: образующая вернулась на место, поверхность замкнута — тор."; }
  if (bR - sr > 0.05) { info = info + "\n\nR > r: поверхность без самопересечений, посередине отверстие."; }
  if (abs(bR - sr) <= 0.05) { info = info + "\n\nR = r: отверстие стянулось в точку — образующая касается оси."; }
  if (bR - sr < -0.05) { info = info + "\n\nR < r: образующая пересекает ось, поверхность самопересекается."; }
}
]
