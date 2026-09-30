[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Пять узлов (на краях f = 0) задают ломаную f на [−7,5; 7,5]. Узлы двигаются вверх-вниз, а площадь под графиком
// автоматически остаётся равной 1 (при неотрицательных значениях это и есть плотность). ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gFill"; graph = "gfill"; edgeColor = #3b82f633; edgeWidth = 10; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gInt"; graph = "gint"; edgeColor = #f59e0b; edgeWidth = 10; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gCur"; graph = "gcur"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "lf"; pos = (-7.6, 4.5); text = "y = f(x)"; size = 1; align = left }
draw Text { name = "lx"; pos = (0, -4.6); text = "x"; size = 0.9 }
new Point { name = "K1"; pos = (-5, -0.6); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "K2"; pos = (-2.5, 1.5); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "K3"; pos = (0, -0.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "K4"; pos = (2.5, -1.8); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "K5"; pos = (5, -0.9); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "X"; pos = (-3, -3.6); text = true("x"); pauseOnDrag = false; collision = false; color = #f59e0b }

new UI { type = slider; label = "Δx"; variable = dx; min = 0.1; max = 3; step = 0.1; default = 1 }

float dx = 1; float key = -1; float A = 8; float pe = 0; string info = "";

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function hk(k) {
  if (k == 0) { return 0; }
  if (k == 1) { return K1.pos.y + 3.6; }
  if (k == 2) { return K2.pos.y + 3.6; }
  if (k == 3) { return K3.pos.y + 3.6; }
  if (k == 4) { return K4.pos.y + 3.6; }
  if (k == 5) { return K5.pos.y + 3.6; }
  return 0;
}
// плотность: ломаная по узлам, делённая на 20 (площадь ломаной в единицах экрана)
Function fx(x) {
  if (x < -7.5 || x > 7.5) { return 0; }
  float u = (x + 7.5) / 2.5; float k = min(floor(u), 5);
  return (hk(k) + (u - k) * (hk(k + 1) - hk(k))) / 20;
}

Update {
  if (abs(K1.pos.x - (-5)) > 0.0001) { K1.pos.x = -5; }
  if (K1.pos.y < -3.4) { K1.pos.y = -3.4; }
  if (abs(K2.pos.x - (-2.5)) > 0.0001) { K2.pos.x = -2.5; }
  if (K2.pos.y < -3.4) { K2.pos.y = -3.4; }
  if (abs(K3.pos.x - (0)) > 0.0001) { K3.pos.x = 0; }
  if (K3.pos.y < -3.4) { K3.pos.y = -3.4; }
  if (abs(K4.pos.x - (2.5)) > 0.0001) { K4.pos.x = 2.5; }
  if (K4.pos.y < -3.4) { K4.pos.y = -3.4; }
  if (abs(K5.pos.x - (5)) > 0.0001) { K5.pos.x = 5; }
  if (K5.pos.y < -3.4) { K5.pos.y = -3.4; }
  if (abs(X.pos.y + 3.6) > 0.0001) { X.pos.y = -3.6; }
  A = 2.5 * (hk(1) + hk(2) + hk(3) + hk(4) + hk(5));
  if (A < 0.01) { K1.pos.y = -3.6 + 0.8; K2.pos.y = -3.6 + 0.8; K3.pos.y = -3.6 + 0.8; K4.pos.y = -3.6 + 0.8; K5.pos.y = -3.6 + 0.8; A = 20; }
  if (abs(A - 20) > 0.001) {
    K1.pos.y = -3.6 + hk(1) * 20 / A;
    K2.pos.y = -3.6 + hk(2) * 20 / A;
    K3.pos.y = -3.6 + hk(3) * 20 / A;
    K4.pos.y = -3.6 + hk(4) * 20 / A;
    K5.pos.y = -3.6 + hk(5) * 20 / A;
  }
  float x0 = X.pos.x;
  if (key != 3 * K1.pos.y + 7 * K2.pos.y + 11 * K3.pos.y + 13 * K4.pos.y + 17 * K5.pos.y + 100 * x0 + 1000 * dx) {
    gax = newGraph(); gcur = newGraph(); gfill = newGraph(); gint = newGraph();
    addNode(gax, "a", [-8, -3.6]); addNode(gax, "b", [8, -3.6]); addEdge(gax, "a", "b");
    addNode(gcur, "s", [-7.5, -3.6]);
    repeat (7) { addNode(gcur, "k" + format(i, 0), [-7.5 + 2.5 * i, -3.6 + hk(i)]); }
    addNode(gcur, "e", [7.5, -3.6]);
    addEdge(gcur, "s", "k0"); repeat (6) { addEdge(gcur, "k" + format(i, 0), "k" + format(i + 1, 0)); } addEdge(gcur, "k6", "e");
    repeat (75) { float xx = -7.4 + i * 0.2; addNode(gfill, "u" + format(i, 0), [xx, -3.6]); addNode(gfill, "v" + format(i, 0), [xx, -3.6 + 20 * fx(xx)]); addEdge(gfill, "u" + format(i, 0), "v" + format(i, 0)); }
    float hi = min(x0 + dx, 7.5); float n = floor((hi - x0) / 0.1); pe = 0;
    repeat (n) { float xx = x0 + (i + 0.5) * 0.1; pe = pe + 0.1 * fx(xx); addNode(gint, "p" + format(i, 0), [xx, -3.6]); addNode(gint, "q" + format(i, 0), [xx, -3.6 + 20 * fx(xx)]); addEdge(gint, "p" + format(i, 0), "q" + format(i, 0)); }
    key = 3 * K1.pos.y + 7 * K2.pos.y + 11 * K3.pos.y + 13 * K4.pos.y + 17 * K5.pos.y + 100 * x0 + 1000 * dx;
  }
  info = "**Плотность распределения** f(x) — функция, площадь под графиком которой над любым отрезком равна вероятности попадания в него: P(a < X < b) = ∫ f(x) dx по [a; b]. Всегда f(x) ≥ 0, а полная площадь ∫ f(x) dx = 1 (здесь " + format(A / 20, 3) + ").\n\n";
  info = info + "Вероятностный смысл: P(x < X < x + Δx) ≈ f(x)·Δx. При x = " + num(x0, 2) + ", Δx = " + num(dx, 1) + ": f(x) = " + format(fx(x0), 3) + ", f(x)·Δx = " + format(fx(x0) * dx, 3) + ", а площадь закрашенной полосы (точное P) — " + format(pe, 3) + ". Чем уже полоса, тем точнее приближение.";
}
]
