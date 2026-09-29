[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 3; float e = 1.5; float b = 3.4; float c = 4.5; float dd = 2; float sm = 1.5; string info = "";
func as1(x) = (b / a) * x;
func as2(x) = -(b / a) * x;
new Curve { name = "hr"; type = parametric; x = "a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
new Curve { name = "hl"; type = parametric; x = "-a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
draw Function { name = "s1"; f = "as1"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 1 }
draw Function { name = "s2"; f = "as2"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 1 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "P"; curve = "hr"; t = 0.8; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "mf"; pos = (P, F); color = #22c55e }
new Line { name = "mh"; pos = (P, H); color = #22c55e }
new UI { type = slider; label = "действительная полуось a"; variable = a; min = 1.5; max = 3.5; step = 0.1; default = 3 }
new UI { type = slider; label = "эксцентриситет ε"; variable = e; min = 1.2; max = 2.5; step = 0.05; default = 1.5 }
Update {
  c = a * e; b = a * sqrt(e * e - 1); dd = a / e;
  float z = 5.9 / b; float w = 9.8 / a;
  sm = min(ln(z + sqrt(z * z + 1)), ln(w + sqrt(w * w - 1)));
  gd = newGraph();
  addNode(gd, "l1", [-dd, -6]); addNode(gd, "l2", [-dd, 6]); addEdge(gd, "l1", "l2");
  addNode(gd, "r1", [dd, -6]); addNode(gd, "r2", [dd, 6]); addEdge(gd, "r1", "r2");
  float s = 1; if (P.pos.x < 0) { s = -1; }
  F.pos.x = s * c; F.pos.y = 0; H.pos.x = s * dd; H.pos.y = P.pos.y;
  float df = sqrt((P.pos.x - F.pos.x) * (P.pos.x - F.pos.x) + P.pos.y * P.pos.y);
  float dh = abs(s * dd - P.pos.x);
  info = "**Директрисы гиперболы** — две прямые x = ±a/ε (оранжевые), перпендикулярные действительной оси; при a = " + format(a, 1) + " и ε = " + format(e, 2) + " они удалены от центра на a/ε = a²/c = " + format(dd, 2) + " < a и не пересекают кривую. Каждая директриса соответствует фокусу своей ветви (c = aε = " + format(c, 2) + "): расстояние от фокуса до неё b²/c = " + format(b * b / c, 2) + ".\n\nДля любой точки M гиперболы отношение расстояния до фокуса F к расстоянию до директрисы (H — основание перпендикуляра) равно эксцентриситету: MF / MH = " + format(df, 2) + " / " + format(dh, 2) + " = " + format(df / dh, 3) + " = ε. Чем больше ε, тем ближе директрисы к центру.";
}
]
