[
description = "{info}"
field width = 20; field height = 16;
camera type = fixed;
float t = 3; string info = "";
func f(x) = x + 3;
func g(x) = x;
draw Function { name = "gf"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #f59e0b; thickness = 2 }
draw Function { name = "gg"; f = "g"; xmin = 0.001; xmax = 10; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "x"; variable = t; min = 0.5; max = 10; step = 0.1; default = 3 }
Update {
  float r = f(t) / g(t);
  info = "**О-большое:** f(x) = x + 3 есть O(x) при x → ∞: отношение f(x)/x остаётся ограниченным — не превышает некоторой константы C. Оранжевый — f(x), синий — g(x) = x.\n\nПри x = " + format(t, 1) + ": f(x)/g(x) = " + format(r, 3) + ".";
}
]
