[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float h = 1; float x = -1; string info = "";
func f(x) = 0.25 * (x - h) * (x - h) - 2;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tg"; pos = (T1, T2) }
new UI { type = slider; label = "положение вершины h"; variable = h; min = -4; max = 4; step = 0.1; default = 1 }
new UI { type = slider; label = "точка на графике x"; variable = x; min = h - 4; max = h + 4; step = 0.1; default = -1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float y = f(x);
  float k = 0.5 * (x - h);
  P.pos.x = x; P.pos.y = y;
  float norm = sqrt(1 + k * k);
  T1.pos.x = x - 3 / norm; T1.pos.y = y - 3 * k / norm;
  T2.pos.x = x + 3 / norm; T2.pos.y = y + 3 * k / norm;
  string st = "касательная не горизонтальна (наклон f′(x) = " + num(k, 2) + " ≠ 0)";
  if (abs(k) < 0.05) { st = "касательная горизонтальна (f′(x) = 0) — точка x минимума функции"; }
  info = "**Теорема Ферма**: если функция f(x) = 0,25(x − h)² − 2 дифференцируема и имеет внутренний экстремум в точке x, то f′(x) = 0.\n\nЗдесь f′(x) = 0,5(x − h). При h = " + format(h, 1) + ", x = " + format(x, 1) + ": " + st + ".";
}
]
