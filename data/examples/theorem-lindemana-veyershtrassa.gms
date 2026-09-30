[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — плоскость чисел z = r·α, справа — плоскость значений exp(z) (масштаб 0,7).
// Жёлтая линия справа — образ отрезка [0; z] под действием экспоненты. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gCv"; graph = "gc"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Text { name = "tz"; pos = (-7.7, 4.5); text = "z = r·α"; size = 1; align = left }
draw Text { name = "tw"; pos = (0.7, 4.5); text = "exp(z)"; size = 1; align = left }
new Point { name = "Z"; pos = (-4.2, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "W"; pos = (4.2, 0); dynamic = false; collision = false; color = #f59e0b }

new UI { name = "sA"; type = select; label = "α"; variable = sel; options = (1, 2, 3, 4, 5, 6, 7, 8); labels = ("1", "√2", "i", "(1 + √5)/2", "1 + i", "0", "iπ", "ln 2"); default = 2 }
new UI { name = "sR"; type = slider; label = "r"; variable = r; min = -1; max = 1; step = 0.25; default = 1 }

float sel = 2; float r = 1; float key = -1; string info = "";

Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Function are(k) { if (k == 1) { return 1; } if (k == 2) { return sqrt(2); } if (k == 3) { return 0; } if (k == 4) { return (1 + sqrt(5)) / 2; } if (k == 5) { return 1; } if (k == 6) { return 0; } if (k == 7) { return 0; } return log(2); }
Function aim(k) { if (k == 3) { return 1; } if (k == 5) { return 1; } if (k == 7) { return 3.14159265; } return 0; }
Function isAlg(k) { if (k >= 7) { return 0; } return 1; }
Function cpx(x, y) { string s = num(x, 3); if (abs(y) < 0.0005) { return s; } if (y < 0) { return s + " − " + num(-y, 3) + "·i"; } return s + " + " + num(y, 3) + "·i"; }

Update {
  if (key < 0) {
    gx = newGraph();
    addNode(gx, "a1", [-7.8, 0]); addNode(gx, "a2", [-0.6, 0]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [-4.2, -4.4]); addNode(gx, "b2", [-4.2, 4.4]); addEdge(gx, "b1", "b2");
    addNode(gx, "c1", [0.6, 0]); addNode(gx, "c2", [7.8, 0]); addEdge(gx, "c1", "c2");
    addNode(gx, "d1", [4.2, -4.4]); addNode(gx, "d2", [4.2, 4.4]); addEdge(gx, "d1", "d2");
    repeat (7) { addNode(gx, "x" + format(i, 0), [-4.2 + i - 3, -0.15]); addNode(gx, "X" + format(i, 0), [-4.2 + i - 3, 0.15]); addEdge(gx, "x" + format(i, 0), "X" + format(i, 0)); }
    repeat (7) { addNode(gx, "y" + format(i, 0), [-4.35, i - 3]); addNode(gx, "Y" + format(i, 0), [-4.05, i - 3]); addEdge(gx, "y" + format(i, 0), "Y" + format(i, 0)); }
    // единичная окружность в плоскости e^z
    repeat (49) { addNode(gx, "k" + format(i, 0), [4.2 + 0.7 * cos(i * 0.1309), 0.7 * sin(i * 0.1309)]); }
    repeat (48) { addEdge(gx, "k" + format(i, 0), "k" + format(i + 1, 0)); }
  }
  float k2 = sel * 100 + r * 4 + 10;
  if (k2 != key) {
    key = k2;
    gc = newGraph();
    float zr = r * are(sel); float zi = r * aim(sel);
    addNode(gc, "z0", [-4.2, 0]); addNode(gc, "z1", [-4.2 + zr, zi]); addEdge(gc, "z0", "z1", 1, "#f59e0b");
    repeat (41) {
      float s = i / 40;
      addNode(gc, "w" + format(i, 0), [4.2 + 0.7 * exp(s * zr) * cos(s * zi), 0.7 * exp(s * zr) * sin(s * zi)]);
    }
    repeat (40) { addEdge(gc, "w" + format(i, 0), "w" + format(i + 1, 0), 1, "#f59e0b"); }
    Z.pos.x = -4.2 + zr; Z.pos.y = zi;
    float wr = exp(zr) * cos(zi); float wi = exp(zr) * sin(zi);
    W.pos.x = 4.2 + 0.7 * wr; W.pos.y = 0.7 * wi;
    string s2 = "**Теорема Линдемана — Вейерштрасса:** если α₁, …, αₙ — алгебраические числа, линейно независимые над ℚ, то exp(α₁), …, exp(αₙ) алгебраически независимы над ℚ. При n = 1: для алгебраического α ≠ 0 число exp(α) трансцендентно.\n\n";
    s2 = s2 + "z = r·α = " + cpx(zr, zi) + ", exp(z) = " + cpx(wr, wi) + ".\n\n";
    if (isAlg(sel) == 1 && r != 0 && sel != 6) { s2 = s2 + "z — ненулевое алгебраическое число (рациональное кратное алгебраического), поэтому **exp(z) трансцендентно**."; }
    if (isAlg(sel) == 1 && (r == 0 || sel == 6)) { s2 = s2 + "z = 0: множество {0} линейно зависимо, теорема неприменима, и действительно e⁰ = 1 — алгебраическое число."; }
    if (isAlg(sel) == 0 && r != 0 && sel == 7) { s2 = s2 + "Число z = " + cpx(zr, zi) + " не алгебраическое, теорема к нему не применима, и exp(z) = " + cpx(wr, wi) + " оказывается алгебраическим. Отсюда трансцендентность π: будь π алгебраическим, число iπ тоже, а exp(iπ) = −1 алгебраично — противоречие с теоремой."; }
    if (isAlg(sel) == 0 && r != 0 && sel == 8) { s2 = s2 + "Здесь exp(z) = " + num(wr, 3) + " алгебраично (рационально) при z ≠ 0. По теореме z не может быть алгебраическим: ln 2 трансцендентно."; }
    if (isAlg(sel) == 0 && r == 0) { s2 = s2 + "z = 0: exp(0) = 1."; }
    info = s2;
  }
}
]
