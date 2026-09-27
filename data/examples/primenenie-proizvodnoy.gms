[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t = 2; string info = "";
func s(x) = -x * x + 6 * x;
func tg(x) = s(t) + (6 - 2 * t) * (x - t);
draw Function { name = "gs"; f = "s"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gt"; f = "tg"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "время t"; variable = t; min = 0; max = 6; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float v = 6 - 2 * t;
  string m = "тело поднимается"; if (v < 0) { m = "тело опускается"; } if (abs(v) < 0.05) { m = "тело в верхней точке, скорость равна нулю"; }
  info = "**Применение производной**: путь s(t) = −t² + 6t, скорость v(t) = s′(t) = 6 − 2t. При t = " + num(t, 1) + " скорость v = " + num(v, 2) + " — " + m + ". Наклон касательной (оранжевая) к графику пути равен скорости.";
}
]
