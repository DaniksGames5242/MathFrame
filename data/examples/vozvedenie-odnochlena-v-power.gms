[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float a = 2; float m = 1; float p = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = -3; max = 3; step = 1; default = 2 }
new UI { type = slider; label = "степень x: m"; variable = m; min = 0; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "степень возведения p"; variable = p; min = 1; max = 3; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  if (abs(a) < 0.5) { a = 1; }
  float x = 2; float k = pow(a, p); float e = m * p; float v = k * pow(x, e);
  float h = v / 13824 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "p0", [0, 0]); addNode(g, "p1", [0, h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "(" + num(a,0) + "·x в степени " + format(m,0) + ") в степени " + format(p,0) + " = " + num(k,0) + "·x в степени " + format(e,0) + ": коэффициент возводится в степень " + format(p,0) + ", получая " + num(k,0) + "; показатель степени переменной умножается на " + format(p,0) + " (" + format(m,0) + " × " + format(p,0) + " = " + format(e,0) + "). При x = 2 значение равно " + num(v,0) + ".";
}
]
