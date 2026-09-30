[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — плотность f, на оси точки a и b; закрашена площадь между ними.
// Снизу — функция распределения F(x) = P(X ≤ x): её приращение между a и b равно этой площади. ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gFill"; graph = "gfill"; edgeColor = #3b82f6; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMk"; graph = "gmk"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "lf"; pos = (-7.6, 4.5); text = "y = f(x)"; size = 1; align = left }
draw Text { name = "lF"; pos = (-7.6, -0.6); text = "y = F(x)"; size = 1; align = left }
draw Text { name = "l1"; pos = (7.6, -1.05); text = "1"; size = 0.8; align = right }
draw Text { name = "l0"; pos = (7.6, -4.75); text = "0"; size = 0.8; align = right }
new Point { name = "A"; pos = (-2, 0.9); text = true("a"); pauseOnDrag = false; collision = false }
new Point { name = "B"; pos = (2, 0.9); text = true("b"); pauseOnDrag = false; collision = false }
new Point { name = "FA"; pos = (-2, -4.4); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "FB"; pos = (2, -4.4); dynamic = false; collision = false; color = #f59e0b }

new UI { type = select; label = "распределение"; variable = dist; options = ("mix", "exp", "uni"); labels = ("смесь двух нормальных", "показательное", "равномерное"); default = "mix" }

string dist = "mix"; string info = ""; list Fc = [0]; float kd = -1; float kf = -1; float sy = 6; float pab = 0;

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function gauss(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066282746); }
Function dens(x) {
  if (dist == "exp") { if (x < -4.05) { return 0; } return 0.6 * exp(-0.6 * (x + 4.05)); }
  if (dist == "uni") { if (x < -3.05 || x > 4.05) { return 0; } return 1 / 7.1; }
  return 0.7 * gauss(x, -1, 1.2) + 0.3 * gauss(x, 2.5, 0.9);
}
Function cdf(x) {
  if (len(Fc) < 161 || x <= -8) { return 0; } if (x >= 8) { return 1; }
  float u = (x + 8) * 10; float k = floor(u);
  return Fc[k] + (u - k) * (Fc[k + 1] - Fc[k]);
}
Function yf(x) { return 0.9 + sy * dens(x); }
Function yF(x) { return -4.4 + 3.4 * cdf(x); }

Update {
  if (abs(A.pos.y - 0.9) > 0.0001) { A.pos.y = 0.9; }
  if (abs(B.pos.y - 0.9) > 0.0001) { B.pos.y = 0.9; }
  if (len(Fc) < 161) { repeat (160) { push(Fc, 0); } }
  string dk = dist + format(len(Fc), 0);
  if (dk != kd) {
    float s = 0; float mx = 0;
    repeat (160) { s = s + 0.05 * (dens(-8 + i * 0.1) + dens(-7.9 + i * 0.1)); Fc[i + 1] = s; mx = max(mx, dens(-8 + i * 0.1)); }
    repeat (160) { Fc[i + 1] = Fc[i + 1] / s; }
    sy = 3.2 / mx;
    gax = newGraph(); gf = newGraph(); gd = newGraph();
    addNode(gax, "a", [-8, 0.9]); addNode(gax, "b", [8, 0.9]); addEdge(gax, "a", "b");
    addNode(gax, "c", [-8, -4.4]); addNode(gax, "d", [8, -4.4]); addEdge(gax, "c", "d");
    addNode(gax, "e", [-8, -1]); addNode(gax, "g", [8, -1]); addEdge(gax, "e", "g");
    repeat (161) { addNode(gf, "p" + format(i, 0), [-8 + i * 0.1, yF(-8 + i * 0.1)]); }
    repeat (160) { addEdge(gf, "p" + format(i, 0), "p" + format(i + 1, 0)); }
    repeat (161) { addNode(gd, "p" + format(i, 0), [-8 + i * 0.1, yf(-8 + i * 0.1)]); }
    repeat (160) { addEdge(gd, "p" + format(i, 0), "p" + format(i + 1, 0)); }
    gfill = newGraph(); gmk = newGraph();
    kd = dk; kf = -1;
  }
  float lo = min(A.pos.x, B.pos.x); float hi = max(A.pos.x, B.pos.x);
  if (kf != lo * 1000 + hi) {
    gfill = newGraph(); gmk = newGraph();
    float n = floor((hi - lo) / 0.1);
    repeat (n) { float xx = lo + (i + 0.5) * 0.1; addNode(gfill, "u" + format(i, 0), [xx, 0.9]); addNode(gfill, "v" + format(i, 0), [xx, yf(xx)]); addEdge(gfill, "u" + format(i, 0), "v" + format(i, 0)); }
    addNode(gmk, "m", [lo, yF(lo)]); addNode(gmk, "n", [hi, yF(lo)]); addEdge(gmk, "m", "n");
    addNode(gmk, "o", [hi, yF(hi)]); addEdge(gmk, "n", "o");
    FA.pos.x = A.pos.x; FA.pos.y = yF(A.pos.x); FB.pos.x = B.pos.x; FB.pos.y = yF(B.pos.x);
    pab = cdf(hi) - cdf(lo);
    kf = lo * 1000 + hi;
  }
  info = "**Функция распределения** F(x) = P(X ≤ x) — вероятность того, что величина не превосходит x; это площадь под плотностью слева от x. F не убывает, F(−∞) = 0, F(+∞) = 1, а у непрерывной величины она ещё и непрерывна: скачков нет, а F′(x) = f(x).\n\n";
  info = info + "F(a) = " + format(cdf(A.pos.x), 3) + ", F(b) = " + format(cdf(B.pos.x), 3) + ", поэтому P(" + num(lo, 2) + " < X ≤ " + num(hi, 2) + ") = F(b) − F(a) = " + format(pab, 3) + " — закрашенная площадь.";
}
]
