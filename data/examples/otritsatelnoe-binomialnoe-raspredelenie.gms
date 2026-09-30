[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Столбики — P(X = k) = C(k + r − 1, k)·pʳ·qᵏ, k = 0…39 неудач до r-го успеха. Оранжевые точки —
// свёртка r независимых геометрических (число неудач до первого успеха): совпадают со столбиками. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 10; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t0"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "t10"; pos = (px(10), -5.7); text = "10"; size = 0.9 }
draw Text { name = "t20"; pos = (px(20), -5.7); text = "20"; size = 0.9 }
draw Text { name = "t30"; pos = (px(30), -5.7); text = "30"; size = 0.9 }
draw Text { name = "tk"; pos = (9.6, -5.7); text = "k"; size = 0.9 }
draw Text { name = "ty"; pos = (-9.6, 5.5); text = "линии сетки — через " + format(gstep, 2); size = 0.9; align = left }

new UI { name = "sR"; type = slider; label = "r"; variable = rr; min = 1; max = 8; step = 1; default = 3 }
new UI { name = "sP"; type = slider; label = "p"; variable = ps; min = 0.3; max = 0.9; step = 0.01; default = 0.5 }

// ---- Логика ----
float rr = 3; float ps = 0.5; float key = -1; float gstep = 0.05;
list nb = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
list gm1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
list cv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
list cw = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
string info = "";
Function px(u) { return -9.4 + 18.8 * (u + 0.5) / 40; }

Update {
  if (key != rr * 1000 + ps * 100) {
    gg = newGraph(); gb = newGraph(); gm = newGraph(); gn = newGraph();
    float qf = 1 - ps;
    // формула: P(0) = pʳ, P(k) = P(k − 1)·(k + r − 1)/k·q
    float pk = pow(ps, rr); float sm = 0; float pmax = 0;
    repeat (40) {
      float k = i;
      if (k > 0) { pk = pk * (k + rr - 1) / k * qf; }
      nb[k] = pk; sm = sm + pk;
      gm1[k] = ps * pow(qf, k); cv[k] = ps * pow(qf, k);
    }
    // свёртка r геометрических распределений
    repeat (rr - 1) {
      repeat (40) {
        float k = i; float acc = 0;
        repeat (k + 1) { acc = acc + cv[i] * gm1[k - i]; }
        cw[k] = acc;
      }
      repeat (40) { cv[i] = cw[i]; }
    }
    repeat (40) { pmax = max(pmax, max(nb[i], cv[i])); }
    gstep = 0.05; if (pmax > 0.25) { gstep = 0.1; }
    float tp = gstep * ceil(pmax / gstep);
    float sy = 10 / tp;
    addNode(gg, "x1", [-9.6, -5]); addNode(gg, "x2", [9.6, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.6, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.6, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (40) {
      string s = format(i, 0);
      addNode(gb, "a" + s, [px(i), -5]); addNode(gb, "b" + s, [px(i), -5 + sy * nb[i]]); addEdge(gb, "a" + s, "b" + s, 1, "#3b82f6");
      addNode(gn, "n" + s, [px(i), -5 + sy * cv[i]]);
    }
    addNode(gm, "m1", [px(rr * qf / ps), -5.4]); addNode(gm, "m2", [px(rr * qf / ps), -4.6]); addEdge(gm, "m1", "m2");
    info = "**Отрицательное биномиальное распределение:** X — число неудач до r-го успеха, r = " + format(rr, 0) + ", вероятность успеха p = " + format(ps, 2) + ", q = " + format(qf, 2) + ". P(X = k) = C(k + r − 1, k)·pʳ·qᵏ, k = 0, 1, 2, … (показаны k ≤ 39, сумма показанных вероятностей " + format(sm, 4) + ").\n\n**Числовые характеристики:** E[X] = rq/p = " + format(rr * qf / ps, 2) + " (отметка на оси), D[X] = rq/p² = " + format(rr * qf / (ps * ps), 2) + ". При r = 1 это распределение числа неудач до первого успеха — геометрическое.\n\n**Свёртка геометрических.** Оранжевые точки — сумма " + format(rr, 0) + " независимых геометрических величин (неудачи до первого успеха), посчитанная свёрткой: она совпадает с P(X = k).";
    key = rr * 1000 + ps * 100;
  }
}
]
