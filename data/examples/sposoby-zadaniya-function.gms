[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float n = 2; string info = "";
func f(x) = x * x;
draw Function { name = "gf"; f = "f"; xmin = -7; xmax = 7; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R"; pos = (2, 4); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "n (таблица: n → n²)"; variable = n; min = -3; max = 3; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  R.pos.x = n; R.pos.y = n * n;
  info = "**Формула** y = x² и **таблица** n → n² задают одну и ту же функцию: при n = " + format(n, 0) + " оба способа дают y = " + num(n * n, 0) + " (отмечено точкой на графике).";
}
]
