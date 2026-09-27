[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float eps = 0.3; float goodN = 0; string info = "";
draw Graph { name = "gBand"; graph = "gb"; edgeColor = #22c55e; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "gOut"; graph = "gout"; nodeRadius = 5; edgeWidth = 0; labels = false; interactive = false; color = #f59e0b }
draw Graph { name = "gIn"; graph = "gin"; nodeRadius = 5; edgeWidth = 0; labels = false; interactive = false; color = #3b82f6 }
new UI { type = slider; label = "ε (эпсилон)"; variable = eps; min = 0.05; max = 1; step = 0.01; default = 0.3 }
Update {
  gout = newGraph(); gin = newGraph(); gb = newGraph();
  addNode(gb, "b1", [-9, 4.5*eps]); addNode(gb, "b2", [9, 4.5*eps]); addEdge(gb, "b1", "b2");
  addNode(gb, "b3", [-9, -4.5*eps]); addNode(gb, "b4", [9, -4.5*eps]); addEdge(gb, "b3", "b4");
  float step = 17.6 / 60; goodN = 0;
  repeat (60) { float k = i + 1; float v = 1 / k; float x = -8.8 + step*(k - 0.5);
    if (v < eps) { addNode(gin, "p" + format(k,0), [x, 4.5*v]); } if (v >= eps) { addNode(gout, "p" + format(k,0), [x, 4.5*v]); goodN = k; }
  }
  goodN = goodN + 1;
  info = "**Определение предела по Коши:** aₙ = 1/n → 0, если для любого ε > 0 найдётся номер N такой, что при n > N выполняется |aₙ| < ε (зелёная полоса).\n\nПри ε = " + format(eps,2) + " подходит N = " + format(goodN,0) + " (синие точки — |aₙ| < ε, оранжевые — ещё нет).";
}
]
