[
description = "{info}"
field width = 12.6; field height = 8;
camera type = fixed;
float a = 0.5; string info = "";
func fs(x) = sin(x);
func fa(x) = a + 0 * x;
draw Function { name = "gs"; f = "fs"; xmin = -6.28; xmax = 6.28; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "ga"; f = "fa"; xmin = -6.28; xmax = 6.28; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "a"; variable = a; min = -0.95; max = 0.95; step = 0.05; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float x1 = asin(a); float x2 = 3.14159 - x1;
  info = "**sin x = a** при a = " + format(a, 2) + ": x = " + num(x1, 2) + " + 2πk или x = " + num(x2, 2) + " + 2πk, k ∈ ℤ.\n\nСиний график — y = sin x, оранжевый — y = a; каждая точка их пересечения даёт одно из решений на своём периоде.";
}
]
