[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float d = 1.5; float a = -5; float b = -1; string info = "";
Function f(x) { if (x < 0) { return x * x; } return x * x + d; }
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 2 }
draw Graph { name = "gseg"; graph = "gseg"; nodeRadius = 0; edgeWidth = 5; interactive = false; labels = false }
new UI { type = slider; label = "левый конец a"; variable = a; min = -8; max = 7.5; step = 0.1; default = -5 }
new UI { type = slider; label = "правый конец b"; variable = b; min = -7.5; max = 8; step = 0.1; default = -1 }
Update {
  if (b <= a) { b = a + 0.5; }
  gseg = newGraph();
  float n = 39;
  repeat (40) { float x1 = a + (b - a) * i / n; addNode(gseg, "p" + format(i, 0), [x1, f(x1)]); if (i > 0) { addEdge(gseg, "p" + format(i - 1, 0), "p" + format(i, 0), 1, "#f59e0b"); } }
  string ai = format(a, 1); string bi = format(b, 1);
  if (a < 0) { ai = "−" + format(-a, 1); } if (b < 0) { bi = "−" + format(-b, 1); }
  if (a <= 0 && b >= 0) { info = "**Непрерывность на промежутке**: на [" + ai + "; " + bi + "] функция f **не непрерывна на всём промежутке**, так как он содержит точку разрыва x = 0."; }
  if (!(a <= 0 && b >= 0)) { info = "**Непрерывность на промежутке**: f непрерывна в каждой точке [" + ai + "; " + bi + "] (выделено оранжевым), поэтому она непрерывна на всём этом промежутке."; }
}
]
