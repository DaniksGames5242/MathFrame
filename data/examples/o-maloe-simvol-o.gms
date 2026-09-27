[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float t = 1; string info = "";
func f(x) = x * x;
func g(x) = x;
draw Function { name = "gf"; f = "f"; xmin = -6; xmax = 6; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gg"; f = "g"; xmin = -6; xmax = 6; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "x"; variable = t; min = 0.05; max = 3; step = 0.02; default = 1 }
Update {
  float r = f(t) / g(t);
  info = "**о-малое:** f(x) = x² есть o(x) при x → 0, так как отношение f(x)/x = x → 0. Синий — f(x) = x², оранжевый — g(x) = x.\n\nПри x = " + format(t, 2) + ": f(x)/g(x) = " + format(r, 3) + " — стремится к 0 при x → 0.";
}
]
