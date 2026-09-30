[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;

// ---- Схема Бернулли: n испытаний, k успехов (синие кружки), n − k неудач (жёлтые). Выборка фиксирована,
// переменная — параметр p. Кривая — правдоподобие L(p) = pᵏ(1 − p)ⁿ⁻ᵏ, делённое на своё наибольшее
// значение. Точку P можно вести по кривой; зелёная линия — точка максимума. ----
draw Graph { name = "gS"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gF"; graph = "gf"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
new Curve { name = "cL"; type = parametric; x = "-7.5 + 15 * t"; y = "-4 + 6.4 * pow(t, k) * pow(1 - t, n - k) / lmax"; segments = 300; thickness = 3; color = #3b82f6 }
new Point { name = "P"; curve = "cL"; t = 0.55; collideWithPoints = false; pauseOnDrag = false; layer = 60; color = #f59e0b }
draw Text { name = "t0"; pos = (-7.5, -4.75); text = "p = 0"; size = 0.9 }
draw Text { name = "t1"; pos = (0, -4.75); text = "0.5"; size = 0.9 }
draw Text { name = "t2"; pos = (7.5, -4.75); text = "1"; size = 0.9 }
draw Text { name = "tm"; pos = (-7.5 + 15 * k / n, 2.75); text = "p̂ = " + format(k / n, 2); size = 0.95; color = #22c55e }

new UI { name = "sN"; type = slider; label = "число испытаний n"; variable = n; min = 1; max = 20; step = 1; default = 10 }
new UI { name = "sK"; type = slider; label = "успехов k"; variable = k; min = 0; max = n; step = 1; default = 3 }

float n = 10; float k = 3; float lmax = 1; float key = -1; string info = "";

Update {
  lmax = pow(k / n, k) * pow(1 - k / n, n - k);
  if (key != n * 100 + k) {
    key = n * 100 + k;
    gs = newGraph(); gf = newGraph(); gm = newGraph(); gax = newGraph();
    repeat (n) {
      float x = -7.5 + 0.75 * (i + 0.5) + (20 - n) * 0.375;
      if (i < k) { addNode(gs, "s" + format(i, 0), [x, 3.9]); } else { addNode(gf, "f" + format(i, 0), [x, 3.9]); }
    }
    addNode(gm, "p", [-7.5 + 15 * k / n, -4]); addNode(gm, "q", [-7.5 + 15 * k / n, 2.5]); addEdge(gm, "p", "q");
    addNode(gax, "p", [-7.5, -4]); addNode(gax, "q", [7.5, -4]); addEdge(gax, "p", "q");
  }
  float pp = (P.pos.x + 7.5) / 15;
  float lp = pow(pp, k) * pow(1 - pp, n - k);
  info = "**Метод максимального правдоподобия:** выборка считается фиксированным результатом, а параметр — переменной; за оценку берут значение параметра, при котором вероятность наблюдённой выборки наибольшая. Здесь — n = **" + format(n, 0) + "** испытаний с вероятностью успеха p, наблюдено k = **" + format(k, 0) + "** успехов.\n\n";
  info = info + "**Правдоподобие:** L(p) = pᵏ(1 − p)ⁿ⁻ᵏ. Условие максимума ln L = k ln p + (n − k) ln(1 − p): k/p − (n − k)/(1 − p) = 0, откуда **p̂ = k/n = " + format(k / n, 3) + "**, L(p̂) = **" + format(lmax, 6) + "**.\n\n";
  info = info + "В точке P: p = **" + format(pp, 3) + "**, L(p) = **" + format(lp, 6) + "**, что составляет **" + format(100 * lp / lmax, 1) + "%** от наибольшего значения.";
}
]
