[
description = "{info}"
field width = 4; field height = 6;
camera type = fixed;
float n = 8; string info = ""; float key = -1; float S = 0;
func f(x) = 0.3 * x * x + 1;
draw Function { name = "gf"; f = "f"; xmin = -2; xmax = 2; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 6; labels = false; interactive = false; showWeights = false }
new UI { type = slider; label = "число прямоугольников n"; variable = n; min = 2; max = 30; step = 1; default = 8 }
Update {
  if (key != n) {
    g = newGraph(); S = 0; float h = 4 / n;
    repeat (n) {
      float xm = -2 + (i + 0.5) * h; float v = f(xm);
      S = S + v * h;
      addNode(g, "a" + format(i, 0), [xm, 0]); addNode(g, "b" + format(i, 0), [xm, v]); addEdge(g, "a" + format(i, 0), "b" + format(i, 0), 1, "#f59e0b");
    }
    key = n;
  }
  info = "**Определённый интеграл** ∫₋₂² f(x)dx для f(x) = 0,3x² + 1 — предел суммы площадей прямоугольников (метод средних точек) при n → ∞.\n\nПри n = " + format(n, 0) + " сумма ≈ " + format(S, 3) + "; точное значение интеграла — 5,6.";
}
]
