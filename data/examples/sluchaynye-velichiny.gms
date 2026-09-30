[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Ω — 36 исходов броска двух костей (a; b). Точка ω выбирает исход, случайная
// величина X ставит ему число X(ω). Справа — распределение X: столбик значения v —
// доля исходов прообраза X⁻¹(v). ----
string sx = "sum"; float key = -1; string info = "";
new Point { name = "W"; pos = (-5.6, -1.8); pauseOnDrag = false; collideWithPoints = false }
draw Graph { name = "vC"; graph = "gC"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "vP"; graph = "gP"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "vB"; graph = "gB"; edgeColor = #3b82f6; edgeWidth = 24; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vO"; graph = "gO"; edgeColor = #f59e0b; edgeWidth = 24; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "vX"; graph = "gX"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.6, 3.5); text = "Ω (a — по горизонтали, b — по вертикали)"; size = 0.9; align = left }
draw Text { name = "t2"; pos = (-0.8, 5.5); text = "P(X = v)"; size = 0.9; align = left }
new UI { name = "sX"; type = select; label = "X(ω)"; variable = sx; options = ("sum", "max", "dif"); labels = ("a + b", "max(a; b)", "|a − b|"); default = "sum" }

Function xv(a, b) {
  if (sx == "sum") { return a + b; }
  if (sx == "max") { return max(a, b); }
  return abs(a - b);
}
Function vmin() { if (sx == "sum") { return 2; } if (sx == "max") { return 1; } return 0; }
Function nv() { if (sx == "sum") { return 11; } if (sx == "max") { return 6; } return 6; }
Function cnt(v) { float c = 0; repeat (36) { float a = floor(i / 6) + 1; float b = i - 6 * floor(i / 6) + 1; if (abs(xv(a, b) - v) < 0.1) { c = c + 1; } } return c; }
Function cx(a) { return -9.0 + 1.2 * (a - 1); }
Function cy(b) { return -4.2 + 1.2 * (b - 1); }
Function bx(v) { return -1.2 + 0.945 * (v - vmin() + 0.5 + (11 - nv()) / 2); }

Update {
  float a = min(max(round((W.pos.x + 9.0) / 1.2) + 1, 1), 6);
  float b = min(max(round((W.pos.y + 4.2) / 1.2) + 1, 1), 6);
  if (abs(W.pos.x - cx(a)) > 0.0001 || abs(W.pos.y - cy(b)) > 0.0001) { W.pos.x = cx(a); W.pos.y = cy(b); }
  float x0 = xv(a, b);
  float ck = a * 100 + b * 10 + vmin() + nv();
  gC = newGraph(); gP = newGraph(); gB = newGraph(); gO = newGraph(); gX = newGraph(); gL = newGraph();
  addNode(gX, "u", [-0.9, -4.4]); addNode(gX, "w", [9.6, -4.4]); addEdge(gX, "u", "w");
  float cm = 1; repeat (nv()) { cm = max(cm, cnt(vmin() + i)); }
  repeat (36) {
    float a1 = floor(i / 6) + 1; float b1 = i - 6 * floor(i / 6) + 1;
    addNode(gC, "c" + format(i, 0), [cx(a1), cy(b1)]);
    if (abs(xv(a1, b1) - x0) < 0.1) { addNode(gP, "c" + format(i, 0), [cx(a1), cy(b1)]); }
  }
  repeat (nv()) {
    float v = vmin() + i; float c = cnt(v); string vs = format(v, 0);
    addNode(gL, "l" + vs, [bx(v), -5.0], vs);
    string g1 = "b" + vs;
    if (abs(v - x0) < 0.1) { addNode(gO, "p" + vs, [bx(v), -4.4]); addNode(gO, "q" + vs, [bx(v), -4.4 + 9.2 * c / cm / 1.15]); addEdge(gO, "p" + vs, "q" + vs); }
    else { addNode(gB, "p" + vs, [bx(v), -4.4]); addNode(gB, "q" + vs, [bx(v), -4.4 + 9.2 * c / cm / 1.15]); addEdge(gB, "p" + vs, "q" + vs); }
  }
  string nm = "a + b"; if (sx == "max") { nm = "max(a; b)"; } if (sx == "dif") { nm = "|a − b|"; }
  info = "**Случайная величина** — функция X: Ω → ℝ, которая каждому исходу ω случайного эксперимента ставит число X(ω). Здесь Ω — 36 исходов броска двух костей, X = " + nm + ".\n\n"
    + "Исход ω = (" + format(a, 0) + "; " + format(b, 0) + "), X(ω) = **" + format(x0, 0) + "**. Прообраз X⁻¹({" + format(x0, 0) + "}) — исходы с таким значением (жёлтые): их **" + format(cnt(x0), 0) + "**, поэтому P(X = " + format(x0, 0) + ") = " + format(cnt(x0), 0) + "/36 ≈ " + format(cnt(x0) / 36, 3) + ". Так X переносит вероятность с Ω на числовую прямую — это и есть распределение X.";
}
]
