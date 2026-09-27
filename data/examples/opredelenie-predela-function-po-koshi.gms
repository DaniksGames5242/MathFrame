[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float eps = 1; float dx = 0.3; string info = "";
func f(x) = x*x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gBand"; graph = "gb"; edgeColor = #22c55e; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "PX"; pos = (0,0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "точка a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "ε"; variable = eps; min = 0.2; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "x − a (доля δ)"; variable = dx; min = -1; max = 1; step = 0.02; default = 0.3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float La = a*a;
  float delta = min(1, 0.9*eps/(1 + 2*abs(a)));
  gb = newGraph();
  addNode(gb, "h1", [-10, La - eps]); addNode(gb, "h2", [10, La - eps]); addEdge(gb, "h1", "h2");
  addNode(gb, "h3", [-10, La + eps]); addNode(gb, "h4", [10, La + eps]); addEdge(gb, "h3", "h4");
  addNode(gb, "v1", [a - delta, -6]); addNode(gb, "v2", [a - delta, 6]); addEdge(gb, "v1", "v2");
  addNode(gb, "v3", [a + delta, -6]); addNode(gb, "v4", [a + delta, 6]); addEdge(gb, "v3", "v4");
  float x = a + dx*delta; float fx = x*x; PX.pos.x = x; PX.pos.y = fx;
  info = "**Определение по Коши:** предел f(x) = x² при x → a = " + num(a,1) + " равен L = " + format(La,2) + ", так как для ε = " + format(eps,1) + " нашлось δ = " + format(delta,3) + ": из |x − a| < δ следует |f(x) − L| < ε (полосы на графике).\n\nТочка x = " + num(x,2) + " лежит внутри δ-полосы, и f(x) = " + format(fx,3) + " лежит внутри ε-полосы.";
}
]
