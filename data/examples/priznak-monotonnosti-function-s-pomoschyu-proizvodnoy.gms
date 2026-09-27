[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 2; string info = "";
func f(x) = x * x * x - 3 * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "x₀"; variable = x0; min = -3; max = 3; step = 0.05; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P.pos.x = x0; P.pos.y = f(x0);
  float d1 = 3 * x0 * x0 - 3;
  string m = "возрастает (f′ > 0)"; if (d1 < 0) { m = "убывает (f′ < 0)"; } if (abs(d1) < 0.05) { m = "критическая точка (f′ = 0)"; }
  info = "**Признак монотонности**: для y = x³ − 3x производная f′(x) = 3x² − 3. В точке x₀ = " + num(x0, 2) + " f′ = " + num(d1, 2) + " — функция здесь " + m + ".\n\nФункция возрастает при x < −1 и x > 1, убывает при −1 < x < 1.";
}
]
