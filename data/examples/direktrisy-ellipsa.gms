[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3.5; float e = 0.6; float b = 2.8; float c = 2.1; float dd = 5.8; string info = "";
new Curve { name = "el"; type = parametric; x = "a * cos(t * 6.2832)"; y = "b * sin(t * 6.2832)"; color = #3b82f6; thickness = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "P"; curve = "el"; t = 0.12; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (P, F); color = #22c55e }
new Line { name = "mh"; pos = (P, H); color = #22c55e }
new UI { type = slider; label = "большая полуось a"; variable = a; min = 1.5; max = 3.5; step = 0.1; default = 3.5 }
new UI { type = slider; label = "эксцентриситет ε"; variable = e; min = 0.45; max = 0.9; step = 0.05; default = 0.6 }
Update {
  c = a * e; b = sqrt(a * a - c * c); dd = a / e;
  gd = newGraph();
  addNode(gd, "l1", [-dd, -6]); addNode(gd, "l2", [-dd, 6]); addEdge(gd, "l1", "l2");
  addNode(gd, "r1", [dd, -6]); addNode(gd, "r2", [dd, 6]); addEdge(gd, "r1", "r2");
  float s = 1; if (P.pos.x < 0) { s = -1; }
  F.pos.x = s * c; F.pos.y = 0; H.pos.x = s * dd; H.pos.y = P.pos.y;
  float df = sqrt((P.pos.x - F.pos.x) * (P.pos.x - F.pos.x) + P.pos.y * P.pos.y);
  float dh = abs(s * dd - P.pos.x);
  info = "**Директрисы эллипса** — две прямые x = ±a/ε (оранжевые), перпендикулярные большой оси и лежащие вне эллипса; при a = " + format(a, 1) + " и ε = " + format(e, 2) + " они удалены от центра на a/ε = " + format(dd, 2) + " > a. Каждая соответствует фокусу с той же стороны от центра (c = aε = " + format(c, 2) + ").\n\nДля любой точки M эллипса отношение расстояния до фокуса F к расстоянию до директрисы (H — основание перпендикуляра) равно эксцентриситету: MF / MH = " + format(df, 2) + " / " + format(dh, 2) + " = " + format(df / dh, 3) + " = ε. При ε → 0 директрисы уходят в бесконечность.";
}
]
