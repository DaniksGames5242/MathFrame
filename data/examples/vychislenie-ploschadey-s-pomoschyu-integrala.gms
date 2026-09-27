[
description = "{info}"
field width = 8; field height = 10;
camera type = fixed;
float k = 1; string info = ""; float key = -999; float S = 0;
func f(x) = 4 - x * x;
func g(x) = k;
draw Function { name = "gf"; f = "f"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gg"; f = "g"; xmin = -4; xmax = 4; color = #f59e0b; thickness = 2 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 4; labels = false; interactive = false; showWeights = false }
new UI { type = slider; label = "k"; variable = k; min = -3; max = 3.8; step = 0.1; default = 1 }
Update {
  if (key != k) {
    float r = sqrt(4 - k); g2 = newGraph(); S = 0; float h = 2 * r / 40;
    repeat (40) {
      float xm = -r + (i + 0.5) * h; float v = f(xm) - k; S = S + v * h;
      addNode(g2, "p" + format(i, 0), [xm, k]); addNode(g2, "q" + format(i, 0), [xm, k + v]); addEdge(g2, "p" + format(i, 0), "q" + format(i, 0), 1, "#22c55e");
    }
    key = k;
  }
  info = "**Площадь фигуры между графиками через интеграл:** S = ∫₋ᵣʳ (f(x) − g(x))dx, где f(x) = 4 − x², g(x) = k, r = √(4 − k) — точка пересечения графиков.\n\nПри k = " + format(k, 1) + ": r ≈ " + format(sqrt(4 - k), 2) + ", площадь S ≈ " + format(S, 2) + ".";
}
]
