[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Шесть исходов ω₁…ω₆ с вероятностями pₖ (написаны под столбиками). В каждом исходе величина X (синяя)
// и величина Y (жёлтая) принимают значения, которые задают перетаскиваемые точки. Горизонтальные линии —
// E(X), E(Y) и E(aX + bY). ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gY"; graph = "gy"; edgeColor = #f59e0b; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gEX"; graph = "gex"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gEY"; graph = "gey"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gEZ"; graph = "gez"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 21 }
draw Text { name = "lx"; pos = (-7.7, 4.6); text = "X"; size = 1; align = left; color = #3b82f6 }
draw Text { name = "ly"; pos = (-6.9, 4.6); text = "Y"; size = 1; align = left; color = #f59e0b }
draw Text { name = "lz"; pos = (-6.1, 4.6); text = "aX + bY"; size = 1; align = left; color = #22c55e }
draw Text { name = "p0"; pos = (-6.5, -4.6); text = "ω₁  p = 0.10"; size = 0.85 }
draw Text { name = "p1"; pos = (-3.9, -4.6); text = "ω₂  p = 0.20"; size = 0.85 }
draw Text { name = "p2"; pos = (-1.3, -4.6); text = "ω₃  p = 0.25"; size = 0.85 }
draw Text { name = "p3"; pos = (1.3, -4.6); text = "ω₄  p = 0.20"; size = 0.85 }
draw Text { name = "p4"; pos = (3.9, -4.6); text = "ω₅  p = 0.15"; size = 0.85 }
draw Text { name = "p5"; pos = (6.5, -4.6); text = "ω₆  p = 0.10"; size = 0.85 }
new Point { name = "X0"; pos = (-7.05, 2.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y0"; pos = (-5.95, 1.0); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "X1"; pos = (-4.45, -1.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y1"; pos = (-3.3499999999999996, -2.0); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "X2"; pos = (-1.85, 1.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y2"; pos = (-0.75, 2.0); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "X3"; pos = (0.75, 3.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y3"; pos = (1.85, 1.0); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "X4"; pos = (3.3499999999999996, -2.0); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y4"; pos = (4.45, -1.0); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "X5"; pos = (5.95, 0.5); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Y5"; pos = (7.05, 2.5); pauseOnDrag = false; collision = false; color = #f59e0b }

new UI { type = slider; label = "a"; variable = ka; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = kb; min = -2; max = 2; step = 0.1; default = 1 }

float ka = 1; float kb = 1; float key = -1; string info = "";
float EX = 0; float EY = 0; float EZ = 0; float bad = 0;

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function pr(k) { if (k == 0) { return 0.1; } if (k == 1) { return 0.2; } if (k == 2) { return 0.25; } if (k == 3) { return 0.2; } if (k == 4) { return 0.15; } return 0.1; }
Function vx(k) {
  if (k == 0) { return X0.pos.y; }
  if (k == 1) { return X1.pos.y; }
  if (k == 2) { return X2.pos.y; }
  if (k == 3) { return X3.pos.y; }
  if (k == 4) { return X4.pos.y; }
  return X5.pos.y;
}
Function vy(k) {
  if (k == 0) { return Y0.pos.y; }
  if (k == 1) { return Y1.pos.y; }
  if (k == 2) { return Y2.pos.y; }
  if (k == 3) { return Y3.pos.y; }
  if (k == 4) { return Y4.pos.y; }
  return Y5.pos.y;
}

Update {
  if (abs(X0.pos.x - (-7.05)) > 0.0001) { X0.pos.x = -7.05; }
  if (abs(Y0.pos.x - (-5.95)) > 0.0001) { Y0.pos.x = -5.95; }
  if (abs(X1.pos.x - (-4.45)) > 0.0001) { X1.pos.x = -4.45; }
  if (abs(Y1.pos.x - (-3.3499999999999996)) > 0.0001) { Y1.pos.x = -3.3499999999999996; }
  if (abs(X2.pos.x - (-1.85)) > 0.0001) { X2.pos.x = -1.85; }
  if (abs(Y2.pos.x - (-0.75)) > 0.0001) { Y2.pos.x = -0.75; }
  if (abs(X3.pos.x - (0.75)) > 0.0001) { X3.pos.x = 0.75; }
  if (abs(Y3.pos.x - (1.85)) > 0.0001) { Y3.pos.x = 1.85; }
  if (abs(X4.pos.x - (3.3499999999999996)) > 0.0001) { X4.pos.x = 3.3499999999999996; }
  if (abs(Y4.pos.x - (4.45)) > 0.0001) { Y4.pos.x = 4.45; }
  if (abs(X5.pos.x - (5.95)) > 0.0001) { X5.pos.x = 5.95; }
  if (abs(Y5.pos.x - (7.05)) > 0.0001) { Y5.pos.x = 7.05; }
  float sx = 0; float sy = 0; repeat (6) { sx = sx + (i + 1) * vx(i); sy = sy + (i + 2) * vy(i); }
  if (key != sx + 100 * sy + 10000 * ka + 100000 * kb) {
    gax = newGraph(); gx = newGraph(); gy = newGraph(); gex = newGraph(); gey = newGraph(); gez = newGraph();
    addNode(gax, "a", [-8, 0]); addNode(gax, "b", [8, 0]); addEdge(gax, "a", "b");
    EX = 0; EY = 0; bad = 0;
    repeat (6) {
      float c = -6.5 + 2.6 * i;
      addNode(gx, "p" + format(i, 0), [c - 0.55, 0]); addNode(gx, "q" + format(i, 0), [c - 0.55, vx(i)]); addEdge(gx, "p" + format(i, 0), "q" + format(i, 0));
      addNode(gy, "p" + format(i, 0), [c + 0.55, 0]); addNode(gy, "q" + format(i, 0), [c + 0.55, vy(i)]); addEdge(gy, "p" + format(i, 0), "q" + format(i, 0));
      EX = EX + pr(i) * vx(i); EY = EY + pr(i) * vy(i);
      if (vx(i) > vy(i) + 0.0001) { bad = bad + 1; }
    }
    EZ = 0; repeat (6) { EZ = EZ + pr(i) * (ka * vx(i) + kb * vy(i)); }
    addNode(gex, "a", [-8, EX]); addNode(gex, "b", [8, EX]); addEdge(gex, "a", "b");
    addNode(gey, "a", [-8, EY]); addNode(gey, "b", [8, EY]); addEdge(gey, "a", "b");
    float zc = max(-4.9, min(4.9, EZ)); addNode(gez, "a", [-8, zc]); addNode(gez, "b", [8, zc]); addEdge(gez, "a", "b");
    key = sx + 100 * sy + 10000 * ka + 100000 * kb;
  }
  info = "**Математическое ожидание** E(X) = Σ pₖ·X(ωₖ) — среднее значение с весами-вероятностями. Здесь E(X) = " + num(EX, 3) + " (синяя линия), E(Y) = " + num(EY, 3) + " (жёлтая).\n\n";
  info = info + "**Линейность** (независимость не нужна): E(aX + bY) = a·E(X) + b·E(Y) = " + num(ka, 1) + "·" + num(EX, 3) + " + " + num(kb, 1) + "·" + num(EY, 3) + " = " + num(ka * EX + kb * EY, 3) + " — совпадает с E(aX + bY) = " + num(EZ, 3) + " (зелёная линия), посчитанным по исходам. Для постоянной c: E(c) = c.\n\n";
  if (bad < 0.5) { info = info + "**Монотонность:** X ≤ Y во всех исходах, значит E(X) ≤ E(Y): " + num(EX, 3) + " ≤ " + num(EY, 3) + "."; }
  else { info = info + "**Монотонность:** X ≤ Y выполнено не во всех исходах (X > Y в " + format(bad, 0) + " из 6), поэтому неравенство E(X) ≤ E(Y) не гарантировано."; }
}
]
