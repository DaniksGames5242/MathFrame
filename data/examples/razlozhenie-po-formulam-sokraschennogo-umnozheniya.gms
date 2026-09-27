[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float b = 2; string info = "";
func f(x) = a * a - x * x;
func h(x) = (a - x) * (a + x);
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 4 }
draw Function { name = "gh"; f = "h"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 9; step = 0.5; default = 3 }
new UI { type = slider; label = "x (переменная b)"; variable = b; min = -9; max = 9; step = 0.5; default = 2 }
Update {
  float lhs = a * a - b * b; float rhs = (a - b) * (a + b);
  info = "**Разность квадратов:** a² − x² = (a − x)(a + x).\n\nПри a = " + format(a, 1) + ", x = " + format(b, 1) + ": a² − x² = " + format(lhs, 2) + " и (a − x)(a + x) = " + format(rhs, 2) + " совпадают — синяя и зелёная кривые сливаются в одну линию при любых a.";
}
]
