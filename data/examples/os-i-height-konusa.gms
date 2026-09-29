[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); color = #f59e0b }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H"); active = d > 0.05 }
new Curve3D { name = "rim"; type = parametric; x = "rr * cos(2 * pi * t)"; y = "-hh / 2"; z = "rr * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 128; thickness = 1 }
new Line3D { name = "ax"; pos = (S, O); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "ht"; pos = (S, H); interact = false; thickness = 4; color = #f59e0b; active = d > 0.05 }
new Line3D { name = "oh"; pos = (O, H); interact = false; thickness = 3; color = #3b82f6; active = d > 0.05 }

new UI { name = "s_h"; type = slider; label = "высота h"; variable = hh; min = 2; max = 7; step = 0.1; default = 5 }
new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = rr; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { name = "s_d"; type = slider; label = "смещение вершины d"; variable = d; min = 0; max = 3; step = 0.05; default = 1.5 }
new UI { name = "s_p"; type = slider; label = "направление смещения, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }

float hh = 5; float rr = 3; float d = 1.5; float psi = 40; float ax = 0; float az = 0; string info = "";
Function fp(t, c) {
  float u = t * 32; float j = floor(u + 0.000001); float f = u - j;
  if (f < 0) { f = 0; }
  float k = floor(j / 2); float a = 6.283185 * k / 16;
  float w = f; if (j - 2 * k > 0.5) { w = 1 - f; }
  if (c < 0.5) { return ax + w * (rr * cos(a) - ax); }
  if (c < 1.5) { return hh / 2 - w * hh; }
  return az + w * (rr * sin(a) - az);
}

Update {
  ax = d * cos(radians(psi)); az = d * sin(radians(psi));
  S.pos.x = ax; S.pos.y = hh / 2; S.pos.z = az;
  O.pos.x = 0; O.pos.y = -hh / 2; O.pos.z = 0;
  H.pos.x = ax; H.pos.y = -hh / 2; H.pos.z = az;
  float len = sqrt(hh * hh + d * d);
  info = "**Ось** конуса — прямая, проходящая через вершину S и центр основания O (зелёный отрезок SO). **Высота** — перпендикуляр SH из вершины на плоскость основания, её длина h = " + format(hh, 1) + ".\n\n";
  if (d < 0.05) {
    info = info + "Вершина стоит точно над центром: H = O, ось перпендикулярна основанию, и высота совпадает с осью — SO = SH = " + format(hh, 1) + ". Это прямой конус, ось служит его осью симметрии.";
  } else {
    info = info + "Вершина смещена на OH = " + format(d, 2) + ", поэтому основание высоты H не совпадает с центром O. Из прямоугольного треугольника SHO: SO = √(h² + OH²) = √(" + format(hh * hh, 2) + " + " + format(d * d, 2) + ") = **" + format(len, 2) + "** > h = " + format(hh, 1) + ". В наклонном конусе ось длиннее высоты и не перпендикулярна основанию: угол между осью и плоскостью основания равен " + format(degrees(atan(hh / d)), 1) + "°.";
  }
}
]
