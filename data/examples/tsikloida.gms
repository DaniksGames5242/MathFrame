[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float r = 2; float th = 3.14159; float gy = -4; float wd = 13;
string info = "";
new Curve { name = "ground"; type = parametric; x = "-10 + 20 * t"; y = "gy"; segments = 2; thickness = 2 }
new Curve { name = "cyc"; type = parametric; x = "r * (3.14159 + (2 * t - 1) * wd / r - sin(3.14159 + (2 * t - 1) * wd / r)) - 3.14159 * r"; y = "gy + r * (1 - cos(3.14159 + (2 * t - 1) * wd / r))"; segments = 400; color = #3b82f6; thickness = 3 }
new Curve { name = "wheel"; type = parametric; x = "r * th - 3.14159 * r + r * cos(6.28318 * t)"; y = "gy + r + r * sin(6.28318 * t)"; segments = 100; thickness = 1.5; layer = 12 }
new Point { name = "K1"; pos = (-6, -4); dynamic = false; collision = false; text = true("K") }
new Point { name = "K2"; pos = (6, -4); dynamic = false; collision = false; text = true("K") }
new Point { name = "V"; pos = (0, 0); dynamic = false; collision = false; text = true("V") }
new Point { name = "Cc"; pos = (0, 0); dynamic = false; collision = false; layer = 30 }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("M"); layer = 60 }
new Line { name = "cm"; pos = (Cc, M); color = #f59e0b; interact = false }
new UI { type = slider; label = "радиус r"; variable = r; min = 0.6; max = 2.2; step = 0.1; default = 2 }
new UI { type = slider; label = "угол поворота t"; variable = th; min = 0; max = 6.28318; step = 0.02; default = 3.14159 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float pi = 3.14159265;
  float mx = r * (th - sin(th)) - pi * r; float my = gy + r * (1 - cos(th));
  M.pos.x = mx; M.pos.y = my; Cc.pos.x = r * th - pi * r; Cc.pos.y = gy + r;
  K1.pos.x = -pi * r; K1.pos.y = gy; K2.pos.x = pi * r; K2.pos.y = gy;
  V.pos.x = 0; V.pos.y = gy + 2 * r;
  float arc = 4 * r * (1 - cos(th / 2));
  info = "**Циклоида** — траектория точки M на окружности радиуса r = " + format(r, 1) + ", катящейся по прямой без проскальзывания: x = r(t − sin t), y = r(1 − cos t), здесь t = " + format(th, 2) + " (" + format(th * 180 / pi, 0) + "°).\n\nОдна арка соответствует полному обороту: основание KK равно длине окружности 2πr = " + format(2 * pi * r, 2) + ", высота вершины V равна 2r = " + format(2 * r, 1) + ". В точках возврата K кривая касается прямой (каспы). Длина дуги от начала арки до M — " + format(arc, 2) + ", всей арки — 8r = " + format(8 * r, 1) + "; площадь под аркой 3πr² = " + format(3 * pi * r * r, 2) + ".";
}
]
