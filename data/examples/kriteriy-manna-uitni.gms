[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Две независимые выборки на числовой оси: X (синие, n = 4) и Y (оранжевые, m = 4). Каждая точка двигается вдоль своей строки.
// Серый отрезок X_i—Y_j проведён для каждой пары, где Yⱼ > Xᵢ: число таких отрезков и есть U. ----
new Point { name = "X1"; pos = (-5.2, 1.3); color = #3b82f6; pauseOnDrag = false }
new Point { name = "X2"; pos = (-2.8, 1.3); color = #3b82f6; pauseOnDrag = false }
new Point { name = "X3"; pos = (0.6, 1.3); color = #3b82f6; pauseOnDrag = false }
new Point { name = "X4"; pos = (3.9, 1.3); color = #3b82f6; pauseOnDrag = false }
new Point { name = "Y1"; pos = (-4.1, -1.3); color = #f59e0b; pauseOnDrag = false }
new Point { name = "Y2"; pos = (-0.4, -1.3); color = #f59e0b; pauseOnDrag = false }
new Point { name = "Y3"; pos = (2.2, -1.3); color = #f59e0b; pauseOnDrag = false }
new Point { name = "Y4"; pos = (5.4, -1.3); color = #f59e0b; pauseOnDrag = false }
draw Graph { name = "gU"; graph = "gu"; edgeColor = #3b82f699; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }

// ---- Логика ----
float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function fm(x) { if (abs(x - round(x)) < 0.001) { return format(x, 0); } return format(x, 1); }
Function v(k) { if (k == 0) { return X1.pos.x; } if (k == 1) { return X2.pos.x; } if (k == 2) { return X3.pos.x; } if (k == 3) { return X4.pos.x; } if (k == 4) { return Y1.pos.x; } if (k == 5) { return Y2.pos.x; } if (k == 6) { return Y3.pos.x; } if (k == 7) { return Y4.pos.x; } return 0; }
Function rk(k) { float r = 1; repeat (8) { if (v(i) < v(k) - 0.000001) { r = r + 1; } else { if (i != k && abs(v(i) - v(k)) <= 0.000001) { r = r + 0.5; } } } return r; }
Function s(a, b) { if (v(b) > v(a) + 0.000001) { return 1; } if (v(b) < v(a) - 0.000001) { return 0; } return 0.5; }

Update {
  if (abs(X1.pos.y - 1.3) > 0.0001) { X1.pos.y = 1.3; } if (abs(X2.pos.y - 1.3) > 0.0001) { X2.pos.y = 1.3; }
  if (abs(X3.pos.y - 1.3) > 0.0001) { X3.pos.y = 1.3; } if (abs(X4.pos.y - 1.3) > 0.0001) { X4.pos.y = 1.3; }
  if (abs(Y1.pos.y + 1.3) > 0.0001) { Y1.pos.y = -1.3; } if (abs(Y2.pos.y + 1.3) > 0.0001) { Y2.pos.y = -1.3; }
  if (abs(Y3.pos.y + 1.3) > 0.0001) { Y3.pos.y = -1.3; } if (abs(Y4.pos.y + 1.3) > 0.0001) { Y4.pos.y = -1.3; }
  float k2 = 0; repeat (8) { k2 = k2 * 1.0137 + v(i) * (i + 3); }
  if (k2 != key) {
    key = k2;
    gu = newGraph(); gx = newGraph();
    addNode(gx, "a1", [-fieldMaxX, 0]); addNode(gx, "a2", [fieldMaxX, 0]); addEdge(gx, "a1", "a2");
    float u = 0; float r1 = 0; float r2 = 0; string rx = ""; string ry = "";
    repeat (4) {
      float a = i; r1 = r1 + rk(a); r2 = r2 + rk(a + 4);
      rx = rx + fm(rk(a)); ry = ry + fm(rk(a + 4)); if (a < 3) { rx = rx + ", "; ry = ry + ", "; }
      repeat (4) { float b = i + 4; u = u + s(a, b); if (s(a, b) > 0.9) { addNode(gu, "x" + format(a, 0), [v(a), 1.3]); addNode(gu, "y" + format(b, 0), [v(b), -1.3]); addEdge(gu, "x" + format(a, 0), "y" + format(b, 0)); } }
    }
    float z = (u - 8) / sqrt(12);
    info = "**Ранги** в объединённой выборке (n + m = 8): у X — " + rx + " (R₁ = " + fm(r1) + "), у Y — " + ry + " (R₂ = " + fm(r2) + ").\n\n";
    info = info + "**U = число пар с Yⱼ > Xᵢ = " + fm(u) + "** (из nm = 16). Через ранги: U = R₂ − m(m + 1)/2 = " + fm(r2) + " − 10 = " + fm(r2 - 10) + ". ";
    if (u > 15.99) { info = info + "Все X левее всех Y — максимум U."; }
    if (u < 0.01) { info = info + "Все X правее всех Y — минимум U."; }
    info = info + "\n\n";
    info = info + "**При нулевой гипотезе** E[U] = nm/2 = 8, D[U] = nm(n + m + 1)/12 = 12, поэтому Z = (U − 8)/√12 = " + num(z, 2) + ". ";
    if (abs(z) > 1.96) { info = info + "|Z| > 1,96 — нулевая гипотеза о совпадении распределений отвергается на уровне 5 % (нормальное приближение при таких n грубое)."; } else { info = info + "|Z| ≤ 1,96 — оснований отвергнуть нулевую гипотезу нет."; }
    info = info + " Пока порядок точек сохраняется, U и ранги не меняются — можно растягивать и сжимать ось монотонно, критерий этого не заметит.";
  }
}
]
