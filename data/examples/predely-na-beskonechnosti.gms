[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float t = 5; string info = "";
func f(x) = a + 1 / (x + 0.0001);
func g(x) = a;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "asym"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 1 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "x"; variable = t; min = 1; max = 10; step = 0.1; default = 5 }
Update {
  float v = f(t);
  P.pos.x = t; P.pos.y = v;
  info = "**Предел функции на бесконечности:** lim(x→∞) (a + 1/x) = a. Горизонтальная прямая y = a (оранжевая) — асимптота графика f(x) = a + 1/x.\n\nПри x = " + format(t, 1) + ", a = " + format(a, 1) + ": f(x) = " + format(v, 3) + ". Чем больше x, тем ближе f(x) к a.";
}
]
