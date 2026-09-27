[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
string fn = "sin"; string info = "";
func f(x) = sin(x);
func f2(x) = cos(x);
func f3(x) = tan(x);
draw Function { name = "gs"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3; active = fn == "sin" }
draw Function { name = "gc"; f = "f2"; xmin = -10; xmax = 10; grid = true; color = #f59e0b; thickness = 3; active = fn == "cos" }
draw Function { name = "gt"; f = "f3"; xmin = -10; xmax = 10; grid = true; color = #22c55e; thickness = 3; segments = 4000; active = fn == "tan" }
new UI { type = select; label = "функция"; variable = fn; options = ("sin", "cos", "tan"); labels = ("sin x", "cos x", "tan x"); default = "sin" }
Update {
  if (fn == "sin") { info = "**y = sin x** — определена для всех x, значения от −1 до 1, период 2π ≈ 6.28. Нечётная: sin(−x) = −sin x."; }
  if (fn == "cos") { info = "**y = cos x** — определена для всех x, значения от −1 до 1, период 2π ≈ 6.28. Чётная: cos(−x) = cos x."; }
  if (fn == "tan") { info = "**y = tan x** — период π ≈ 3.14, значения от −∞ до +∞, не определена при x = π/2 + πn (там вертикальные асимптоты). Нечётная: tan(−x) = −tan x."; }
}
]
