[
description = "{info}"
field width = 4.4; field height = 12;
camera type = fixed;
float b = 1.5; string info = "";
func f(x) = x * x;
draw Function { name = "gf"; f = "f"; xmin = 0; xmax = 2.2; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 6; labels = false; interactive = false; showWeights = false }
new UI { type = slider; label = "b"; variable = b; min = 0.4; max = 2.2; step = 0.1; default = 1.5 }
Update {
  g = newGraph(); float h = b / 20; float S = 0;
  repeat (20) {
    float xm = (i + 0.5) * h; float v = f(xm); S = S + v * h;
    addNode(g, "a" + format(i, 0), [xm, 0]); addNode(g, "b" + format(i, 0), [xm, v]); addEdge(g, "a" + format(i, 0), "b" + format(i, 0), 1, "#f59e0b");
  }
  float Fb = b * b * b / 3;
  info = "**Формула Ньютона — Лейбница:** ∫₀ᵇ x²dx = F(b) − F(0), где F(x) = x³/3 — первообразная f(x) = x².\n\nПри b = " + format(b, 2) + ": сумма площадей узких прямоугольников (метод средних точек) ≈ " + format(S, 3) + ", а по формуле F(b) − F(0) = " + format(Fb, 3) + " — значения совпадают.";
}
]
