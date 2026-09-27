[
description = "{info}"
field width = 10; field height = 6;
camera type = fixed;
float a = -3; float b = 2; string info = ""; float key = -999; float S = 0;
func f(x) = 1 + 0.4 * sin(x);
draw Function { name = "gf"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 4; labels = false; interactive = false; showWeights = false }
new UI { type = slider; label = "нижний предел a"; variable = a; min = -5; max = 4; step = 0.1; default = -3 }
new UI { type = slider; label = "верхний предел b"; variable = b; min = a + 0.3; max = 5; step = 0.1; default = 2 }
Update {
  if (key != a * 1000 + b) {
    g = newGraph(); S = 0; float h = (b - a) / 40;
    repeat (40) {
      float xm = a + (i + 0.5) * h; float v = f(xm); S = S + v * h;
      addNode(g, "p" + format(i, 0), [xm, 0]); addNode(g, "q" + format(i, 0), [xm, v]); addEdge(g, "p" + format(i, 0), "q" + format(i, 0), 1, "#f59e0b");
    }
    key = a * 1000 + b;
  }
  info = "**Геометрический смысл определённого интеграла:** ∫ₐᵇ f(x)dx при f(x) > 0 равен площади фигуры под графиком между x = a и x = b.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + " площадь (сумма площадей закрашенных полос) ≈ " + format(S, 2) + ".";
}
]
