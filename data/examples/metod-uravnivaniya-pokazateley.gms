[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float k = 3; float x0 = 0; string info = "";
func f(x) = pow(a, x + 1);
func g(x) = pow(a, k - x);
draw Function { name = "g1"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "основание a"; variable = a; min = 0.2; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "k"; variable = k; min = -4; max = 8; step = 0.1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(a - 1) < 0.05) { a = 1.1; }
  x0 = (k - 1) / 2;
  R1.pos.x = x0; R1.pos.y = pow(a, x0 + 1);
  info = "**Метод уравнивания показателей**: уравнение с одинаковым основанием a = " + format(a, 1) + " (a > 0, a ≠ 1) — a в степени (x + 1) слева (синий график) равно a в степени (" + num(k, 1) + " − x) справа (оранжевый) — равносильно равенству показателей x + 1 = " + num(k, 1) + " − x, откуда x = " + num(x0, 2) + " — абсцисса точки пересечения графиков.";
}
]
