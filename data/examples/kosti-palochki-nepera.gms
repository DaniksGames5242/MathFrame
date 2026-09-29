[
description = "{info}"

field width = 22;
field height = 9.5;
camera type = fixed;

// ---- Сверху — палочки, по одной на цифру множимого A; слева — цифры множителя B: в каждой строке берётся нужная
// грань палочек (кратное цифры). В клетке десятки — над диагональю, единицы — под ней. ----
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t00"; pos = (cx(0) - 0.42, cy(0) + 0.36); text = tn(rd(0), 0); size = 1; active = 0 < nA && 0 < nB }
draw Text { name = "u00"; pos = (cx(0) + 0.42, cy(0) - 0.36); text = un(rd(0), 0); size = 1; active = 0 < nA && 0 < nB }
draw Text { name = "t01"; pos = (cx(1) - 0.42, cy(0) + 0.36); text = tn(rd(0), 1); size = 1; active = 1 < nA && 0 < nB }
draw Text { name = "u01"; pos = (cx(1) + 0.42, cy(0) - 0.36); text = un(rd(0), 1); size = 1; active = 1 < nA && 0 < nB }
draw Text { name = "t02"; pos = (cx(2) - 0.42, cy(0) + 0.36); text = tn(rd(0), 2); size = 1; active = 2 < nA && 0 < nB }
draw Text { name = "u02"; pos = (cx(2) + 0.42, cy(0) - 0.36); text = un(rd(0), 2); size = 1; active = 2 < nA && 0 < nB }
draw Text { name = "t03"; pos = (cx(3) - 0.42, cy(0) + 0.36); text = tn(rd(0), 3); size = 1; active = 3 < nA && 0 < nB }
draw Text { name = "u03"; pos = (cx(3) + 0.42, cy(0) - 0.36); text = un(rd(0), 3); size = 1; active = 3 < nA && 0 < nB }
draw Text { name = "m0"; pos = (-8.2, cy(0)); text = format(rd(0), 0); size = 1.6; color = #f59e0b; active = 0 < nB }
draw Text { name = "p0"; pos = (3.6, cy(0) + 0.45); text = pl(0); size = 0.95; align = left; active = 0 < nB }
draw Text { name = "q0"; pos = (3.6, cy(0) - 0.45); text = dl(0); size = 0.85; align = left; active = 0 < nB }
draw Text { name = "t10"; pos = (cx(0) - 0.42, cy(1) + 0.36); text = tn(rd(1), 0); size = 1; active = 0 < nA && 1 < nB }
draw Text { name = "u10"; pos = (cx(0) + 0.42, cy(1) - 0.36); text = un(rd(1), 0); size = 1; active = 0 < nA && 1 < nB }
draw Text { name = "t11"; pos = (cx(1) - 0.42, cy(1) + 0.36); text = tn(rd(1), 1); size = 1; active = 1 < nA && 1 < nB }
draw Text { name = "u11"; pos = (cx(1) + 0.42, cy(1) - 0.36); text = un(rd(1), 1); size = 1; active = 1 < nA && 1 < nB }
draw Text { name = "t12"; pos = (cx(2) - 0.42, cy(1) + 0.36); text = tn(rd(1), 2); size = 1; active = 2 < nA && 1 < nB }
draw Text { name = "u12"; pos = (cx(2) + 0.42, cy(1) - 0.36); text = un(rd(1), 2); size = 1; active = 2 < nA && 1 < nB }
draw Text { name = "t13"; pos = (cx(3) - 0.42, cy(1) + 0.36); text = tn(rd(1), 3); size = 1; active = 3 < nA && 1 < nB }
draw Text { name = "u13"; pos = (cx(3) + 0.42, cy(1) - 0.36); text = un(rd(1), 3); size = 1; active = 3 < nA && 1 < nB }
draw Text { name = "m1"; pos = (-8.2, cy(1)); text = format(rd(1), 0); size = 1.6; color = #f59e0b; active = 1 < nB }
draw Text { name = "p1"; pos = (3.6, cy(1) + 0.45); text = pl(1); size = 0.95; align = left; active = 1 < nB }
draw Text { name = "q1"; pos = (3.6, cy(1) - 0.45); text = dl(1); size = 0.85; align = left; active = 1 < nB }
draw Text { name = "t20"; pos = (cx(0) - 0.42, cy(2) + 0.36); text = tn(rd(2), 0); size = 1; active = 0 < nA && 2 < nB }
draw Text { name = "u20"; pos = (cx(0) + 0.42, cy(2) - 0.36); text = un(rd(2), 0); size = 1; active = 0 < nA && 2 < nB }
draw Text { name = "t21"; pos = (cx(1) - 0.42, cy(2) + 0.36); text = tn(rd(2), 1); size = 1; active = 1 < nA && 2 < nB }
draw Text { name = "u21"; pos = (cx(1) + 0.42, cy(2) - 0.36); text = un(rd(2), 1); size = 1; active = 1 < nA && 2 < nB }
draw Text { name = "t22"; pos = (cx(2) - 0.42, cy(2) + 0.36); text = tn(rd(2), 2); size = 1; active = 2 < nA && 2 < nB }
draw Text { name = "u22"; pos = (cx(2) + 0.42, cy(2) - 0.36); text = un(rd(2), 2); size = 1; active = 2 < nA && 2 < nB }
draw Text { name = "t23"; pos = (cx(3) - 0.42, cy(2) + 0.36); text = tn(rd(2), 3); size = 1; active = 3 < nA && 2 < nB }
draw Text { name = "u23"; pos = (cx(3) + 0.42, cy(2) - 0.36); text = un(rd(2), 3); size = 1; active = 3 < nA && 2 < nB }
draw Text { name = "m2"; pos = (-8.2, cy(2)); text = format(rd(2), 0); size = 1.6; color = #f59e0b; active = 2 < nB }
draw Text { name = "p2"; pos = (3.6, cy(2) + 0.45); text = pl(2); size = 0.95; align = left; active = 2 < nB }
draw Text { name = "q2"; pos = (3.6, cy(2) - 0.45); text = dl(2); size = 0.85; align = left; active = 2 < nB }
draw Text { name = "h0"; pos = (cx(0), 4.2); text = format(ad(0), 0); size = 1.6; color = #3b82f6; active = 0 < nA }
draw Text { name = "h1"; pos = (cx(1), 4.2); text = format(ad(1), 0); size = 1.6; color = #3b82f6; active = 1 < nA }
draw Text { name = "h2"; pos = (cx(2), 4.2); text = format(ad(2), 0); size = 1.6; color = #3b82f6; active = 2 < nA }
draw Text { name = "h3"; pos = (cx(3), 4.2); text = format(ad(3), 0); size = 1.6; color = #3b82f6; active = 3 < nA }

new UI { name = "sA"; type = slider; label = "множимое A"; variable = A; min = 1; max = 9999; step = 1; default = 3907 }
new UI { name = "sB"; type = slider; label = "множитель B"; variable = B; min = 1; max = 999; step = 1; default = 246 }

// ---- Логика ----
float A = 3907; float B = 246; float nA = 4; float nB = 3; float key = -1; string info = "";

Function cx(j) { return -6 + 2 * j; }
Function cy(m) { return 2.6 - 2 * m; }
Function ad(j) { return floor(A / pow(10, nA - 1 - j)) - 10 * floor(A / pow(10, nA - j)); }
Function rd(m) { return floor(B / pow(10, nB - 1 - m)) - 10 * floor(B / pow(10, nB - m)); }
Function tn(d, j) { return format(floor(d * ad(j) / 10), 0); }
Function un(d, j) { return format(d * ad(j) - 10 * floor(d * ad(j) / 10), 0); }
Function pl(m) { return format(rd(m), 0) + " × " + format(A, 0) + " = " + format(rd(m) * A, 0); }
Function ds(m, k) { float d = rd(m); float s = 0; if (nA - 1 - k >= 0) { s = s + d * ad(nA - 1 - k) - 10 * floor(d * ad(nA - 1 - k) / 10); } if (nA - k < nA && nA - k >= 0) { s = s + floor(d * ad(nA - k) / 10); } return s; }
Function dl(m) { string s = "диагонали справа налево: "; repeat (nA + 1) { if (i > 0) { s = s + ", "; } s = s + format(ds(m, i), 0); } return s; }

Update {
  if (key != A * 1000 + B) {
    nA = 1; if (A >= 10) { nA = 2; } if (A >= 100) { nA = 3; } if (A >= 1000) { nA = 4; }
    nB = 1; if (B >= 10) { nB = 2; } if (B >= 100) { nB = 3; }
    gp = newGraph();
    repeat (nB) { float m = i; repeat (nA) { float j = i; string n = format(m, 0) + format(j, 0);
      float x = cx(j); float y = cy(m);
      addNode(gp, "a" + n, [x - 1, y + 1]); addNode(gp, "b" + n, [x + 1, y + 1]); addNode(gp, "c" + n, [x + 1, y - 1]); addNode(gp, "d" + n, [x - 1, y - 1]);
      addEdge(gp, "a" + n, "b" + n); addEdge(gp, "b" + n, "c" + n); addEdge(gp, "c" + n, "d" + n); addEdge(gp, "d" + n, "a" + n); addEdge(gp, "b" + n, "d" + n); } }
    info = "**" + format(A, 0) + " × " + format(B, 0) + " = " + format(A * B, 0) + ".** Палочки цифр множимого выложены рядом (цифры " + format(A, 0) + "); для каждой цифры множителя берётся строка с её кратными, суммы вдоль диагоналей (с переносом) дают частичное произведение.";
    string t = ""; repeat (nB) { if (i > 0) { t = t + " + "; } t = t + format(rd(i) * A, 0); if (nB - 1 - i > 0) { t = t + " · " + format(pow(10, nB - 1 - i), 0); } }
    info = info + "\n\nСложение частичных произведений со сдвигом по разрядам: " + t + " = " + format(A * B, 0) + ".";
    key = A * 1000 + B;
  }
}
]
