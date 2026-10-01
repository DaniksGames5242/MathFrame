[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Внизу — выборка из n значений (перетаскиваются), жёлтая засечка — μ₀ = 0, синяя — среднее x̄.
// Сверху — плотность t-распределения Стьюдента с n − 1 степенями свободы (ось: x = 1.5·t) и,
// для сравнения, нормальная N(0; 1) (жёлтая). Синяя линия — наблюдённое t, закрашены хвосты. ----
float yT = -0.5; float yS = -4.5; float ky = 15;
float n = 6; float tv = 0; float pv = 1; float tc = 2.57; float xb = 0; float sd = 1;
float kk = -99;
string info = "";

func dens(X) = yT + ky * tPdf(X / 1.5, n - 1);
func nrm(X) = yT + ky * normalPdf(X / 1.5, 0, 1);
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "gn"; f = "nrm"; xmin = -10; xmax = 10; thickness = 1.5; color = #f59e0b; layer = 25 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 0; edgeWidth = 2.5; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "P0"; pos = (3.2, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 0.5 }
new Point { name = "P1"; pos = (1.8, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 1.5 }
new Point { name = "P2"; pos = (4.8, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 2.5 }
new Point { name = "P3"; pos = (-0.8, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 3.5 }
new Point { name = "P4"; pos = (2.6, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 4.5 }
new Point { name = "P5"; pos = (4, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 5.5 }
new Point { name = "P6"; pos = (1.4, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 6.5 }
new Point { name = "P7"; pos = (3.6, -4.5); pauseOnDrag = false; collideWithPoints = false; active = n > 7.5 }
draw Text { name = "l0"; pos = (0, yS - 0.8); text = "μ₀"; size = 0.9; color = #f59e0b }
draw Text { name = "lx"; pos = (2 * max(-5, min(5, xb)), yS + 1.3); text = "x̄"; size = 0.9; color = #3b82f6 }
draw Text { name = "tT"; pos = (0, yT - 0.55); text = "0"; size = 0.7 }
draw Text { name = "tm"; pos = (-6, yT - 0.55); text = "−4"; size = 0.7 }
draw Text { name = "tp"; pos = (6, yT - 0.55); text = "4"; size = 0.7 }

new UI { type = slider; label = "объём выборки n"; variable = n; min = 2; max = 8; step = 1; default = 6 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function gv(k) {
  if (k == 0) { return P0.pos.x / 2; }
  if (k == 1) { return P1.pos.x / 2; }
  if (k == 2) { return P2.pos.x / 2; }
  if (k == 3) { return P3.pos.x / 2; }
  if (k == 4) { return P4.pos.x / 2; }
  if (k == 5) { return P5.pos.x / 2; }
  if (k == 6) { return P6.pos.x / 2; }
  if (k == 7) { return P7.pos.x / 2; }
  return 0;
}
Update {
  if (abs(P0.pos.y - yS) > 0.0001) { P0.pos.y = yS; }
  if (P0.pos.x > fieldMaxX) { P0.pos.x = fieldMaxX; }
  if (P0.pos.x < -fieldMaxX) { P0.pos.x = -fieldMaxX; }
  if (abs(P1.pos.y - yS) > 0.0001) { P1.pos.y = yS; }
  if (P1.pos.x > fieldMaxX) { P1.pos.x = fieldMaxX; }
  if (P1.pos.x < -fieldMaxX) { P1.pos.x = -fieldMaxX; }
  if (abs(P2.pos.y - yS) > 0.0001) { P2.pos.y = yS; }
  if (P2.pos.x > fieldMaxX) { P2.pos.x = fieldMaxX; }
  if (P2.pos.x < -fieldMaxX) { P2.pos.x = -fieldMaxX; }
  if (abs(P3.pos.y - yS) > 0.0001) { P3.pos.y = yS; }
  if (P3.pos.x > fieldMaxX) { P3.pos.x = fieldMaxX; }
  if (P3.pos.x < -fieldMaxX) { P3.pos.x = -fieldMaxX; }
  if (abs(P4.pos.y - yS) > 0.0001) { P4.pos.y = yS; }
  if (P4.pos.x > fieldMaxX) { P4.pos.x = fieldMaxX; }
  if (P4.pos.x < -fieldMaxX) { P4.pos.x = -fieldMaxX; }
  if (abs(P5.pos.y - yS) > 0.0001) { P5.pos.y = yS; }
  if (P5.pos.x > fieldMaxX) { P5.pos.x = fieldMaxX; }
  if (P5.pos.x < -fieldMaxX) { P5.pos.x = -fieldMaxX; }
  if (abs(P6.pos.y - yS) > 0.0001) { P6.pos.y = yS; }
  if (P6.pos.x > fieldMaxX) { P6.pos.x = fieldMaxX; }
  if (P6.pos.x < -fieldMaxX) { P6.pos.x = -fieldMaxX; }
  if (abs(P7.pos.y - yS) > 0.0001) { P7.pos.y = yS; }
  if (P7.pos.x > fieldMaxX) { P7.pos.x = fieldMaxX; }
  if (P7.pos.x < -fieldMaxX) { P7.pos.x = -fieldMaxX; }
  float sm = 0; repeat (n) { sm = sm + gv(i); }
  xb = sm / n;
  float ss = 0; repeat (n) { ss = ss + (gv(i) - xb) * (gv(i) - xb); }
  sd = sqrt(ss / (n - 1)); if (sd < 0.02) { sd = 0.02; }
  tv = xb / (sd / sqrt(n));
  float df = n - 1;
  float key = 0; repeat (n) { key = key * 1.7 + gv(i); } key = key + 1000 * n;
  if (kk != key) {
    gb = newGraph(); ga = newGraph(); gc = newGraph();
    addNode(ga, "l", [-10, yT]); addNode(ga, "r", [10, yT]); addEdge(ga, "l", "r");
    addNode(ga, "sl", [-10, yS]); addNode(ga, "sr", [10, yS]); addEdge(ga, "sl", "sr");
    repeat (9) { float tx = -6 + 1.5 * i; addNode(ga, "t" + format(i, 0), [tx, yT - 0.15]); addNode(ga, "u" + format(i, 0), [tx, yT + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (abs(x / 1.5) >= abs(tv)) { addNode(gb, "a" + id, [x, yT]); addNode(gb, "b" + id, [x, dens(x)]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6"); }
    }
    tc = tQuantile(0.975, df);
    addNode(gc, "c1", [1.5 * tc, yT - 0.4]); addNode(gc, "c2", [1.5 * tc, yT + 0.4]); addEdge(gc, "c1", "c2", 1, "#f59e0b");
    addNode(gc, "d1", [-1.5 * tc, yT - 0.4]); addNode(gc, "d2", [-1.5 * tc, yT + 0.4]); addEdge(gc, "d1", "d2", 1, "#f59e0b");
    float tx2 = tv; if (tx2 > 6.6) { tx2 = 6.6; } if (tx2 < -6.6) { tx2 = -6.6; }
    addNode(gc, "e1", [1.5 * tx2, yT]); addNode(gc, "e2", [1.5 * tx2, yT + 3]); addEdge(gc, "e1", "e2", 1, "#3b82f6");
    addNode(gc, "z1", [0, yS - 0.4]); addNode(gc, "z2", [0, yS + 0.4]); addEdge(gc, "z1", "z2", 1, "#f59e0b");
    float xm = xb; if (xm > 5) { xm = 5; } if (xm < -5) { xm = -5; }
    addNode(gc, "m1", [2 * xm, yS - 0.4]); addNode(gc, "m2", [2 * xm, yS + 0.9]); addEdge(gc, "m1", "m2", 1, "#3b82f6");
    kk = key;
  }
  pv = 2 * (1 - tCdf(abs(tv), df));
  float pz = 2 * (1 - normalCdf(abs(tv), 0, 1));
  info = "**Одновыборочный t-критерий Стьюдента** проверяет H₀: μ = μ₀ = 0 для нормальной совокупности при неизвестной дисперсии. Среднее x̄ = **" + num(xb, 2) + "**, s = **" + format(sd, 2) + "**, n = **" + format(n, 0) + "**.\n\n";
  info = info + "**t = (x̄ − μ₀) / (s/√n) = " + num(tv, 2) + "** имеет распределение Стьюдента с n − 1 = **" + format(df, 0) + "** степенями свободы. p = 2·(1 − F(|t|)) = **" + format(pv, 4) + "**; критическое значение при α = 0,05: ±**" + format(tc, 2) + "** (жёлтые засечки).\n\n";
  if (pv <= 0.05) { info = info + "|t| ≥ " + format(tc, 2) + ": H₀ **отвергается**."; }
  if (pv > 0.05) { info = info + "|t| < " + format(tc, 2) + ": H₀ **не отвергается**."; }
  info = info + " Если бы s считалась известной σ, использовали бы нормальное распределение (жёлтая кривая) с p = " + format(pz, 4) + " — хвосты Стьюдента тяжелее, и при малом n критическое значение заметно больше 1,96; с ростом n распределение Стьюдента приближается к нормальному.";
}
]
