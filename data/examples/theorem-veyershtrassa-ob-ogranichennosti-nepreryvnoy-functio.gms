[
description = "{info}"
field width = 10; field height = 12;
camera type = fixed;
float p = 1; string info = "";
func f(x) = -0.1 * (x - p) * (x - p) + 5;
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (1, 5); dynamic = false; collision = false; color = #22c55e; active = true }
new Point { name = "R2"; pos = (-5, 3.4); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "вершина p"; variable = p; min = -5; max = 5; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  R1.pos.x = p; R1.pos.y = 5;
  float xm = -5; if (abs(5 - p) > abs(-5 - p)) { xm = 5; }
  float ym = -0.1 * (xm - p) * (xm - p) + 5;
  R2.pos.x = xm; R2.pos.y = ym;
  info = "**Теорема Вейерштрасса**: f непрерывна на замкнутом промежутке [−5; 5], поэтому достигает на нём и наибольшего, и наименьшего значения. Наибольшее f(" + num(p, 1) + ") = 5 — в вершине (зелёная точка), наименьшее f(" + num(xm, 1) + ") = " + num(ym, 2) + " — на конце промежутка (оранжевая точка).";
}
]
