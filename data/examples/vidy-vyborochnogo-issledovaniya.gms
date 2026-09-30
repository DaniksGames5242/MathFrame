[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- 40 наблюдений (x, y). Скрытый фактор z влияет на y. Пассивное наблюдение: x приходит вместе с z.
// Активный эксперимент: x назначает исследователь случайно, независимо от z. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Text { name = "tx"; pos = (9.6, -5.5); text = "x"; size = 1; align = right }
draw Text { name = "ty"; pos = (-9.6, 5.5); text = "y"; size = 1; align = left }

new UI { name = "sM"; type = select; label = "исследование"; variable = mode; options = ("pas", "act"); labels = ("пассивное наблюдение", "активный эксперимент"); default = "pas" }
new UI { name = "sB"; type = slider; label = "эффект x на y"; variable = beta; min = -1; max = 1; step = 0.1; default = 0.5 }
new UI { name = "sG"; type = slider; label = "влияние z на y"; variable = gam; min = 0; max = 2; step = 0.1; default = 1.5 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

string mode = "pas"; float beta = 0.5; float gam = 1.5; float sd = 1;
float key = -1; string info = "";
float fitb = 0; float meanx = 0; float meany = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function u(k) { return rnd(k) + rnd(k + 0.5) - 1; }
Function zi(i) { return u(sd * 1000 + i); }
Function xi(i) {
  if (mode == "pas") { return 3 * zi(i) + u(sd * 1000 + i + 300); }
  return 3.5 * u(sd * 1000 + i + 600);
}
Function yi(i) { return beta * xi(i) + 2 * gam * zi(i) + 0.6 * u(sd * 1000 + i + 900); }
Function px(x) { return 2 * x; }
Function py(y) { return 0.55 * y; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function edge(g, nm, a, b, s) {
  float x1 = -4; float x2 = 4; float lim = 5.6 / 0.55;
  float y1 = a + s * x1; float y2 = a + s * x2;
  if (y1 > lim) { x1 = (lim - a) / s; } if (y1 < -lim) { x1 = (-lim - a) / s; }
  if (y2 > lim) { x2 = (lim - a) / s; } if (y2 < -lim) { x2 = (-lim - a) / s; }
  addNode(g, nm + "1", [px(x1), py(a + s * x1)]); addNode(g, nm + "2", [px(x2), py(a + s * x2)]); addEdge(g, nm + "1", nm + "2");
}

Update {
  float kk = 0; if (mode == "act") { kk = 1; }
  if (key != ((kk * 100 + sd) * 100 + beta * 10 + 10) * 100 + gam * 10) {
    gx = newGraph(); gp = newGraph(); gt = newGraph(); gf = newGraph();
    addNode(gx, "a1", [-9.5, 0]); addNode(gx, "a2", [9.5, 0]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [0, -5.6]); addNode(gx, "b2", [0, 5.6]); addEdge(gx, "b1", "b2");
    float sx = 0; float sy = 0;
    repeat (40) { sx = sx + xi(i); sy = sy + yi(i); }
    meanx = sx / 40; meany = sy / 40;
    float sxy = 0; float sxx = 0;
    repeat (40) {
      addNode(gp, "p" + format(i, 0), [px(xi(i)), py(yi(i))]);
      sxy = sxy + (xi(i) - meanx) * (yi(i) - meany); sxx = sxx + (xi(i) - meanx) * (xi(i) - meanx);
    }
    fitb = sxy / sxx;
    edge(gt, "t", meany - beta * meanx, 0, beta);
    if (abs(beta) < 0.001) { addNode(gt, "z1", [-8, py(meany)]); addNode(gt, "z2", [8, py(meany)]); addEdge(gt, "z1", "z2"); }
    edge(gf, "f", meany - fitb * meanx, 0, fitb);
    key = ((kk * 100 + sd) * 100 + beta * 10 + 10) * 100 + gam * 10;
  }
  info = "**Активный эксперимент:** исследователь сам задаёт значения x и назначает их случайно, поэтому x не связан со скрытым фактором z, и различие в y объясняется воздействием. **Пассивное наблюдение:** значения x фиксируются как есть, и вместе с x меняется z.\n\n";
  info = info + "Истинный эффект β = **" + num(beta, 1) + "** (оранжевая прямая). Оценка наклона по 40 наблюдениям (синяя прямая): **" + num(fitb, 2) + "**.";
  if (mode == "pas") { info = info + " При наблюдении влияние z приписывается x: оценка смещена на " + num(fitb - beta, 2) + " (конфаундинг)."; }
  if (mode == "act") { info = info + " Случайное назначение x разрывает связь с z: оценка отличается от β лишь на " + num(fitb - beta, 2) + " (случайная погрешность)."; }
}
]
