[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float n = 30; string info = "";
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 4; edgeWidth = 0; labels = false; interactive = false; color = #3b82f6 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 4; edgeWidth = 0; labels = false; interactive = false; color = #f59e0b }
draw Graph { name = "gS"; graph = "gs"; nodeRadius = 4; edgeWidth = 0; labels = false; interactive = false; color = #22c55e }
new UI { type = slider; label = "число членов n"; variable = n; min = 3; max = 40; step = 1; default = 30 }
Update {
  ga = newGraph(); gb = newGraph(); gs = newGraph(); gx = newGraph();
  addNode(gx, "z1", [-9, 0]); addNode(gx, "z2", [9, 0]); addEdge(gx, "z1", "z2");
  float step = 17.6 / n;
  repeat (n) { float k = i + 1; float av = 2 + 1 / k; float bv = 1 - 2 / k; float sv = av + bv; float x = -8.8 + step*(k - 0.5);
    addNode(ga, "a" + format(k,0), [x, av]); addNode(gb, "b" + format(k,0), [x, bv]); addNode(gs, "s" + format(k,0), [x, sv]);
  }
  float an = 2 + 1 / n; float bn = 1 - 2 / n;
  info = "**Свойство предела суммы:** lim(aₙ + bₙ) = lim aₙ + lim bₙ. Синие точки — aₙ = 2 + 1/n → 2, оранжевые — bₙ = 1 − 2/n → 1, зелёные — сумма aₙ + bₙ → 3.\n\nПри n = " + format(n,0) + ": aₙ = " + format(an,3) + ", bₙ = " + format(bn,3) + ", сумма = " + format(an + bn,3) + ".";
}
]
