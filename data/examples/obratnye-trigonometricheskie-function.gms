[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float c = 0; float idx = 0; string info = "";
Function f(x) { if (idx < 0.5) { return asin(x / a) + c; } if (idx < 1.5) { return acos(x / a) + c; } if (idx < 2.5) { return atan(x / a) + c; } return pi / 2 - atan(x / a) + c; }
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "функция: 0-arcsin 1-arccos 2-arctg 3-arcctg"; variable = idx; min = 0; max = 3; step = 1; default = 0 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "c"; variable = c; min = -2; max = 2; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  string name = "arcsin"; string dom = "[−1; 1]"; string ran = "[−π/2; π/2]";
  if (idx >= 0.5 && idx < 1.5) { name = "arccos"; ran = "[0; π]"; }
  if (idx >= 1.5 && idx < 2.5) { name = "arctg"; dom = "ℝ"; ran = "(−π/2; π/2)"; }
  if (idx >= 2.5) { name = "arcctg"; dom = "ℝ"; ran = "(0; π)"; }
  info = "**y = " + name + "(x/" + format(a, 1) + ")" + term(c, 1) + "** — область определения: " + dom + ", область значений (без сдвига c): " + ran + ".";
}
]
