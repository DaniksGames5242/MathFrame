[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 4; float q = 0.5; string info = "";
draw Graph { name = "gb"; graph = "grph"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
draw Text { name = "l1"; pos = (0, -3.7); text = "члены прогрессии a, aq, aq², …"; size = 0.85 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "q"; variable = q; min = -0.9; max = 0.9; step = 0.01; default = 0.5 }
Update {
  grph = newGraph(); float s = 0; float x = -5;
  repeat (10) {
    float v = a * pow(q, i); s = s + v;
    addNode(grph, "p" + format(i, 0) + "0", [x, -3]); addNode(grph, "p" + format(i, 0) + "1", [x, -3 + 5 * v / a]); addEdge(grph, "p" + format(i, 0) + "0", "p" + format(i, 0) + "1", 1, "#3b82f6");
    x = x + 1.1;
  }
  float S = a / (1 - q);
  info = "**Сумма бесконечно убывающей геометрической прогрессии:** S = a/(1 − q) при |q| < 1.\n\nПри a = " + format(a, 1) + ", q = " + format(q, 2) + ": члены убывают по высоте, а сумма всех бесконечно многих членов равна S = " + format(S, 2) + " (сумма первых 10 членов ≈ " + format(s, 2) + ").";
}
]
