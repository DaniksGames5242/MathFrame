[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
string fn = "pow"; float x0 = 1; string info = "";
Function f(x) { if (fn == "sin") { return sin(x); } if (fn == "cos") { return cos(x); } if (fn == "exp") { return exp(x); } return x * x; }
Function fd(x) { if (fn == "sin") { return cos(x); } if (fn == "cos") { return -sin(x); } if (fn == "exp") { return exp(x); } return 2 * x; }
draw Function { name = "gf"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 2 }
draw Function { name = "gd"; f = "fd"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 3 }
new UI { type = select; label = "функция"; variable = fn; options = ("pow", "sin", "cos", "exp"); labels = ("x²", "sin x", "cos x", "eˣ"); default = "pow" }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -3; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string fname = "(x²)' = 2x"; if (fn == "sin") { fname = "(sin x)' = cos x"; } if (fn == "cos") { fname = "(cos x)' = −sin x"; } if (fn == "exp") { fname = "(eˣ)' = eˣ"; }
  info = "Синий — f(x), оранжевый — её производная f'(x) из таблицы производных: **" + fname + "**.\n\nПри x₀ = " + num(x0, 1) + " f'(x₀) = " + num(fd(x0), 2) + ".";
}
]
