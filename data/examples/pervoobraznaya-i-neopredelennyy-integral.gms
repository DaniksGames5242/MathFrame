[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float x0 = 1; string info = "";
func F(x) = x * x;
func f(x) = 2 * x;
draw Function { name = "gF"; f = "F"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 2 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "точка x"; variable = x0; min = -2.2; max = 2.2; step = 0.1; default = 1 }
Update {
  float k = 2 * x0;
  P.pos.x = x0; P.pos.y = F(x0);
  Q.pos.x = x0; Q.pos.y = f(x0);
  info = "**Первообразная и неопределённый интеграл**: F(x) = x² (синий) — первообразная для f(x) = 2x (оранжевый), так как F′(x) = f(x). Множество всех первообразных ∫2x dx = x² + C.\n\nВ точке x = " + format(x0, 1) + ": наклон касательной к F равен F′(x) = " + format(k, 2) + " и совпадает со значением f(x) = " + format(k, 2) + " (точка Q на оранжевом графике).";
}
]
