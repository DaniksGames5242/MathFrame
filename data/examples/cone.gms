[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

// Прямой круговой конус — тело вращения прямоугольного треугольника SOM вокруг катета SO.
// Ползунок «оборот» — угол, на который треугольник уже повёрнут: образующие (гипотенуза) заметают боковую поверхность.
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #3b82f6 }
new Curve3D { name = "rim"; type = parametric; x = "rr * cos(al * t)"; y = "-hh / 2"; z = "rr * sin(al * t)"; segments = 96; thickness = 2; color = #3b82f6 }
new Curve3D { name = "sec"; type = parametric; x = "rr * q * cos(al * t)"; y = "hh / 2 - q * hh"; z = "rr * q * sin(al * t)"; segments = 96; thickness = 2; color = #22c55e }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 96; thickness = 1 }
new Line3D { name = "ax"; pos = (S, O); interact = false; thickness = 4 }
new Line3D { name = "rad"; pos = (O, M); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "sm"; pos = (S, M); interact = false; thickness = 5; color = #f59e0b }

new UI { name = "s_h"; type = slider; label = "высота h"; variable = hh; min = 2; max = 7; step = 0.1; default = 5 }
new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = rr; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { name = "s_a"; type = slider; label = "оборот треугольника, °"; variable = ang; min = 30; max = 360; step = 1; default = 250 }
new UI { name = "s_q"; type = slider; label = "сечение на высоте от вершины"; variable = q; min = 0.1; max = 0.95; step = 0.01; default = 0.6 }

float hh = 5; float rr = 3; float ang = 250; float q = 0.6; float al = 4.36; string info = "";
Function fp(t, c) {
  float u = t * 48; float j = floor(u + 0.000001); float f = u - j;
  if (f < 0) { f = 0; }
  float k = floor(j / 2); float a = al * k / 24;
  float w = f; if (j - 2 * k > 0.5) { w = 1 - f; }
  if (c < 0.5) { return w * rr * cos(a); }
  if (c < 1.5) { return hh / 2 - w * hh; }
  return w * rr * sin(a);
}

Update {
  al = radians(ang);
  S.pos.x = 0; S.pos.y = hh / 2; S.pos.z = 0;
  O.pos.x = 0; O.pos.y = -hh / 2; O.pos.z = 0;
  M.pos.x = rr * cos(al); M.pos.y = -hh / 2; M.pos.z = rr * sin(al);
  float l = sqrt(hh * hh + rr * rr);
  float rs = rr * q;
  info = "**Конус** — тело, полученное вращением прямоугольного треугольника SOM вокруг катета SO (сейчас повёрнут на " + format(ang, 0) + "°). Катет SO — ось и высота h = " + format(hh, 1) + ", катет OM — радиус основания r = " + format(rr, 1) + " (синий круг), гипотенуза SM — образующая l (жёлтая).\n\n";
  info = info + "Все образующие равны и сходятся в вершине S: **l = √(r² + h²) = √(" + format(rr * rr, 2) + " + " + format(hh * hh, 2) + ") = " + format(l, 2) + "**. Осевое сечение — равнобедренный треугольник со сторонами " + format(l, 2) + ", " + format(l, 2) + " и основанием " + format(2 * rr, 1) + ".\n\n";
  info = info + "Сечение плоскостью, параллельной основанию, — круг меньшего радиуса (зелёный): r·" + format(q, 2) + " = " + format(rs, 2) + ".\n\n";
  info = info + "S_бок = πrl = " + format(pi * rr * l, 2) + ", S_полн = πrl + πr² = " + format(pi * rr * l + pi * rr * rr, 2) + ", V = ⅓πr²h = " + format(pi * rr * rr * hh / 3, 2) + " — треть объёма цилиндра с тем же основанием и высотой (" + format(pi * rr * rr * hh, 2) + ").";
}
]
