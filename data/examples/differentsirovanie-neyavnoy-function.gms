[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float t = 0.15; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "c"; center = O; radius = 4 }
new Point { name = "P"; circle = "c"; t = 0.15; color = #f59e0b }
new UI { type = slider; label = "положение точки на окружности"; variable = t; min = 0.01; max = 0.99; step = 0.005; default = 0.15 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.t = t;
  float x = P.pos.x; float y = P.pos.y;
  string sl = "касательная вертикальна, dy/dx не определён.";
  if (abs(y) > 0.05) { sl = "dy/dx = −x/y = " + num(-x / y, 2) + "."; }
  info = "Окружность x² + y² = 16 задаёт y как неявную функцию x. Дифференцируем по x обе части равенства: 2x + 2y·y' = 0, отсюда y' = −x/y.\n\nВ точке (x; y) = (" + num(x, 2) + "; " + num(y, 2) + ") " + sl;
}
]
