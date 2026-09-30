[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Нулевое распределение статистики Z ~ N(0; 1) (ось: x = 2.5·z). Точка A — наблюдённое z.
// Закрашена область «не менее экстремальных» значений — её площадь и есть p-значение.
// Жёлтые засечки — критические значения при заданном уровне значимости α. ----
float y0 = -4; float ky = 17.5;
float alpha = 0.05; string tail = "two";
float zo = 0; float pv = 1; float zc = 1.96;
float kx = -99; float kt = -1; float ka = -1;
string info = "";

func dens(X) = y0 + ky * normalPdf(X / 2.5, 0, 1);
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 0; edgeWidth = 2.5; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (3.2, -4); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
draw Text { name = "tZ"; pos = (A.pos.x, y0 - 0.8); text = "z"; size = 0.95; color = #3b82f6 }
draw Text { name = "xm"; pos = (-7.5, y0 - 0.55); text = "−3"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "xp"; pos = (7.5, y0 - 0.55); text = "3"; size = 0.7 }

new UI { type = select; label = "альтернатива"; variable = tail; options = ("two", "right", "left"); labels = ("двусторонняя", "правосторонняя", "левосторонняя"); default = "two" }
new UI { type = slider; label = "уровень значимости α"; variable = alpha; min = 0.01; max = 0.2; step = 0.01; default = 0.05 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inTail(z) {
  if (tail == "two") { if (abs(z) >= abs(zo)) { return 1; } return 0; }
  if (tail == "right") { if (z >= zo) { return 1; } return 0; }
  if (z <= zo) { return 1; } return 0;
}
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x > fieldMaxX) { A.pos.x = fieldMaxX; }
  if (A.pos.x < -fieldMaxX) { A.pos.x = -fieldMaxX; }
  zo = A.pos.x / 2.5;
  float tc = 0; if (tail == "right") { tc = 1; } if (tail == "left") { tc = 2; }
  if (kx != A.pos.x || kt != tc || ka != alpha) {
    gb = newGraph(); ga = newGraph(); gc = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (7) { float tx = -7.5 + 2.5 * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (inTail(x / 2.5) > 0.5) { addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, dens(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6"); }
    }
    if (tail == "two") { zc = normalQuantile(1 - alpha / 2); addNode(gc, "p1", [2.5 * zc, y0 - 0.4]); addNode(gc, "p2", [2.5 * zc, y0 + 0.4]); addEdge(gc, "p1", "p2", 1, "#f59e0b"); addNode(gc, "m1", [-2.5 * zc, y0 - 0.4]); addNode(gc, "m2", [-2.5 * zc, y0 + 0.4]); addEdge(gc, "m1", "m2", 1, "#f59e0b"); }
    if (tail == "right") { zc = normalQuantile(1 - alpha); addNode(gc, "p1", [2.5 * zc, y0 - 0.4]); addNode(gc, "p2", [2.5 * zc, y0 + 0.4]); addEdge(gc, "p1", "p2", 1, "#f59e0b"); }
    if (tail == "left") { zc = normalQuantile(1 - alpha); addNode(gc, "m1", [-2.5 * zc, y0 - 0.4]); addNode(gc, "m2", [-2.5 * zc, y0 + 0.4]); addEdge(gc, "m1", "m2", 1, "#f59e0b"); }
    kx = A.pos.x; kt = tc; ka = alpha;
  }
  if (tail == "two") { pv = 2 * (1 - normalCdf(abs(zo), 0, 1)); }
  if (tail == "right") { pv = 1 - normalCdf(zo, 0, 1); }
  if (tail == "left") { pv = normalCdf(zo, 0, 1); }
  string form = "2·(1 − Φ(|z|))"; if (tail == "right") { form = "1 − Φ(z)"; } if (tail == "left") { form = "Φ(z)"; }
  string cr = "±" + format(zc, 2); if (tail == "right") { cr = format(zc, 2); } if (tail == "left") { cr = "−" + format(zc, 2); }
  info = "**p-значение** — вероятность получить значение статистики Z не менее экстремальное, чем наблюдённое z = **" + num(zo, 2) + "**, если верна нулевая гипотеза (Z ~ N(0; 1)). Это площадь закрашенной области под плотностью.\n\n";
  info = info + "**p = " + format(pv, 4) + "** (" + form + "). Уровень значимости α = **" + format(alpha, 2) + "**, критическое значение " + cr + " (жёлтые засечки).\n\n";
  if (pv <= alpha) { info = info + "p ≤ α: данные плохо согласуются с H₀ — гипотеза **отвергается**."; }
  if (pv > alpha) { info = info + "p > α: данные не противоречат H₀ — гипотеза **не отвергается**."; }
  info = info + " Решение по p ≤ α и по попаданию z в критическую область всегда совпадают. p лежит в [0; 1] и **не** является вероятностью самой H₀: оно считается в предположении, что H₀ верна.";
}
]
