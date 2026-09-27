[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; string info = "";
func f(x) = x;
func g(x) = x + k;
draw Function { name = "g0"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "g1"; f = "g"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "Δb (сдвиг второй прямой)"; variable = k; min = -6; max = 6; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string s = "(x) + " + format(k, 1); if (k < 0) { s = "(x) − " + format(-k, 1); }
  info = "Оранжевая — исходная **y = x**, синяя — **y = " + s + "**. Прямые имеют одинаковый угловой коэффициент k = 1, поэтому " + (k != 0 ? "параллельны." : "совпадают.");
}
]
