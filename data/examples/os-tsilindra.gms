[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

draw Surface { name = "side"; type = parametric; x = "cr * cos(2 * pi * u)"; y = "ch * (v - 0.5)"; z = "cr * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #3b82f6; opacity = 0.18 }
new Curve3D { name = "c1"; type = parametric; x = "cr * cos(2 * pi * t)"; y = "-ch / 2"; z = "cr * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "c2"; type = parametric; x = "cr * cos(2 * pi * t)"; y = "ch / 2"; z = "cr * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "trace"; type = parametric; x = "cr * cos(2 * pi * t)"; y = "my"; z = "cr * sin(2 * pi * t)"; segments = 90; color = #f59e0b; thickness = 2 }

new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "O1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₁") }
new Point3D { name = "O2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₂") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #f59e0b }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "S1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "axis"; pos = (E1, E2); interact = false; thickness = 5; color = #22c55e }
new Line3D { name = "mh"; pos = (M, H); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "q1"; pos = (S1, S2); interact = false; thickness = 2 }
new Line3D { name = "q2"; pos = (S2, S3); interact = false; thickness = 2 }
new Line3D { name = "q3"; pos = (S3, S4); interact = false; thickness = 2 }
new Line3D { name = "q4"; pos = (S4, S1); interact = false; thickness = 2 }

new UI { name = "sP"; type = slider; label = "поворот вокруг оси, °"; variable = psi; min = 0; max = 360; step = 1; default = 40 }
new UI { name = "sM"; type = slider; label = "высота точки M"; variable = mp; min = 0; max = 1; step = 0.01; default = 0.65 }
new UI { name = "sR"; type = slider; label = "радиус r"; variable = cr; min = 1; max = 3.5; step = 0.1; default = 2.4 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = ch; min = 2; max = 6; step = 0.1; default = 4.5 }

float psi = 40; float mp = 0.65; float cr = 2.4; float ch = 4.5; float my = 0; string info = "";

Update {
  float a = radians(psi);
  my = ch * (mp - 0.5);
  E1.pos.x = 0; E1.pos.y = -ch / 2 - 1.2; E1.pos.z = 0;
  E2.pos.x = 0; E2.pos.y = ch / 2 + 1.2; E2.pos.z = 0;
  O1.pos.x = 0; O1.pos.y = -ch / 2; O1.pos.z = 0;
  O2.pos.x = 0; O2.pos.y = ch / 2; O2.pos.z = 0;
  M.pos.x = cr * cos(a); M.pos.y = my; M.pos.z = cr * sin(a);
  H.pos.x = 0; H.pos.y = my; H.pos.z = 0;
  S1.pos.x = cr * cos(a); S1.pos.y = -ch / 2; S1.pos.z = cr * sin(a);
  S2.pos.x = -cr * cos(a); S2.pos.y = -ch / 2; S2.pos.z = -cr * sin(a);
  S3.pos.x = -cr * cos(a); S3.pos.y = ch / 2; S3.pos.z = -cr * sin(a);
  S4.pos.x = cr * cos(a); S4.pos.y = ch / 2; S4.pos.z = cr * sin(a);
  float dm = sqrt(M.pos.x * M.pos.x + M.pos.z * M.pos.z);
  info = "**Ось цилиндра** — прямая O₁O₂ (зелёная), проходящая через центры оснований перпендикулярно им. Длина O₁O₂ = h = " + format(ch, 2) + ".\n\n";
  info = info + "Точка M боковой поверхности удалена от оси на MH = " + format(dm, 2) + " = r при любом повороте (ψ = " + format(psi, 0) + "°) и любой высоте: боковая поверхность — множество точек, равноудалённых от оси на r, поэтому её след при вращении — окружность (оранжевая).\n\n";
  info = info + "Поворот вокруг оси на любой угол переводит цилиндр в себя — ось есть ось вращательной симметрии. Осевое сечение (тонкий прямоугольник) 2r × h = " + format(2 * cr, 2) + " × " + format(ch, 2) + " содержит ось и симметрично относительно неё.";
}
]
