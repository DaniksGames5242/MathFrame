[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float m = 1; float n = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "основание a"; variable = a; min = 0.5; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "числитель m"; variable = m; min = -3; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "знаменатель n"; variable = n; min = 1; max = 5; step = 1; default = 2 }
Update {
  if (abs(m) < 0.5) { m = 1; }
  float val = pow(a, m / n); float bv = val; if (bv > 8) { bv = 8; }
  g = newGraph(); addNode(g, "p0", [0, -3]); addNode(g, "p1", [0, -3 + 6 * bv / 8]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "**Степень с рациональным показателем:** a в степени (m/n) равна корню n-й степени из a в степени m, при a > 0.\n\nПри a = " + format(a, 1) + ", m = " + format(m, 0) + ", n = " + format(n, 0) + ": a в степени (" + format(m, 0) + "/" + format(n, 0) + ") = корень " + format(n, 0) + "-й степени из a в степени " + format(m, 0) + " = " + format(val, 4) + ".";
}
]
