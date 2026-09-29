[
description = "{info}"

field width = 18; field height = 16; field depth = 14;
show grid = false; show axes = false;
camera start rot = (15, 75);
camera start zoom = 1.6;

// Прямой цилиндр и его развёртка. Ползунок «развёртка» разворачивает боковую поверхность в прямоугольник h × 2πr:
// полоса длины 2πr изгибается по дуге радиуса r / (1 − q), а основания (круги) шарнирно повёрнуты вокруг точки касания.
new Curve3D { name = "eb"; type = parametric; x = "sin(kap * L * t) / kap - ox"; y = "-h / 2"; z = "(1 - cos(kap * L * t)) / kap - oz"; segments = 120; color = #3b82f6; thickness = 3 }
new Curve3D { name = "et"; type = parametric; x = "sin(kap * L * t) / kap - ox"; y = "h / 2"; z = "(1 - cos(kap * L * t)) / kap - oz"; segments = 120; color = #3b82f6; thickness = 3 }
new Curve3D { name = "g0"; type = parametric; x = "sin(kap * L * 0 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 0 / 12)) / kap - oz"; segments = 2; color = #f59e0b; thickness = 3 }
new Curve3D { name = "g1"; type = parametric; x = "sin(kap * L * 1 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 1 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g2"; type = parametric; x = "sin(kap * L * 2 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 2 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g3"; type = parametric; x = "sin(kap * L * 3 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 3 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g4"; type = parametric; x = "sin(kap * L * 4 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 4 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g5"; type = parametric; x = "sin(kap * L * 5 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 5 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g6"; type = parametric; x = "sin(kap * L * 6 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 6 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g7"; type = parametric; x = "sin(kap * L * 7 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 7 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g8"; type = parametric; x = "sin(kap * L * 8 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 8 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g9"; type = parametric; x = "sin(kap * L * 9 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 9 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g10"; type = parametric; x = "sin(kap * L * 10 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 10 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g11"; type = parametric; x = "sin(kap * L * 11 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 11 / 12)) / kap - oz"; segments = 2; thickness = 1 }
new Curve3D { name = "g12"; type = parametric; x = "sin(kap * L * 12 / 12) / kap - ox"; y = "-h / 2 + h * t"; z = "(1 - cos(kap * L * 12 / 12)) / kap - oz"; segments = 2; color = #f59e0b; thickness = 3 }
new Curve3D { name = "cb"; type = parametric; x = "r * cos(2 * pi * t) * tx + r * (1 + sin(2 * pi * t)) * sg * nx"; y = "-h / 2 - r * (1 + sin(2 * pi * t)) * cg"; z = "r * cos(2 * pi * t) * tz + r * (1 + sin(2 * pi * t)) * sg * nz"; segments = 90; color = #22c55e; thickness = 3; active = showB > 0.5 }
new Curve3D { name = "ct"; type = parametric; x = "r * cos(2 * pi * t) * tx + r * (1 + sin(2 * pi * t)) * sg * nx"; y = "h / 2 + r * (1 + sin(2 * pi * t)) * cg"; z = "r * cos(2 * pi * t) * tz + r * (1 + sin(2 * pi * t)) * sg * nz"; segments = 90; color = #22c55e; thickness = 3; active = showB > 0.5 }

new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = r; min = 0.8; max = 2.2; step = 0.1; default = 2 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 1; max = 4; step = 0.1; default = 3 }
new UI { name = "s_q"; type = slider; label = "развёртка"; variable = q; min = 0; max = 1; step = 0.01; default = 0.6 }
new UI { name = "s_m"; type = select; label = "показать"; variable = sf; options = ("side", "full"); labels = ("боковую поверхность", "полную поверхность"); default = "full" }

string info = "";
float r = 2; float h = 3; float q = 0.6;
string sf = "full"; float showB = 1;
float kap = 0.4; float L = 9.4; float ox = 0; float oz = 0;
float tx = 1; float tz = 0; float nx = 0; float nz = 1; float sg = 1; float cg = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float u = max(1 - q, 0.001);
  L = 2 * pi * r; kap = u / r;
  float a0 = pi * u;
  ox = sin(a0) / kap; oz = (1 - cos(a0)) / kap;
  tx = cos(a0); tz = sin(a0); nx = -sin(a0); nz = cos(a0);
  sg = sin(pi / 2 * u); cg = cos(pi / 2 * u);
  if (sf == "full") { showB = 1; } else { showB = 0; }
  float sb = 2 * pi * r * h; float so = pi * r * r;
  info = "**Площадь поверхности цилиндра** складывается из боковой поверхности и двух оснований. Боковая поверхность при развёртке — прямоугольник со сторонами h = " + format(h, 2) + " и 2πr = " + format(L, 2) + ", основания — два круга радиуса r = " + format(r, 2) + ".\n\n**S_бок = 2πrh = " + format(sb, 2) + "**.\n\n";
  if (showB > 0.5) { info = info + "**S_полн = S_бок + 2πr² = 2πr(r + h) = " + format(sb, 2) + " + " + format(2 * so, 2) + " = " + format(sb + 2 * so, 2) + "** (два основания по πr² = " + format(so, 2) + ")."; }
  else { info = info + "Основания не входят в боковую поверхность; с ними получилось бы S_полн = " + format(sb + 2 * so, 2) + "."; }
}
]
