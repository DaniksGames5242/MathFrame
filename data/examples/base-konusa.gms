[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

// Основание конуса — круг, лежащий в плоскости, перпендикулярной оси; центр O — основание высоты.
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #3b82f6 }
new Curve3D { name = "rim"; type = parametric; x = "rr * cos(2 * pi * t)"; y = "-hh / 2"; z = "rr * sin(2 * pi * t)"; segments = 96; thickness = 4; color = #3b82f6 }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 128; thickness = 1 }
new Line3D { name = "ax"; pos = (S, O); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "rad"; pos = (O, M); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "sm"; pos = (S, M); interact = false; thickness = 4; color = #f59e0b }

new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = rr; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = hh; min = 2; max = 7; step = 0.1; default = 5 }
new UI { name = "s_f"; type = slider; label = "точка M на границе основания, °"; variable = phi; min = 0; max = 360; step = 1; default = 50 }

float hh = 5; float rr = 3; float phi = 50; string info = "";
Function fp(t, c) {
  float u = t * 32; float j = floor(u + 0.000001); float f = u - j;
  if (f < 0) { f = 0; }
  float k = floor(j / 2); float a = 6.283185 * k / 16;
  float w = f; if (j - 2 * k > 0.5) { w = 1 - f; }
  if (c < 0.5) { return w * rr * cos(a); }
  if (c < 1.5) { return hh / 2 - w * hh; }
  return w * rr * sin(a);
}

Update {
  S.pos.x = 0; S.pos.y = hh / 2; S.pos.z = 0;
  O.pos.x = 0; O.pos.y = -hh / 2; O.pos.z = 0;
  float a = radians(phi);
  M.pos.x = rr * cos(a); M.pos.y = -hh / 2; M.pos.z = rr * sin(a);
  float l = sqrt(hh * hh + rr * rr);
  info = "**Основание конуса** — круг с центром O, лежащий в плоскости, перпендикулярной оси SO; O — основание высоты h = " + format(hh, 1) + ". Радиус r = OM = " + format(rr, 1) + " — катет, описавший полный оборот.\n\n";
  info = info + "Любая точка M границы основания соединена с вершиной S отрезком SM = **l = √(r² + h²) = " + format(l, 2) + "** (при любом положении M, сейчас " + format(phi, 0) + "°), и угол ∠OSM = " + format(degrees(atan(rr / hh)), 1) + "° с осью один и тот же — половина угла при вершине.\n\n";
  info = info + "Площадь основания S = πr² = **" + format(pi * rr * rr, 2) + "**, длина его границы C = 2πr = **" + format(2 * pi * rr, 2) + "** — это длина дуги развёртки боковой поверхности. Вершина лежит на расстоянии h от плоскости основания.";
}
]
