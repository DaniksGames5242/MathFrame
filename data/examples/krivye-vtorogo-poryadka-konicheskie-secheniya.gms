[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float e = 0.6; float p = 2; float ox = -1; float k = 0.12; float t0 = 0; float t1 = 6.2832; float u1 = 0; float dd = 3; string info = ""; string kind = "";
new Curve { name = "c1"; type = parametric; x = "ox + p * cos(t0 + (t1 - t0) * t) / (1 - e * cos(t0 + (t1 - t0) * t))"; y = "p * sin(t0 + (t1 - t0) * t) / (1 - e * cos(t0 + (t1 - t0) * t))"; color = #3b82f6; thickness = 3 }
new Curve { name = "c2"; type = parametric; active = e > 1.15; x = "ox + p * cos(-u1 + 2 * u1 * t) / (1 - e * cos(-u1 + 2 * u1 * t))"; y = "p * sin(-u1 + 2 * u1 * t) / (1 - e * cos(-u1 + 2 * u1 * t))"; color = #3b82f6; thickness = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "P"; curve = "c1"; t = 0.3; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (P, F); color = #22c55e }
new Line { name = "mh"; pos = (P, H); color = #22c55e }
new UI { type = slider; label = "эксцентриситет ε"; variable = e; min = 0.1; max = 2.5; step = 0.05; default = 0.6 }
new UI { type = slider; label = "параметр p"; variable = p; min = 1; max = 2.5; step = 0.1; default = 2 }
Update {
  t0 = 0; if (e >= 1) { t0 = acos(min(1, (1 - k) / e)); }
  t1 = 6.2832 - t0;
  u1 = 0; if (e > 1.15) { u1 = acos(min(1, (1 + k) / e)); }
  dd = p / e;
  F.pos.x = ox; F.pos.y = 0; H.pos.x = ox - dd; H.pos.y = P.pos.y;
  gd = newGraph();
  addNode(gd, "l1", [ox - dd, -6]); addNode(gd, "l2", [ox - dd, 6]); addEdge(gd, "l1", "l2");
  float df = sqrt((P.pos.x - ox) * (P.pos.x - ox) + P.pos.y * P.pos.y);
  float dh = abs(P.pos.x - ox + dd);
  kind = "эллипс"; if (e > 1.001) { kind = "гипербола"; }
  if (abs(e - 1) < 0.001) { kind = "парабола"; }
  info = "**Кривая второго порядка** с фокусом F и директрисой (оранжевая прямая): множество точек M, для которых MF / MH = ε (H — основание перпендикуляра на директрису). В полярных координатах с полюсом F это r = p / (1 − ε cos θ); здесь ε = " + format(e, 2) + ", p = " + format(p, 1) + ".\n\nТип кривой задаёт эксцентриситет: ε < 1 — эллипс, ε = 1 — парабола, ε > 1 — гипербола (две ветви). Сейчас — **" + kind + "**: MF / MH = " + format(df, 2) + " / " + format(dh, 2) + " = " + format(df / dh, 3) + ".";
}
]
