[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Таблица совместного распределения (X, Y): столбик в клетке (i, j) — вероятность P(X = i, Y = j),
// оранжевые — клетки события {X ≤ x, Y ≤ y}. Маргинальные распределения (сверху и справа) при
// движении ползунка t не меняются, а совместное меняется. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gMx"; graph = "gmx"; edgeColor = #22c55e; edgeWidth = 20; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Text { name = "lx"; pos = (2.9, -5.4); text = "X"; size = 0.95 }
draw Text { name = "ly"; pos = (-5.55, 3.4); text = "Y"; size = 0.95 }
draw Text { name = "c11"; pos = (cx(1), cy(1) + 0.95); text = format(pij(1, 1), 3); size = 0.85 }
draw Text { name = "c12"; pos = (cx(1), cy(2) + 0.95); text = format(pij(1, 2), 3); size = 0.85 }
draw Text { name = "c13"; pos = (cx(1), cy(3) + 0.95); text = format(pij(1, 3), 3); size = 0.85 }
draw Text { name = "c21"; pos = (cx(2), cy(1) + 0.95); text = format(pij(2, 1), 3); size = 0.85 }
draw Text { name = "c22"; pos = (cx(2), cy(2) + 0.95); text = format(pij(2, 2), 3); size = 0.85 }
draw Text { name = "c23"; pos = (cx(2), cy(3) + 0.95); text = format(pij(2, 3), 3); size = 0.85 }
draw Text { name = "c31"; pos = (cx(3), cy(1) + 0.95); text = format(pij(3, 1), 3); size = 0.85 }
draw Text { name = "c32"; pos = (cx(3), cy(2) + 0.95); text = format(pij(3, 2), 3); size = 0.85 }
draw Text { name = "c33"; pos = (cx(3), cy(3) + 0.95); text = format(pij(3, 3), 3); size = 0.85 }
draw Text { name = "mx1"; pos = (cx(1), 5.55); text = format(px1(1), 2); size = 0.85; align = center }
draw Text { name = "mx2"; pos = (cx(2), 5.55); text = format(px1(2), 2); size = 0.85; align = center }
draw Text { name = "mx3"; pos = (cx(3), 5.55); text = format(px1(3), 2); size = 0.85; align = center }
draw Text { name = "hx1"; pos = (cx(1), -5.4); text = "1"; size = 0.95 }
draw Text { name = "hx2"; pos = (cx(2), -5.4); text = "2"; size = 0.95 }
draw Text { name = "hx3"; pos = (cx(3), -5.4); text = "3"; size = 0.95 }
draw Text { name = "hy1"; pos = (-5.55, cy(1)); text = "1"; size = 0.95 }
draw Text { name = "hy2"; pos = (-5.55, cy(2)); text = "2"; size = 0.95 }
draw Text { name = "hy3"; pos = (-5.55, cy(3)); text = "3"; size = 0.95 }
draw Text { name = "my1"; pos = (3.4, cy(1) + 0.55); text = format(py1(1), 2); size = 0.85; align = left }
draw Text { name = "my2"; pos = (3.4, cy(2) + 0.55); text = format(py1(2), 2); size = 0.85; align = left }
draw Text { name = "my3"; pos = (3.4, cy(3) + 0.55); text = format(py1(3), 2); size = 0.85; align = left }

new UI { name = "sT"; type = slider; label = "зависимость t"; variable = tt; min = -1; max = 1; step = 0.05; default = 0.6 }
new UI { name = "sX"; type = slider; label = "x"; variable = xa; min = 1; max = 3; step = 1; default = 2 }
new UI { name = "sY"; type = slider; label = "y"; variable = ya; min = 1; max = 3; step = 1; default = 2 }

// ---- Логика ----
float tt = 0.6; float xa = 2; float ya = 2; float key = -1; string info = "";
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function cx(i) { return -3.8 + 2.6 * (i - 1); }
Function cy(j) { return -3.6 + 2.6 * (j - 1); }
Function pa(i) { if (i == 1) { return 0.2; } if (i == 2) { return 0.5; } return 0.3; }
Function pb(j) { if (j == 1) { return 0.4; } if (j == 2) { return 0.35; } return 0.25; }
Function uv(i) { if (i == 1) { return 1; } if (i == 3) { return -1; } return 0; }
Function pij(i, j) { return pa(i) * pb(j) + tt * 0.05 * uv(i) * uv(j); }
Function px1(i) { return pij(i, 1) + pij(i, 2) + pij(i, 3); }
Function py1(j) { return pij(1, j) + pij(2, j) + pij(3, j); }

Update {
  if (key != tt * 100 + xa * 10 + ya) {
    gg = newGraph(); gb = newGraph(); ga = newGraph(); gmx = newGraph();
    repeat (4) {
      string s = format(i, 0);
      addNode(gg, "v" + s, [cx(1) - 1.3 + 2.6 * i, cy(1) - 1.3]); addNode(gg, "w" + s, [cx(1) - 1.3 + 2.6 * i, cy(3) + 1.3]); addEdge(gg, "v" + s, "w" + s);
      addNode(gg, "h" + s, [cx(1) - 1.3, cy(1) - 1.3 + 2.6 * i]); addNode(gg, "k" + s, [cx(3) + 1.3, cy(1) - 1.3 + 2.6 * i]); addEdge(gg, "h" + s, "k" + s);
    }
    float fxy = 0;
    repeat (9) {
      float ii = floor(i / 3) + 1; float jj = i - 3 * floor(i / 3) + 1; string s = format(i, 0);
      float bx = cx(ii); float by = cy(jj) - 1.1;
      if (ii <= xa && jj <= ya) { fxy = fxy + pij(ii, jj); addNode(ga, "a" + s, [bx, by]); addNode(ga, "b" + s, [bx, by + 6 * pij(ii, jj)]); addEdge(ga, "a" + s, "b" + s); }
      if (ii > xa || jj > ya) { addNode(gb, "a" + s, [bx, by]); addNode(gb, "b" + s, [bx, by + 6 * pij(ii, jj)]); addEdge(gb, "a" + s, "b" + s); }
    }
    repeat (3) {
      string s = format(i, 0);
      addNode(gmx, "a" + s, [cx(i + 1), 3.1]); addNode(gmx, "b" + s, [cx(i + 1), 3.1 + 0.3 + 3.4 * px1(i + 1)]); addEdge(gmx, "a" + s, "b" + s);
      addNode(gmx, "c" + s, [3.1, cy(i + 1) - 0.35]); addNode(gmx, "d" + s, [3.1 + 1 + 8 * py1(i + 1), cy(i + 1) - 0.35]); addEdge(gmx, "c" + s, "d" + s);
    }
    float mxx = 0; float myy = 0; float exy = 0;
    repeat (9) { float ii = floor(i / 3) + 1; float jj = i - 3 * floor(i / 3) + 1; mxx = mxx + ii * pij(ii, jj); myy = myy + jj * pij(ii, jj); exy = exy + ii * jj * pij(ii, jj); }
    info = "**Совместное распределение** пары (X, Y) задаёт вероятности P(X = i, Y = j) для всех сочетаний значений сразу (таблица, сумма всех клеток равна 1). Функция распределения F(x, y) = P(X ≤ x, Y ≤ y) — сумма оранжевых клеток: F(" + format(xa, 0) + ", " + format(ya, 0) + ") = " + format(fxy, 3) + ".\n\n";
    info = info + "**Маргинальные распределения** — суммы по строкам и столбцам: P(X = i) = ∑ⱼ P(X = i, Y = j) (зелёные столбики сверху), P(Y = j) = ∑ᵢ P(X = i, Y = j) (справа). Они не зависят от t, а совместное — зависит: по двум маргинальным восстановить его невозможно.\n\n";
    info = info + "**Связь X и Y** целиком содержится в совместном распределении: cov(X, Y) = E[XY] − E[X]·E[Y] = " + format(exy, 3) + " − " + format(mxx, 2) + "·" + format(myy, 2) + " = " + num(exy - mxx * myy, 3) + ". При t = 0 таблица равна произведению маргинальных.";
    key = tt * 100 + xa * 10 + ya;
  }
}
]
