[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #3b82f6 }
new Point3D { name = "N"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("N"); color = #3b82f6 }
new Curve3D { name = "rim"; type = parametric; x = "rr * cos(2 * pi * t)"; y = "-hh / 2"; z = "rr * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 128; thickness = 1 }
new Line3D { name = "ax"; pos = (S, O); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "rad"; pos = (O, M); interact = false; thickness = 2 }
new Line3D { name = "sm"; pos = (S, M); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "sn"; pos = (S, N); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "mn"; pos = (M, N); interact = false; thickness = 2; color = #3b82f6 }

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
  N.pos.x = -rr * cos(a); N.pos.y = -hh / 2; N.pos.z = -rr * sin(a);
  float l = sqrt(hh * hh + rr * rr);
  float half = degrees(atan(rr / hh));
  info = "**Вершина конуса** S лежит на оси, на расстоянии h = " + format(hh, 1) + " от плоскости основания (зелёный отрезок SO). Все образующие сходятся в S.\n\n";
  info = info + "Расстояние от S до любой точки окружности основания одно и то же: SM = √(h² + r²) = √(" + format(hh * hh, 2) + " + " + format(rr * rr, 2) + ") = **" + format(l, 2) + "**. Для диаметрально противоположной точки N получаем SN = " + format(l, 2) + " — треугольник SMN равнобедренный.\n\n";
  info = info + "Угол между образующей и осью постоянен: ∠OSM = arctg(r / h) = **" + format(half, 1) + "°** при любом положении M.";
}
]
