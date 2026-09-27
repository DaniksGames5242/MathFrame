[
description = "{info}"
field width = 6; field height = 6;
camera type = fixed;
float th = 0.9; string info = "";
new Curve { name = "circ"; type = parametric; x = "cos(6.2832 * t)"; y = "sin(6.2832 * t)"; }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "P"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "rad"; pos = (O, P); }
new UI { type = slider; label = "угол α (рад)"; variable = th; min = 0.05; max = 6.2; step = 0.05; default = 0.9 }
Update {
  P.pos.x = cos(th); P.pos.y = sin(th);
  float s = sin(th); float c = cos(th);
  float id1 = s * s + c * c;
  string tg = "не определён (cos α = 0)"; if (abs(c) > 0.02) { tg = format(s / c, 2); }
  info = "**Основное тригонометрическое тождество:** sin²α + cos²α = 1 — сумма квадратов координат точки на единичной окружности.\n\nПри α = " + format(th, 2) + ": sin α = " + format(s, 2) + ", cos α = " + format(c, 2) + ", sin²α + cos²α = " + format(id1, 3) + ".\n\ntan α = sin α / cos α = " + tg + ".";
}
]
