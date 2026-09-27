[
description = "{info}"
field width = 16; field height = 9;
camera type = fixed;
float n = 10; float m = 3; string info = "";
draw Graph { name = "gAll"; graph = "ga"; nodeRadius = 12; labels = false; interactive = false }
draw Graph { name = "gFav"; graph = "gf"; nodeRadius = 12; nodeColor = #f59e0b; labels = false; interactive = false }
new UI { type = slider; label = "всего исходов n"; variable = n; min = 2; max = 20; step = 1; default = 10 }
new UI { type = slider; label = "благоприятных m"; variable = m; min = 0; max = n; step = 1; default = 3 }
Update {
  ga = newGraph(); gf = newGraph();
  repeat (20) {
    if (i < n) {
      float x = -7.5 + 15 * i / max(1, n - 1);
      if (i < m) { addNode(gf, "p" + format(i,0), [x, 0]); }
      if (i >= m) { addNode(ga, "p" + format(i,0), [x, 0]); }
    }
  }
  float p = m / n;
  info = "Всего n = " + format(n,0) + " равновозможных исходов (точки на поле), из них m = " + format(m,0) + " благоприятных (оранжевые). По классическому определению P = m/n = " + format(m,0) + "/" + format(n,0) + " = **" + format(p, 3) + "**.";
}
]
