[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

draw Surface { name = "side"; type = parametric; x = "cr * cos(2 * pi * u)"; y = "ch * (v - 0.5)"; z = "cr * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #3b82f6; opacity = 0.12 }
draw Surface { name = "disk1"; type = parametric; x = "cr * v * cos(2 * pi * u)"; y = "-ch / 2"; z = "cr * v * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #f59e0b; opacity = 0.35 }
draw Surface { name = "disk2"; type = parametric; x = "cr * v * cos(2 * pi * u)"; y = "ch / 2"; z = "cr * v * sin(2 * pi * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #f59e0b; opacity = 0.35 }
new Curve3D { name = "c1"; type = parametric; x = "cr * cos(2 * pi * t)"; y = "-ch / 2"; z = "cr * sin(2 * pi * t)"; segments = 90; color = #f59e0b; thickness = 3 }
new Curve3D { name = "c2"; type = parametric; x = "cr * cos(2 * pi * t)"; y = "ch / 2"; z = "cr * sin(2 * pi * t)"; segments = 90; color = #f59e0b; thickness = 3 }

new Point3D { name = "O1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₁") }
new Point3D { name = "O2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₂") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M") }
new Point3D { name = "M2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M′") }
new Point3D { name = "N"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("N") }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Line3D { name = "axis"; pos = (O1, O2); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "gen"; pos = (M, M2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "r1"; pos = (O1, M); interact = false; thickness = 2 }
new Line3D { name = "r2"; pos = (O2, M2); interact = false; thickness = 2 }
new Line3D { name = "chord"; pos = (M, N); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "dist"; pos = (O1, H); interact = false; thickness = 3; color = #3b82f6 }

new UI { name = "sT"; type = slider; label = "точка M на основании, °"; variable = tm; min = 0; max = 360; step = 1; default = 30 }
new UI { name = "sN"; type = slider; label = "точка N на основании, °"; variable = tn; min = 0; max = 360; step = 1; default = 150 }
new UI { name = "sR"; type = slider; label = "радиус r"; variable = cr; min = 1; max = 3.5; step = 0.1; default = 2.6 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = ch; min = 2; max = 6; step = 0.1; default = 4.5 }

float tm = 30; float tn = 150; float cr = 2.6; float ch = 4.5; string info = "";

Update {
  float a = radians(tm); float b = radians(tn);
  O1.pos.x = 0; O1.pos.y = -ch / 2; O1.pos.z = 0;
  O2.pos.x = 0; O2.pos.y = ch / 2; O2.pos.z = 0;
  M.pos.x = cr * cos(a); M.pos.y = -ch / 2; M.pos.z = cr * sin(a);
  M2.pos.x = cr * cos(a); M2.pos.y = ch / 2; M2.pos.z = cr * sin(a);
  N.pos.x = cr * cos(b); N.pos.y = -ch / 2; N.pos.z = cr * sin(b);
  H.pos.x = (M.pos.x + N.pos.x) / 2; H.pos.y = -ch / 2; H.pos.z = (M.pos.z + N.pos.z) / 2;
  float cl = sqrt((M.pos.x - N.pos.x) * (M.pos.x - N.pos.x) + (M.pos.z - N.pos.z) * (M.pos.z - N.pos.z));
  float dd = sqrt(H.pos.x * H.pos.x + H.pos.z * H.pos.z);
  info = "**Основания цилиндра** — два круга радиуса r = " + format(cr, 2) + ", лежащие в параллельных плоскостях перпендикулярно оси. Их центры O₁ и O₂ лежат на оси, O₁O₂ = h = " + format(ch, 2) + ".\n\n";
  info = info + "Основания равны и переходят друг в друга параллельным переносом на h вдоль оси: точке M нижнего основания отвечает ровно одна точка M′ верхнего — на образующей MM′ ∥ O₁O₂, MM′ = " + format(ch, 2) + ". Площадь одного основания S = πr² = " + format(pi * cr * cr, 2) + ", обоих — 2πr² = " + format(2 * pi * cr * cr, 2) + ".\n\n";
  info = info + "Хорда MN = " + format(cl, 2) + " находится на расстоянии O₁H = " + format(dd, 2) + " от центра, и O₁H² + (MN/2)² = " + format(dd * dd + cl * cl / 4, 2) + " = r². Чем длиннее хорда, тем ближе она к центру; диаметр проходит через центр (O₁H = 0).";
}
]
