[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float a = 2; float m = 1; float b = 3; float n = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "степень m"; variable = m; min = 0; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 1; default = 3 }
new UI { type = slider; label = "степень n"; variable = n; min = 0; max = 3; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function sup(v) { if (v == 0) { return ""; } if (v == 1) { return "x"; } if (v == 2) { return "x²"; } if (v == 3) { return "x³"; } if (v == 4) { return "x⁴"; } if (v == 5) { return "x⁵"; } return "x⁶"; }
Update {
  float x = 2; float k = a * b; float e = m + n; float v = k * pow(x, e);
  float h = v / 1024 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "p0", [0, 0]); addNode(g, "p1", [0, h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "(" + num(a,0) + sup(m) + ")·(" + num(b,0) + sup(n) + ") = " + num(k,0) + sup(e) + ": коэффициенты умножаются, показатели степеней складываются (" + format(m,0) + " + " + format(n,0) + " = " + format(e,0) + "). При x = 2 произведение равно " + num(v,0) + ".";
}
]
