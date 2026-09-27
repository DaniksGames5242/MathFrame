[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float x = 1.5; string info = "";
func f(x) = x * x;
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "аргумент x"; variable = x; min = -6; max = 6; step = 0.1; default = 1.5 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float y = x * x; R.pos.x = x; R.pos.y = y;
  info = "**Функция y = x²** каждому аргументу x ставит в соответствие ровно одно значение y.\n\nПри x = " + num(x, 2) + " значение y = " + num(y, 2) + " — единственное; на графике ему соответствует ровно одна точка (оранжевая).";
}
]
