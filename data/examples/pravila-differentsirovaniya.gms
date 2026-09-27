[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 1; float x0 = 1; string info = "";
func f(x) = a * (x * x) + b * sin(x);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -4; max = 4; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float deriv = a * 2 * x0 + b * cos(x0);
  info = "**Правило линейности:** для h(x) = a·f(x) + b·g(x) производная h'(x) = a·f'(x) + b·g'(x) — производную можно брать почленно, вынося постоянные множители.\n\nЗдесь h(x) = a·x² + b·sin x, a = " + format(a, 1) + ", b = " + format(b, 1) + ": h'(x₀) = a·2x₀ + b·cos x₀ = " + num(deriv, 2) + " при x₀ = " + num(x0, 1) + ".";
}
]
