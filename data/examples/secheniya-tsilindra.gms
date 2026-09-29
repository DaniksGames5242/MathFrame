[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.8;

// Прямой цилиндр с осью Oy и секущая плоскость x · sin θ + y · cos θ = p (θ — угол между плоскостью и основаниями).
// Сечение — граница фигуры «диск ∩ полоса»: по окружности обходится параметр t, а x зажимается в [xa, xb],
// где xa, xb — абсциссы, при которых плоскость выходит на верхнее и нижнее основание.
new Curve3D { name = "cb"; type = parametric; x = "r * cos(2 * pi * t)"; y = "-h / 2"; z = "r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "ct"; type = parametric; x = "r * cos(2 * pi * t)"; y = "h / 2"; z = "r * sin(2 * pi * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "g0"; type = parametric; x = "r * cos(0 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(0 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g1"; type = parametric; x = "r * cos(1 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(1 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g2"; type = parametric; x = "r * cos(2 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(2 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g3"; type = parametric; x = "r * cos(3 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(3 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g4"; type = parametric; x = "r * cos(4 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(4 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g5"; type = parametric; x = "r * cos(5 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(5 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g6"; type = parametric; x = "r * cos(6 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(6 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g7"; type = parametric; x = "r * cos(7 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(7 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g8"; type = parametric; x = "r * cos(8 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(8 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g9"; type = parametric; x = "r * cos(9 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(9 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g10"; type = parametric; x = "r * cos(10 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(10 * pi / 6)"; segments = 2; thickness = 1 }
new Curve3D { name = "g11"; type = parametric; x = "r * cos(11 * pi / 6)"; y = "-h / 2 + h * t"; z = "r * sin(11 * pi / 6)"; segments = 2; thickness = 1 }
new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "PU"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "PW"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }
draw InfPlane { name = "plane"; points = (P0, PU, PW); size = 2.6; opacity = 0.22; color = #f59e0b }
new Curve3D { name = "sec"; type = parametric; x = "min(max(r * cos(2 * pi * t), xa), xb)"; y = "(p - min(max(r * cos(2 * pi * t), xa), xb) * sq) / cq"; z = "sqrt(max(r * r - min(max(r * cos(2 * pi * t), xa), xb) * min(max(r * cos(2 * pi * t), xa), xb), 0)) * sin(2 * pi * t) / (abs(sin(2 * pi * t)) + 0.000001)"; segments = 180; color = #f59e0b; thickness = 5; active = hit > 0.5 }

new UI { name = "s_r"; type = slider; label = "радиус основания r"; variable = r; min = 1; max = 2.5; step = 0.1; default = 1.6 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2; max = 5; step = 0.1; default = 5 }
new UI { name = "s_th"; type = slider; label = "угол θ плоскости к основаниям, °"; variable = th; min = 0; max = 90; step = 1; default = 40 }
new UI { name = "s_p"; type = slider; label = "положение плоскости p"; variable = p; min = -3; max = 3; step = 0.05; default = 0.3 }

string info = "";
float r = 1.6; float h = 5; float th = 40; float p = 0.3;
float sq = 0.64; float cq = 0.77; float xa = -3; float xb = 3; float hit = 1;

Update {
  float g = radians(th);
  sq = max(sin(g), 0.0001); cq = max(cos(g), 0.0001);
  xa = (p - h / 2 * cq) / sq; xb = (p + h / 2 * cq) / sq;
  hit = 0;
  if (xb > -r + 0.001 && xa < r - 0.001) { hit = 1; }
  P0.pos.x = p * sin(g); P0.pos.y = p * cos(g); P0.pos.z = 0;
  PU.pos.x = P0.pos.x + cos(g); PU.pos.y = P0.pos.y - sin(g); PU.pos.z = 0;
  PW.pos.x = P0.pos.x; PW.pos.y = P0.pos.y; PW.pos.z = 1;
  info = "**Сечение цилиндра плоскостью** зависит от положения плоскости относительно оси. Цилиндр: r = " + format(r, 2) + ", h = " + format(h, 2) + "; плоскость наклонена к основаниям на θ = " + format(th, 0) + "°.\n\n";
  if (hit < 0.5) {
    info = info + "**Плоскость не пересекает цилиндр** — сечения нет.";
  } else if (th < 0.5) {
    info = info + "**Плоскость параллельна основаниям — сечение круг радиуса r = " + format(r, 2) + "**, равный основаниям; его площадь πr² = " + format(pi * r * r, 2) + " не меняется при смещении вдоль оси.";
  } else if (th > 89.5) {
    float w = sqrt(max(r * r - p * p, 0));
    if (abs(p) < 0.03) { info = info + "**Плоскость содержит ось — осевое сечение, прямоугольник** со сторонами h = " + format(h, 2) + " и диаметром 2r = " + format(2 * r, 2) + ", площадь 2rh = " + format(2 * r * h, 2) + "."; }
    else { info = info + "**Плоскость параллельна оси — сечение прямоугольник** со сторонами h = " + format(h, 2) + " и хордой основания 2√(r² − p²) = " + format(2 * w, 2) + " (плоскость на расстоянии |p| = " + format(abs(p), 2) + " от оси); стороны, параллельные оси, — образующие."; }
  } else if (xa <= -r && xb >= r) {
    info = info + "**Плоскость пересекает все образующие — сечение эллипс.** Малая ось равна диаметру основания 2r = " + format(2 * r, 2) + ", большая — 2r / cos θ = " + format(2 * r / cos(g), 2) + "; площадь πr² / cos θ = " + format(pi * r * r / cos(g), 2) + ".";
  } else {
    info = info + "**Плоскость пересекает боковую поверхность и основание** (θ = " + format(th, 0) + "° слишком велик для этой высоты): сечение — часть эллипса, ограниченная дугой эллипса и хордой основания (или двумя хордами, если пересечены оба основания). Чтобы получить целый эллипс, уменьшите θ или увеличьте высоту: нужно h · ctg θ ≥ 2r, сейчас " + format(h * cos(g) / sq, 2) + " против " + format(2 * r, 2) + ".";
  }
}
]
