[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float k = 3; float n = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "коэффициент k"; variable = k; min = -5; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "степень n"; variable = n; min = 0; max = 4; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function sup(v) { if (v == 0) { return ""; } if (v == 1) { return "x"; } if (v == 2) { return "x²"; } if (v == 3) { return "x³"; } return "x⁴"; }
Update {
  float x = 2; float v = k * pow(x, n);
  float h = v / 80 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "p0", [0, 0]); addNode(g, "p1", [0, h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "**Одночлен** k·xⁿ при k = " + num(k,0) + ", n = " + format(n,0) + " — это " + num(k,0) + sup(n) + ". При x = 2 его значение равно " + num(v,0) + ".";
}
]
