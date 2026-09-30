[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float n = 3; float key = -1; float key2 = -1; float Fv = 0; float dv = 0; float cof = 0; string info = "";
new UI { type = slider; label = "n"; variable = n; min = 0; max = 5; step = 1; default = 3 }
draw Graph { name = "gBits"; graph = "g1"; edgeWidth = 14; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gOne"; graph = "g6"; edgeWidth = 14; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gPr"; graph = "g2"; nodeColor = #22c55e; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gCm"; graph = "g3"; nodeColor = #3b82f6; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "g5"; nodeColor = #3b82f655; nodeRadius = 26; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gPoly"; graph = "g4"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tb"; pos = (-7.6, 4.5); text = "двоичная запись Fₙ: " + format(pow(2, n) + 1, 0) + " цифр"; size = 0.9; align = left }
draw Text { name = "tn"; pos = (-7.6, 2.8); text = "F₀ … F₅: зелёные — простые, синие — составные"; size = 0.9; align = left }
draw Text { name = "tp"; pos = (0, -4.6); text = ptxt; size = 0.9 }
string ptxt = "";
Function md(x, y) { return x - y * floor(x / y); }
Function sd(d) { if (d == 0) { return "⁰"; } if (d == 1) { return "¹"; } if (d == 2) { return "²"; } if (d == 3) { return "³"; } if (d == 4) { return "⁴"; } if (d == 5) { return "⁵"; } if (d == 6) { return "⁶"; } if (d == 7) { return "⁷"; } if (d == 8) { return "⁸"; } return "⁹"; }
Function sb(d) { if (d == 0) { return "₀"; } if (d == 1) { return "₁"; } if (d == 2) { return "₂"; } if (d == 3) { return "₃"; } if (d == 4) { return "₄"; } return "₅"; }
Function fer(m) { return pow(2, pow(2, m)) + 1; }
// наименьший делитель вида k·2ⁿ⁺² + 1 (по необходимому условию), не больше √m; 0 — такого нет
Function smallf(m, nn) {
  float st = pow(2, nn + 2); float k = 1;
  repeat (520) { if (k * st + 1 <= sqrt(m) && md(m, k * st + 1) != 0) { k = k + 1; } }
  if (k * st + 1 <= sqrt(m)) { return k * st + 1; }
  return 0;
}
Function fd(m) { if (m < 2) { return 0; } return smallf(fer(m), m); }
Update {
  n = round(n);
  if (key < 0) {
    g2 = newGraph(); g3 = newGraph();
    repeat (6) {
      float x = -5 + 2 * i; string lb = "F" + sb(i);
      if (i < 2 || fd(i) == 0) { addNode(g2, lb, [x, 1.2], lb); } else { addNode(g3, lb, [x, 1.2], lb); }
    }
    key = 0;
  }
  if (key2 != n) {
    g1 = newGraph(); g5 = newGraph(); g6 = newGraph(); g4 = newGraph();
    float nb = pow(2, n) + 1; float w = 14 / 33;
    repeat (33) {
      if (i < nb) {
        addNode(g1, "s" + format(i, 0), [-7 + w * i + 0.03, 3.6]); addNode(g1, "e" + format(i, 0), [-7 + w * (i + 1) - 0.03, 3.6]);
        if (i == 0 || i == nb - 1) { addEdge(g6, "s" + format(i, 0), "e" + format(i, 0), 1, "#f59e0b"); addNode(g6, "s" + format(i, 0), [-7 + w * i + 0.03, 3.6]); addNode(g6, "e" + format(i, 0), [-7 + w * (i + 1) - 0.03, 3.6]); }
        else { addEdge(g1, "s" + format(i, 0), "e" + format(i, 0), 1, "#3b82f6"); }
      }
    }
    addNode(g5, "s", [-5 + 2 * n, 1.2]);
    key2 = n;
  }
  Fv = fer(n);
  info = "**Числа Ферма** Fₙ = 2" + sd(0) + " + 1";
}
]
