[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Распределение статистики критерия Z при верной H₀ — N(0; 1). Критическая область |Z| ≥ c
// (закрашена): её вероятность и есть вероятность ошибки первого рода. Под осью — 100 выборок,
// полученных при верной H₀: засечка — значение Z, оранжевая — выборка попала в критическую область. ----
float y0 = -4; float seed = 1; float sk = -1; float key = -1; float rej = 0; string info = "";
list zs = [0];

func h0(x) = y0 + 7.5 * exp(-x * x / 8);
draw Function { name = "f0"; f = "h0"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gR"; graph = "gr"; nodeRadius = 0; edgeWidth = 2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Text { name = "x4"; pos = (-8, y0 - 0.6); text = "−4"; size = 0.7 }
draw Text { name = "x2"; pos = (-4, y0 - 0.6); text = "−2"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.6); text = "0"; size = 0.7 }
draw Text { name = "y2"; pos = (4, y0 - 0.6); text = "2"; size = 0.7 }
draw Text { name = "y4"; pos = (8, y0 - 0.6); text = "4"; size = 0.7 }
draw Text { name = "zl"; pos = (9.6, y0 + 0.6); text = "Z"; size = 0.9 }
draw Text { name = "h0l"; pos = (-3.6, y0 + 6.2); text = "H₀"; size = 1 }
draw Text { name = "cl"; pos = (C.pos.x + 0.55, y0 + 1.2); text = "c"; size = 0.9 }
draw Text { name = "ncl"; pos = (NC.pos.x - 0.6, y0 + 1.2); text = "−c"; size = 0.9 }

new Point { name = "L1"; pos = (0.6, y0); dynamic = false; active = false }
new Point { name = "L2"; pos = (7, y0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "C"; line = "axisLine"; t = 0.51875; pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "NC"; pos = (-3.9, y0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = button; label = "Новые 100 выборок"; action = "seed = seed + 1" }

Function qn(p) { float lo = -6; float hi = 6; repeat (40) { float m = (lo + hi) / 2; if (normalCdf(m, 0, 1) < p) { lo = m; } else { hi = m; } } return (lo + hi) / 2; }
Function hz(k) { float u = fract(sin(k * 12.9898 + seed * 78.233) * 43758.5453); u = max(0.0005, min(0.9995, u)); return qn(u); }

Update {
  if (seed != sk) { repeat (len(zs)) { pop(zs); } repeat (100) { push(zs, hz(i + 1)); } sk = seed; key = -1; }
  if (abs(NC.pos.x + C.pos.x) > 0.0001) { NC.pos.x = -C.pos.x; NC.pos.y = y0; }
  float cx = C.pos.x; float c = cx / 2;
  if (key != round(cx * 1000) + seed * 100000) {
    gb = newGraph(); ga = newGraph(); gr = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (9) {
      float tx = -8 + 2 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    repeat (200) {
      float x = -9.95 + 0.1 * i;
      if (abs(x) >= cx) { string id = format(i, 0); addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, h0(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#f59e0b"); }
    }
    rej = 0;
    repeat (100) {
      float z = max(-4.9, min(4.9, zs[i])); string id2 = format(i, 0); string col = "#3b82f6";
      if (abs(zs[i]) >= c) { col = "#f59e0b"; rej = rej + 1; }
      addNode(gr, "p" + id2, [2 * z, y0 - 1.1]); addNode(gr, "q" + id2, [2 * z, y0 - 1.9]); addEdge(gr, "p" + id2, "q" + id2, 1, col);
    }
    key = round(cx * 1000) + seed * 100000;
  }
  float alpha = 2 * (1 - normalCdf(c, 0, 1));
  info = "**Ошибка первого рода** — отвергнуть нулевую гипотезу H₀, когда она на самом деле верна. Её вероятность — вероятность попадания статистики критерия Z в критическую область (закрашена) при условии, что H₀ верна: α = P(|Z| ≥ c | H₀) = **" + format(alpha, 4) + "** при c = **" + format(c, 2) + "**.\n\n";
  info = info + "Из 100 выборок, полученных при верной H₀ (засечки под осью), в критическую область попали **" + format(rej, 0) + "** — это ложные отвержения. Доля таких выборок при большом числе повторов стремится к α; ожидаемо ≈ " + format(alpha * 100, 1) + ".";
}
]
