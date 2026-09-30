[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Столбики — вероятности P(X = k) = λᵏe^(−λ)/k!, k = 0…24. Оранжевые точки — биномиальное
// распределение с n испытаниями и pr = λ/n: при росте n они ложатся на столбики. Оранжевая черта — λ. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 10; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t0"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "t5"; pos = (px(5), -5.7); text = "5"; size = 0.9 }
draw Text { name = "t10"; pos = (px(10), -5.7); text = "10"; size = 0.9 }
draw Text { name = "t15"; pos = (px(15), -5.7); text = "15"; size = 0.9 }
draw Text { name = "t20"; pos = (px(20), -5.7); text = "20"; size = 0.9 }
draw Text { name = "tk"; pos = (9.6, -5.7); text = "k"; size = 0.9 }
draw Text { name = "ty"; pos = (-9.6, 5.5); text = "P = " + format(gstep, 2) + " · линия"; size = 0.9; align = left }

new UI { name = "sL"; type = slider; label = "λ"; variable = lam; min = 0.5; max = 12; step = 0.1; default = 4 }
new UI { name = "sN"; type = slider; label = "n (биномиальное)"; variable = n; min = 15; max = 400; step = 1; default = 20 }

// ---- Логика ----
float lam = 4; float n = 20; float key = -1; float gstep = 0.1;
list Pl = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
list Bn = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
string info = "";
Function px(u) { return -9.4 + 18.8 * u / 24; }

Update {
  if (key != lam * 1000 + n) {
    gg = newGraph(); gb = newGraph(); gm = newGraph(); gn = newGraph();
    float pr = lam / n;
    float pp = exp(-lam); float qb = exp(n * log(1 - pr));
    float sm = 0; float mn = 0; float m2 = 0; float pmax = 0; float bmax = 0;
    repeat (25) {
      float k = i;
      if (k > 0) { pp = pp * lam / k; qb = qb * (n - k + 1) / k * pr / (1 - pr); }
      Pl[k] = pp; Bn[k] = qb;
      sm = sm + pp; mn = mn + k * pp; m2 = m2 + k * k * pp;
      pmax = max(pmax, max(pp, qb));
    }
    gstep = 0.05; if (pmax > 0.2) { gstep = 0.1; }
    float tp = gstep * ceil(pmax / gstep);
    float sy = 10 / tp;
    addNode(gg, "x1", [-9.6, -5]); addNode(gg, "x2", [9.6, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.6, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.6, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (25) {
      string s = format(i, 0);
      addNode(gb, "a" + s, [px(i), -5]); addNode(gb, "b" + s, [px(i), -5 + sy * Pl[i]]); addEdge(gb, "a" + s, "b" + s, 1, "#3b82f6");
      addNode(gn, "n" + s, [px(i), -5 + sy * Bn[i]]);
    }
    addNode(gm, "m1", [px(lam), -5]); addNode(gm, "m2", [px(lam), 5.3]); addEdge(gm, "m1", "m2");
    info = "**Распределение Пуассона** с параметром λ = " + format(lam, 1) + ": P(X = k) = λᵏe^(−λ)/k! при k = 0, 1, 2, … (показаны k ≤ 24, сумма показанных вероятностей " + format(sm, 4) + ").\n\n**Математическое ожидание и дисперсия совпадают с λ:** E[X] = " + format(mn, 3) + ", D[X] = " + format(m2 - mn * mn, 3) + ".\n\n**Предел биномиального.** Оранжевые точки — B(n, pr) при n = " + format(n, 0) + ", pr = λ/n = " + format(pr, 3) + ": E = np = " + format(lam, 2) + ", D = np(1 − pr) = " + format(lam * (1 - pr), 3) + ". При росте n при постоянном np = λ они приближаются к столбикам.";
    key = lam * 1000 + n;
  }
}
]
