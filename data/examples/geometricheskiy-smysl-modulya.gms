[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
float x = -4; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.35 }
new Point { name = "X"; pos = (-4, 0); collideWithPoints = false }
new Line { name = "ox"; pos = (O, X); color = #3b82f6; thickness = 4 }
new UI { type = slider; label = "x"; variable = x; min = -9.5; max = 9.5; step = 0.1; default = -4 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  X.pos.x = x; X.pos.y = 0;
  info = "**Геометрический смысл модуля:** |x| — длина отрезка от точки 0 до точки x на числовой прямой.\n\nПри x = " + num(x, 1) + ": |x| = " + format(ox.length, 1) + " — расстояние от точки " + num(x, 1) + " до нуля одинаково, в какую бы сторону x не откладывалась.";
}
]
