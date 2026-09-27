[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float x0 = 1; string info = "";
func f(x) = (x * x - 4) / (x - 2);
func g(x) = x + 2;
draw Function { name = "gr"; f = "g"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (1, 3); graph = "gr"; color = #f59e0b }
new UI { type = slider; label = "x"; variable = x0; min = -5.9; max = 5.9; step = 0.1; default = 1 }
Update {
  if (abs(x0 - 2) < 0.15) { x0 = 2.2; }
  P.pos.x = x0; P.pos.y = g(x0);
  info = "**Тождественное преобразование:** (x² − 4)/(x − 2) = x + 2 при x ≠ 2 — числитель разложен на множители (x − 2)(x + 2), общий множитель x − 2 сокращён.\n\nПри x = " + format(x0, 2) + ": (x² − 4)/(x − 2) = " + format(f(x0), 2) + " и x + 2 = " + format(g(x0), 2) + " — совпадает.";
}
]
