[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float m = 2; float n = 3; string info = ""; float VMAX = 300;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = false; interactive = false }
new UI { type = slider; label = "основание a"; variable = a; min = 1.2; max = 2; step = 0.1; default = 2 }
new UI { type = slider; label = "показатель m"; variable = m; min = 1; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "показатель n"; variable = n; min = 1; max = 4; step = 1; default = 3 }
Update {
  float lhs = pow(a, m) * pow(a, n); float rhs = pow(a, m + n);
  g = newGraph();
  addNode(g, "a0", [-2, -3]); addNode(g, "a1", [-2, -3 + 6 * lhs / VMAX]); addEdge(g, "a0", "a1", 1, "#3b82f6");
  addNode(g, "b0", [2, -3]); addNode(g, "b1", [2, -3 + 6 * rhs / VMAX]); addEdge(g, "b0", "b1", 1, "#f59e0b");
  info = "**Произведение степеней с одинаковым основанием:** a в степени m, умноженное на a в степени n, равно a в степени (m + n).\n\nПри a = " + format(a, 1) + ", m = " + format(m, 0) + ", n = " + format(n, 0) + ": левая часть (синий столбик) = " + format(lhs, 2) + ", правая часть a в степени " + format(m + n, 0) + " (оранжевый) = " + format(rhs, 2) + " — равны.";
}
]
