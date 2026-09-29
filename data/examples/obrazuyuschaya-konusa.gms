[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #3b82f6 }
new Curve3D { name = "rim"; type = parametric; x = "rr * cos(2 * pi * t)"; y = "-hh / 2"; z = "rr * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 128; thickness = 1 }
new Line3D { name = "ax"; pos = (S, O); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "rad"; pos = (O, M); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "sm"; pos = (S, M); interact = false; thickness = 5; color = #f59e0b }

new UI { name = "s_h"; type = slider; label = "высота h"; variable = hh; min = 2; max = 7; step = 0.1; default = 5 }
new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = rr; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { name = "s_f"; type = slider; label = "положение точки M на окружности, °"; variable = phi; min = 0; max = 360; step = 1; default = 50 }

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
  float th = 360 * rr / l;
  info = "**Образующая конуса** — отрезок, соединяющий вершину S с точкой M окружности основания (жёлтый). Она служит гипотенузой прямоугольного треугольника SOM, катеты которого — высота h = " + format(hh, 1) + " (зелёный) и радиус r = " + format(rr, 1) + " (синий).\n\n";
  info = info + "l = √(h² + r²) = √(" + format(hh * hh, 2) + " + " + format(rr * rr, 2) + ") = **" + format(l, 2) + "**. Точка M движется по окружности, а длина образующей не меняется: при φ = " + format(phi, 0) + "°, " + format(phi + 90, 0) + "°, " + format(phi + 180, 0) + "°, " + format(phi + 270, 0) + "° она всё та же — " + format(l, 2) + ". Угол с осью тоже постоянен: ∠OSM = " + format(degrees(atan(rr / hh)), 1) + "°.\n\n";
  info = info + "При развёртке каждая образующая переходит в радиус сектора; его угол θ = 360° · r / l = **" + format(th, 1) + "°**.";
}
]
