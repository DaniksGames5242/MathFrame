[
description = "{info}"
field width = 4; field height = 8;
camera type = fixed;
float c = 1.5; string info = "";
func f(x) = 0.5 * x * x * x;
draw Function { name = "gr"; f = "f"; xmin = -2; xmax = 2; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (1.14, 1.5); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "значение c"; variable = c; min = -4; max = 4; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float s = 1; if (c < 0) { s = -1; }
  float x0 = s * pow(abs(2 * c), 1 / 3);
  R1.pos.x = x0; R1.pos.y = c;
  info = "**Теорема Больцано — Коши**: f(x) = 0.5x³ непрерывна на [−2; 2], f(−2) = −4, f(2) = 4. Для любого c между этими значениями (сейчас c = " + num(c, 2) + ") найдётся точка x₀ ∈ [−2; 2] с f(x₀) = c: здесь x₀ = " + num(x0, 2) + " (оранжевая точка).";
}
]
