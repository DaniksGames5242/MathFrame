[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь наблюдений (xᵢ, yᵢ). Каждая из 28 пар точек — отрезок: синий, если пара согласована (порядок по x и по y одинаков),
// оранжевый, если несогласована. τ = (C − D) / (n(n − 1)/2). ----
new Point { name = "P1"; pos = (-5.5, -2.2); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, 1.8); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, -0.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, 2.6); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, -1.4); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 0.9); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 3.1); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, -0.3); pauseOnDrag = false }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f6aa; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0baa; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gK"; graph = "gk"; edgeColor = #22c55e; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "s0"; pos = (0, -4.05); text = "0"; size = 0.8 }
draw Text { name = "s1"; pos = (6, -4.05); text = "1"; size = 0.8 }
draw Text { name = "s2"; pos = (-6, -4.05); text = "−1"; size = 0.8 }
draw Text { name = "s3"; pos = (-7.6, -4.6); text = "τ"; size = 0.9; align = left }

// ---- Логика ----
float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function sg(a, b) { if (a > b) { return 1; } if (a < b) { return -1; } return 0; }
Function cx(a, b) { return sg(px(a), px(b)) * sg(py(a), py(b)); }

Update {
  float k2 = 0; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    gc = newGraph(); gd = newGraph(); gk = newGraph(); ga = newGraph();
    float nc = 0; float nd = 0;
    repeat (8) { addNode(gc, "n" + format(i, 0), [px(i), py(i)]); addNode(gd, "n" + format(i, 0), [px(i), py(i)]); }
    repeat (7) { float a = i; repeat (7) { float b = i + 1; if (b > a) { float c = cx(a, b); if (c > 0) { nc = nc + 1; addEdge(gc, "n" + format(a, 0), "n" + format(b, 0)); } if (c < 0) { nd = nd + 1; addEdge(gd, "n" + format(a, 0), "n" + format(b, 0)); } } } }
    float tau = (nc - nd) / 28;
    addNode(ga, "r1", [-6, -4.6]); addNode(ga, "r2", [6, -4.6]); addEdge(ga, "r1", "r2");
    addNode(ga, "t1", [-6, -4.4]); addNode(ga, "t2", [-6, -4.8]); addEdge(ga, "t1", "t2");
    addNode(ga, "t3", [0, -4.4]); addNode(ga, "t4", [0, -4.8]); addEdge(ga, "t3", "t4");
    addNode(ga, "t5", [6, -4.4]); addNode(ga, "t6", [6, -4.8]); addEdge(ga, "t5", "t6");
    addNode(gk, "k1", [6 * tau, -4.85]); addNode(gk, "k2", [6 * tau, -4.35]); addEdge(gk, "k1", "k2");
    info = "**Пары.** Из n = 8 наблюдений получается n(n − 1)/2 = 28 пар. Согласованных (синие): C = " + format(nc, 0) + ", несогласованных (оранжевые): D = " + format(nd, 0) + ".\n\n";
    info = info + "**τ = (C − D) / 28 = (" + format(nc, 0) + " − " + format(nd, 0) + ") / 28 = " + num(tau, 3) + "**";
    if (nd == 0) { info = info + " — все пары согласованы: y монотонно возрастает вместе с x."; }
    if (nc == 0) { info = info + " — все пары несогласованы: y монотонно убывает при росте x."; }
    info = info + "\n\n";
    info = info + "**Вероятностный смысл:** доля согласованных пар " + format(nc / 28, 3) + ", несогласованных " + format(nd / 28, 3) + "; τ — их разность. При независимости ожидаемое значение равно 0, а дисперсия равна 2(2n + 5)/(9n(n − 1)) = " + format(42 / 504, 4) + ".";
  }
}
]
