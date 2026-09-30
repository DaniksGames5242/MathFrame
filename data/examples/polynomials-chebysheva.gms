[
description = "{info}"

field width = 2.6;
field height = 2.6;
camera type = fixed;

// ---- График Tₙ(x) на [−1; 1]: значения не выходят за ±1 и достигают их в n + 1 точках (оранжевые);
// n корней cos((2k − 1)π / 2n) — зелёные. Точка Q ведётся по графику. ----
float n = 4; float key = -1; float xq = 0.3; string info = "";
list ca = [1,0,0,0,0,0,0,0,0,0];
list cb = [0,1,0,0,0,0,0,0,0,0];
list cc = [0,0,0,0,0,0,0,0,0,0];

Function T(m, x) {
  float a = 1; float b = x;
  if (m < 0.5) { return 1; }
  repeat (m - 1) { float c = 2 * x * b - a; a = b; b = c; }
  return b;
}
Function Tn(x) { return T(n, x); }
draw Function { name = "gr"; f = "Tn"; xmin = -1.3; xmax = 1.3; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gRoot"; graph = "groot"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gExt"; graph = "gext"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 8 }
new Point { name = "Q"; pos = (0.3, 0.3); pauseOnDrag = false; color = #3b82f6 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = 8; step = 1; default = 4 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function sup(k) {
  if (k == 2) { return "²"; } if (k == 3) { return "³"; } if (k == 4) { return "⁴"; } if (k == 5) { return "⁵"; }
  if (k == 6) { return "⁶"; } if (k == 7) { return "⁷"; } return "⁸";
}
Function isn(k) { if (abs(k - n) < 0.5) { return 1; } return 0; }
Function mono(c, k, first) {
  float a = abs(c);
  if (a < 0.5) { return ""; }
  string s = " + "; if (c < 0) { s = " − "; }
  if (first > 0.5) { s = ""; if (c < 0) { s = "−"; } }
  string co = ""; if (k == 0 || a > 1.5) { co = format(a, 0); }
  string v = ""; if (k == 1) { v = "x"; } if (k > 1.5) { v = "x" + sup(k); }
  return s + co + v;
}

Update {
  if (abs(Q.pos.x) > 1.25) { Q.pos.x = 1.25 * sign(Q.pos.x); }
  float ty = Tn(Q.pos.x);
  if (abs(Q.pos.y - ty) > 0.0001) { Q.pos.y = ty; }
  float x0 = Q.pos.x;
  if (key != n) {
    groot = newGraph(); gext = newGraph();
    repeat (n) { addNode(groot, "r" + format(i, 0), [cos((2 * i + 1) * pi / (2 * n)), 0]); }
    repeat (n + 1) { float sg = 1; if (i - 2 * floor(i / 2) > 0.5) { sg = -1; } addNode(gext, "e" + format(i, 0), [cos(i * pi / n), sg]); }
    key = n;
  }
  // коэффициенты по рекуррентному соотношению Tₖ₊₁ = 2x·Tₖ − Tₖ₋₁
  repeat (10) { ca[i] = 0; cb[i] = 0; } ca[0] = 1; cb[1] = 1;
  repeat (n - 1) {
    repeat (10) { float k = i; float sh = 0; if (k > 0.5) { sh = cb[k - 1]; } cc[k] = 2 * sh - ca[k]; }
    repeat (10) { ca[i] = cb[i]; cb[i] = cc[i]; }
  }
  string poly = "";
  repeat (9) { float k = n - i; if (k > -0.5) { poly = poly + mono(cb[k], k, isn(k)); } }
  info = "**Многочлены Чебышёва:** T₀ = 1, T₁ = x, Tₖ₊₁ = 2x·Tₖ − Tₖ₋₁. При n = " + format(n, 0) + ": Tₙ(x) = " + poly + ".\n\n";
  info = info + "**В точке x = " + num(x0, 3) + ":** Tₙ(x) = " + num(ty, 4);
  if (abs(x0) <= 1) { info = info + ", а cos(n·arccos x) = " + num(cos(n * acos(x0)), 4) + " — то же число."; } else { info = info + "; вне отрезка [−1; 1] значения быстро растут."; }
  info = info + "\n\nНа [−1; 1] всегда |Tₙ| ≤ 1, и значения ±1 достигаются ровно в n + 1 точках cos(kπ/n) (оранжевые), чередуясь по знаку. Корни (зелёные) вещественны, просты и лежат в (−1; 1): x = cos((2k − 1)π/2n), k = 1…n.";
}
]
