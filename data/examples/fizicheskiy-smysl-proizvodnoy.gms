[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t0 = 2; float h = 1; string info = "";
func s(x) = x * x;
draw Function { name = "gr"; f = "s"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (2, 4); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Q"; pos = (3, 9); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "sec"; pos = (P, Q); color = #f59e0b }
new UI { type = slider; label = "момент t₀"; variable = t0; min = -4; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "интервал h"; variable = h; min = 0.05; max = 3; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = t0; P.pos.y = t0 * t0;
  Q.pos.x = t0 + h; Q.pos.y = (t0 + h) * (t0 + h);
  float vavg = (Q.pos.y - P.pos.y) / h;
  info = "Путь s(t) = t². Средняя скорость на отрезке [t₀; t₀ + h] равна (s(t₀ + h) − s(t₀))/h = " + num(vavg, 2) + " — это наклон секущей (оранжевая прямая).\n\nПри h → 0 секущая переходит в касательную, а средняя скорость — в мгновенную скорость v(t₀) = s'(t₀) = 2t₀ = " + num(2 * t0, 2) + ": производная пути по времени и есть физическая скорость.";
}
]
