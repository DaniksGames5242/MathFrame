[
description = "{info}"
field width = 10; field height = 10;
camera type = fixed;
float a = 2; string info = ""; float key = -1;
draw Graph { name = "gsq"; graph = "g"; nodeRadius = 0; edgeWidth = 4; edgeColor = #3b82f6; labels = false; interactive = false }
new UI { type = slider; label = "сторона квадрата a (м)"; variable = a; min = 0.5; max = 4; step = 0.1; default = 2 }
Update {
  if (abs(key - a) > 0.0001) {
    g = newGraph(); float h = a;
    addNode(g, "A", [-h, -h]); addNode(g, "B", [h, -h]); addNode(g, "C", [h, h]); addNode(g, "D", [-h, h]);
    addEdge(g, "A", "B"); addEdge(g, "B", "C"); addEdge(g, "C", "D"); addEdge(g, "D", "A");
    key = a;
  }
  float sm = a * a; float scm = sm * 10000;
  info = "**Площадь квадрата** со стороной a = " + format(a, 1) + " м равна S = a² = " + format(sm, 2) + " м².\n\nВ квадратных сантиметрах (1 м² = 10000 см²): S = " + format(scm, 0) + " см².";
}
]
