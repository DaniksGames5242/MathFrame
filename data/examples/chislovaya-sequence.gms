[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float N = 12; float key = -1; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; edgeWidth = 0 }
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new UI { type = slider; label = "число членов n"; variable = N; min = 3; max = 30; step = 1; default = 12 }
Update {
  if (key != N) {
    gx = newGraph(); addNode(gx, "a1", [-7.5, -4]); addNode(gx, "a2", [7.5, -4]); addEdge(gx, "a1", "a2");
    g = newGraph();
    repeat (N) { float n = i + 1; float v = 1 / n; addNode(g, "p" + format(n, 0), [-7.5 + 15 * (n - 1) / (N - 1), -4 + 7.5 * v]); }
    key = N;
  }
  float last = 1 / N;
  info = "**Числовая последовательность aₙ = 1/n:** каждому натуральному номеру n сопоставлено число aₙ. Точки на графике — члены a₁, a₂, … , a" + format(N, 0) + ".\n\naₙ убывает и приближается к нулю: при n = " + format(N, 0) + " член равен " + format(last, 3) + ".";
}
]
