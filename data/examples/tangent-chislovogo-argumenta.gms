[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float x = 1; string info = "";
func f(t) = tan(t);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "x"; variable = x; min = -1.5; max = 1.5; step = 0.01; default = 1 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  if (abs(x - 1.5708) < 0.05) { x = 1.5; }
  info = "**Тангенс числового аргумента:** tan x = sin x / cos x, определён при cos x ≠ 0.\n\ntan(" + num(x, 2) + ") = " + num(tan(x), 3) + ". Функция нечётна, периодична с периодом π; вертикальные асимптоты — при x = π/2 + πn.";
}
]
