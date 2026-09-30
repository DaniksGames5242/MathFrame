[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Синяя ступенчатая линия — эмпирическая функция распределения Fₙ по выборке (точки на оси перетаскиваются),
// чёрная кривая — теоретическая F₀ = Φ(z − μ₀) (ось: x = 2.5·z). Жёлтый отрезок — наибольший зазор Dₙ = sup |Fₙ − F₀|. ----
float y0 = -3.5; float n = 8; float mu = 0;
float D = 0; float xD = 0; float yA = 0; float yB = 0; float pv = 1; float dc = 0.45;
float kk = -99;
string info = "";

func f0(X) = y0 + 8 * normalCdf(X / 2.5 - mu, 0, 1);
draw Function { name = "gF"; f = "f0"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gE"; graph = "ge"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gD"; graph = "gd"; nodeRadius = 0; edgeWidth = 4; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "P0"; pos = (-4, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 0.5 }
new Point { name = "P1"; pos = (-2.25, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 1.5 }
new Point { name = "P2"; pos = (-1, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 2.5 }
new Point { name = "P3"; pos = (0.25, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 3.5 }
new Point { name = "P4"; pos = (1.25, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 4.5 }
new Point { name = "P5"; pos = (2.25, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 5.5 }
new Point { name = "P6"; pos = (3.25, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 6.5 }
new Point { name = "P7"; pos = (5, -3.5); pauseOnDrag = false; collideWithPoints = false; active = n > 7.5 }
draw Text { name = "t1"; pos = (-9.6, y0 + 8.45); text = "1"; size = 0.75 }
draw Text { name = "t0"; pos = (-9.6, y0 + 0.45); text = "0"; size = 0.75 }
draw Text { name = "xm"; pos = (-7.5, y0 - 0.55); text = "−3"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "xp"; pos = (7.5, y0 - 0.55); text = "3"; size = 0.7 }

new UI { type = slider; label = "объём выборки n"; variable = n; min = 3; max = 8; step = 1; default = 8 }
new UI { type = slider; label = "центр гипотезы μ₀"; variable = mu; min = -1.5; max = 1.5; step = 0.1; default = 0 }

Function gv(k) {
  if (k == 0) { return P0.pos.x; }
  if (k == 1) { return P1.pos.x; }
  if (k == 2) { return P2.pos.x; }
  if (k == 3) { return P3.pos.x; }
  if (k == 4) { return P4.pos.x; }
  if (k == 5) { return P5.pos.x; }
  if (k == 6) { return P6.pos.x; }
  if (k == 7) { return P7.pos.x; }
  return 0;
}
// место точки j в порядке возрастания (при равенстве — по номеру)
Function rk(j) { float r = 0; repeat (n) { if (gv(i) < gv(j)) { r = r + 1; } if (gv(i) == gv(j)) { if (i < j) { r = r + 1; } } } return r; }
Function xr(k) { float v = 0; repeat (n) { if (rk(i) == k) { v = gv(i); } } return v; }
Update {
  if (abs(P0.pos.y - y0) > 0.0001) { P0.pos.y = y0; }
  if (P0.pos.x > fieldMaxX) { P0.pos.x = fieldMaxX; }
  if (P0.pos.x < -fieldMaxX) { P0.pos.x = -fieldMaxX; }
  if (abs(P1.pos.y - y0) > 0.0001) { P1.pos.y = y0; }
  if (P1.pos.x > fieldMaxX) { P1.pos.x = fieldMaxX; }
  if (P1.pos.x < -fieldMaxX) { P1.pos.x = -fieldMaxX; }
  if (abs(P2.pos.y - y0) > 0.0001) { P2.pos.y = y0; }
  if (P2.pos.x > fieldMaxX) { P2.pos.x = fieldMaxX; }
  if (P2.pos.x < -fieldMaxX) { P2.pos.x = -fieldMaxX; }
  if (abs(P3.pos.y - y0) > 0.0001) { P3.pos.y = y0; }
  if (P3.pos.x > fieldMaxX) { P3.pos.x = fieldMaxX; }
  if (P3.pos.x < -fieldMaxX) { P3.pos.x = -fieldMaxX; }
  if (abs(P4.pos.y - y0) > 0.0001) { P4.pos.y = y0; }
  if (P4.pos.x > fieldMaxX) { P4.pos.x = fieldMaxX; }
  if (P4.pos.x < -fieldMaxX) { P4.pos.x = -fieldMaxX; }
  if (abs(P5.pos.y - y0) > 0.0001) { P5.pos.y = y0; }
  if (P5.pos.x > fieldMaxX) { P5.pos.x = fieldMaxX; }
  if (P5.pos.x < -fieldMaxX) { P5.pos.x = -fieldMaxX; }
  if (abs(P6.pos.y - y0) > 0.0001) { P6.pos.y = y0; }
  if (P6.pos.x > fieldMaxX) { P6.pos.x = fieldMaxX; }
  if (P6.pos.x < -fieldMaxX) { P6.pos.x = -fieldMaxX; }
  if (abs(P7.pos.y - y0) > 0.0001) { P7.pos.y = y0; }
  if (P7.pos.x > fieldMaxX) { P7.pos.x = fieldMaxX; }
  if (P7.pos.x < -fieldMaxX) { P7.pos.x = -fieldMaxX; }
  float key = 1000 * n + 77 * mu; repeat (n) { key = key * 1.3 + gv(i); }
  if (kk != key) {
    ge = newGraph(); ga = newGraph(); gd = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    addNode(ga, "l1", [-10, y0 + 8]); addNode(ga, "r1", [10, y0 + 8]); addEdge(ga, "l1", "r1");
    repeat (7) { float tx = -7.5 + 2.5 * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    addNode(ge, "s", [-10, y0]);
    D = 0;
    repeat (n) {
      float xk = xr(i); float F = normalCdf(xk / 2.5 - mu, 0, 1);
      float lo = y0 + 8 * i / n; float hi = y0 + 8 * (i + 1) / n;
      string id = format(i, 0);
      addNode(ge, "a" + id, [xk, lo]); addNode(ge, "b" + id, [xk, hi]);
      if (i == 0) { addEdge(ge, "s", "a" + id, 1, "#3b82f6"); }
      if (i > 0) { addEdge(ge, "b" + format(i - 1, 0), "a" + id, 1, "#3b82f6"); }
      addEdge(ge, "a" + id, "b" + id, 1, "#3b82f6");
      float dp = (i + 1) / n - F; float dm = F - i / n;
      if (dp > D) { D = dp; xD = xk; yA = y0 + 8 * F; yB = hi; }
      if (dm > D) { D = dm; xD = xk; yA = y0 + 8 * F; yB = lo; }
    }
    addNode(ge, "e", [10, y0 + 8]); addEdge(ge, "b" + format(n - 1, 0), "e", 1, "#3b82f6");
    addNode(gd, "d1", [xD, yA]); addNode(gd, "d2", [xD, yB]); addEdge(gd, "d1", "d2", 1, "#f59e0b");
    float lam = (sqrt(n) + 0.12 + 0.11 / sqrt(n)) * D;
    pv = 0; repeat (60) { float kq = i + 1; pv = pv + 2 * pow(-1, i) * exp(-2 * kq * kq * lam * lam); }
    pv = max(0, min(1, pv));
    dc = 1.358 / (sqrt(n) + 0.12 + 0.11 / sqrt(n));
    kk = key;
  }
  info = "**Критерий согласия Колмогорова — Смирнова** сравнивает эмпирическую функцию распределения Fₙ (синяя) выборки объёма n = **" + format(n, 0) + "** с теоретической F₀ — нормальной N(μ₀; 1), μ₀ = **" + format(mu, 1) + "** (H₀: выборка взята из F₀).\n\n";
  info = info + "**Dₙ = sup |Fₙ(x) − F₀(x)| = " + format(D, 3) + "** — наибольшее вертикальное расстояние (жёлтый отрезок; достигается в точке скачка Fₙ). Критическое значение при α = 0.05 (приближённо): **" + format(dc, 3) + "**, p ≈ **" + format(pv, 3) + "**.\n\n";
  if (D >= dc) { info = info + "Dₙ ≥ критического: H₀ **отвергается**."; }
  if (D < dc) { info = info + "Dₙ < критического: H₀ **не отвергается**."; }
  info = info + " Распределение Dₙ при H₀ не зависит от вида непрерывной F₀; критерий работает с самими наблюдениями, без группировки на интервалы.";
}
]
