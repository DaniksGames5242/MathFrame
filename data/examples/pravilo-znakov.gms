[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = -3; float b = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = -9; max = 9; step = 1; default = -3 }
new UI { type = slider; label = "b"; variable = b; min = -9; max = 9; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function bar(k, x, v, m, c) { float h = abs(v) * 5 / m; if (h < 0.1) { h = 0.1; } addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + h]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  if (abs(a) < 0.5) { a = 1; } if (abs(b) < 0.5) { b = 1; }
  float p = a * b;
  string sc = "#3b82f6"; if (p > 0) { sc = "#22c55e"; }
  g = newGraph(); bar("a", -3, a, 9, "#3b82f6"); bar("b", 0, b, 9, "#f59e0b"); bar("p", 3, p, 81, sc);
  string s = "положительно"; if (p < 0) { s = "отрицательно"; }
  info = "**a × b = " + num(a, 0) + " × " + num(b, 0) + " = " + num(p, 0) + "**: знаки a и b " + "определяют знак произведения — результат " + s + ".";
}
]
