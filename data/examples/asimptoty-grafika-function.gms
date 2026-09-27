[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1; string info = "";
func f(x) = 1 / (x - a) + b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "V1"; pos = (0, -6); dynamic = false; collision = false }
new Point { name = "V2"; pos = (0, 6); dynamic = false; collision = false }
new Point { name = "H1"; pos = (-10, 0); dynamic = false; collision = false }
new Point { name = "H2"; pos = (10, 0); dynamic = false; collision = false }
new Line { name = "vAsym"; pos = (V1, V2); color = #22c55e }
new Line { name = "hAsym"; pos = (H1, H2); color = #22c55e }
new UI { type = slider; label = "a"; variable = a; min = -6; max = 6; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  V1.pos.x = a; V2.pos.x = a; H1.pos.y = b; H2.pos.y = b;
  info = "**Асимптоты графика** y = 1/(x − a) + b: вертикальная асимптота x = " + num(a, 1) + " (функция не определена, |y| → ∞), горизонтальная асимптота y = " + num(b, 1) + " (значение при x → ±∞). Зелёные линии отмечают асимптоты.";
}
]
