[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float c = 0; float x0 = 1; string info = "";
func F(x) = x * x * x / 3 + c;
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tg"; pos = (T1, T2) }
new UI { type = slider; label = "точка x"; variable = x0; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "константа C"; variable = c; min = -2; max = 2; step = 0.5; default = 0 }
Update {
  float y = F(x0);
  float k = x0 * x0;
  P.pos.x = x0; P.pos.y = y;
  float norm = sqrt(1 + k * k);
  T1.pos.x = x0 - 2 / norm; T1.pos.y = y - 2 * k / norm;
  T2.pos.x = x0 + 2 / norm; T2.pos.y = y + 2 * k / norm;
  info = "**Первообразная**: F(x) = x³/3 + C — функция, для которой F′(x) = f(x) = x² при любом x. В точке x = " + format(x0, 1) + " касательная к графику F имеет наклон F′(x) = " + format(k, 2) + ", равный значению f(x).\n\nПри изменении C = " + format(c, 1) + " график сдвигается по вертикали, а наклон касательной в каждой точке x не меняется.";
}
]
