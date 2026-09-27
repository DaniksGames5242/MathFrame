[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float m1 = 1; float m2 = 1; float n = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "основание a"; variable = a; min = 0.5; max = 4; step = 0.1; default = 4 }
new UI { type = slider; label = "числитель m1 (у p)"; variable = m1; min = -3; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "числитель m2 (у q)"; variable = m2; min = -3; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "знаменатель n"; variable = n; min = 1; max = 4; step = 1; default = 2 }
Update {
  float p = m1 / n; float q = m2 / n;
  float lhs = pow(a, p) * pow(a, q); float rhs = pow(a, p + q);
  float lb = lhs; if (lb > 8) { lb = 8; } float rb = rhs; if (rb > 8) { rb = 8; }
  g = newGraph(); addNode(g, "a0", [-2, -3]); addNode(g, "a1", [-2, -3 + 6 * lb / 8]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2, -3]); addNode(g, "b1", [2, -3 + 6 * rb / 8]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Свойство степени с рациональным показателем:** a в степени p, умноженное на a в степени q, равно a в степени (p + q), при a > 0.\n\nПри a = " + format(a, 1) + ", p = " + format(m1, 0) + "/" + format(n, 0) + ", q = " + format(m2, 0) + "/" + format(n, 0) + ": левая часть = " + format(lhs, 3) + " (синий), правая часть = " + format(rhs, 3) + " (оранжевый) — совпадают.";
}
]
