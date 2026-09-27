[
description = "{info}"
field width = 10; field height = 12;
camera type = fixed;
float eps = 1; string info = "";
func f(x) = x * x;
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gd"; graph = "gd"; nodeRadius = 0; edgeWidth = 6; interactive = false; labels = false }
new UI { type = slider; label = "точность ε"; variable = eps; min = 0.2; max = 3; step = 0.1; default = 1 }
Update {
  float delta = eps / 10;
  gd = newGraph();
  addNode(gd, "a1", [-3 - delta, -5.5]); addNode(gd, "a2", [-3 + delta, -5.5]); addEdge(gd, "a1", "a2", 1, "#f59e0b");
  addNode(gd, "b1", [1 - delta, -5.5]); addNode(gd, "b2", [1 + delta, -5.5]); addEdge(gd, "b1", "b2", 1, "#22c55e");
  info = "**Равномерная непрерывность**: f(x) = x² на [−5; 5] равномерно непрерывна — для ε = " + format(eps, 2) + " существует **одно и то же** δ = ε/10 = " + format(delta, 3) + ", годящееся для любой точки: отрезки такой ширины отмечены под точками x = −3 и x = 1.";
}
]
