[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float t = 2; string info = "";
func f(x) = sin(x + 0.0001) / (x + 0.0001);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x"; variable = t; min = -8; max = 8; step = 0.05; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(t) < 0.02) { t = 0.02; }
  float v = sin(t) / t;
  P.pos.x = t; P.pos.y = v;
  info = "**Первый замечательный предел:** lim(x→0) sin x / x = 1.\n\nПри x = " + num(t, 2) + ": sin x / x = " + format(v, 4) + ". Чем ближе x к 0, тем ближе значение к 1.";
}
]
