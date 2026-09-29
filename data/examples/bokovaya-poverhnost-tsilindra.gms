[
description = "{info}"

field width = 16; field height = 10; field depth = 16;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

// Боковая поверхность разворачивается в прямоугольник: длина s вдоль окружности основания
// сохраняется, кривизна 1/ρ, ρ = r / bend, плавно уменьшается от 1/r (цилиндр) до 0 (плоскость).
draw Surface { name = "side"; type = parametric; x = "bx(cr * pi * (2 * u - 1))"; y = "ch * (v - 0.5)"; z = "bz(cr * pi * (2 * u - 1))"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 60; color = #3b82f6; opacity = 0.35 }
new Curve3D { name = "c1"; type = parametric; x = "bx(cr * pi * (2 * t - 1))"; y = "-ch / 2"; z = "bz(cr * pi * (2 * t - 1))"; segments = 120; color = #f59e0b; thickness = 4 }
new Curve3D { name = "c2"; type = parametric; x = "bx(cr * pi * (2 * t - 1))"; y = "ch / 2"; z = "bz(cr * pi * (2 * t - 1))"; segments = 120; color = #f59e0b; thickness = 4 }
new Point3D { name = "G1"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "G2"; pos = (0, 0, 0); dynamic = false; collision = false }
new Line3D { name = "gen"; pos = (G1, G2); interact = false; thickness = 5; color = #22c55e }

new UI { name = "sB"; type = slider; label = "развёртка: 1 — цилиндр, 0 — плоскость"; variable = bend; min = 0; max = 1; step = 0.01; default = 1 }
new UI { name = "sG"; type = slider; label = "образующая"; variable = gp; min = 0; max = 1; step = 0.01; default = 0.5 }
new UI { name = "sR"; type = slider; label = "радиус r"; variable = cr; min = 1; max = 2.4; step = 0.1; default = 1.8 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = ch; min = 2; max = 6; step = 0.1; default = 4.5 }

float bend = 1; float gp = 0.5; float cr = 1.8; float ch = 4.5; float cc = 1; string info = "";

Function bx(s) { return sin(cc * s) / cc; }
Function bz(s) { return (1 - cos(cc * s)) / cc - cr * max(bend, 0.03); }

Update {
  float bb = max(bend, 0.03);
  cc = bb / cr;
  float s0 = cr * pi * (2 * gp - 1);
  G1.pos.x = bx(s0); G1.pos.y = -ch / 2; G1.pos.z = bz(s0);
  G2.pos.x = bx(s0); G2.pos.y = ch / 2; G2.pos.z = bz(s0);
  info = "**Боковая поверхность цилиндра** — все точки, не лежащие на основаниях; каждая лежит на образующей (зелёная) — отрезке, параллельном оси, соединяющем точки окружностей оснований. Все образующие параллельны и равны высоте h = " + format(ch, 2) + ".\n\n";
  info = info + "При развёртке поверхность переходит в прямоугольник со сторонами 2πr = " + format(2 * pi * cr, 2) + " (длина окружности основания) и h = " + format(ch, 2) + ". Поэтому **S = 2πrh = " + format(2 * pi * cr, 2) + " · " + format(ch, 2) + " = " + format(2 * pi * cr * ch, 2) + "**.";
  if (bend > 0.97) { info = info + "\n\nСейчас поверхность свёрнута в цилиндр: расстояние от любой её точки до оси равно r = " + format(cr, 2) + "."; }
  if (bend < 0.05) { info = info + "\n\nСейчас поверхность развёрнута в плоский прямоугольник."; }
}
]
