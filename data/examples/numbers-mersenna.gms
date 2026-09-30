[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float p = 11; float key = -1; float key2 = -1; string fac = ""; float nprime = 0; float M = 0; string info = "";
new UI { type = slider; label = "показатель n"; variable = p; min = 2; max = 22; step = 1; default = 11 }
draw Graph { name = "gBits"; graph = "g1"; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gPr"; graph = "g2"; nodeColor = #22c55e; nodeRadius = 13; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gPc"; graph = "g3"; nodeColor = #f59e0b; nodeRadius = 13; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gCm"; graph = "g4"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "g5"; nodeColor = #3b82f655; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Text { name = "tb"; pos = (-7.6, 2.9); text = "двоичная запись 2ⁿ − 1: " + format(p, 0) + " единиц"; size = 0.9; align = left }
draw Text { name = "tn"; pos = (-7.6, -0.4); text = "n = 2 … 22: зелёные — 2ⁿ − 1 простое, оранжевые — n простое, но 2ⁿ − 1 составное, синие — n составное"; size = 0.8; align = left }
Function md(x, y) { return x - y * floor(x / y); }
Function spf(m) { float d = 2; repeat (2100) { if (d * d <= m && md(m, d) != 0) { d = d + 1; } } if (d * d > m) { return m; } return d; }
Function isp(m) { if (m < 2) { return 0; } if (spf(m) == m) { return 1; } return 0; }
Function sd(d) { if (d == 0) { return "⁰"; } if (d == 1) { return "¹"; } if (d == 2) { return "²"; } if (d == 3) { return "³"; } if (d == 4) { return "⁴"; } if (d == 5) { return "⁵"; } if (d == 6) { return "⁶"; } if (d == 7) { return "⁷"; } if (d == 8) { return "⁸"; } return "⁹"; }
Function sup(e) { if (e < 10) { return sd(e); } return sd(floor(e / 10)) + sd(e - 10 * floor(e / 10)); }
Function sb(d) { if (d == 0) { return "₀"; } if (d == 1) { return "₁"; } if (d == 2) { return "₂"; } if (d == 3) { return "₃"; } if (d == 4) { return "₄"; } if (d == 5) { return "₅"; } if (d == 6) { return "₆"; } if (d == 7) { return "₇"; } if (d == 8) { return "₈"; } return "₉"; }
Function sub(e) { if (e < 10) { return sb(e); } return sb(floor(e / 10)) + sb(e - 10 * floor(e / 10)); }
Function mp(m) { return pow(2, m) - 1; }
Update {
  p = round(p);
  if (key < 0) {
    g2 = newGraph(); g3 = newGraph(); g4 = newGraph();
    repeat (21) {
      float m = i + 2; string lb = format(m, 0);
      float x = -7 + 14 * (m - 2) / 20;
      if (isp(mp(m)) == 1) { addNode(g2, lb, [x, -1.9], lb); } else { if (isp(m) == 1) { addNode(g3, lb, [x, -1.9], lb); } else { addNode(g4, lb, [x, -1.9], lb); } }
    }
    key = 0;
  }
  if (key2 != p) {
    g1 = newGraph(); g5 = newGraph();
    repeat (22) { if (i < p) { addNode(g1, "s" + format(i, 0), [-7 + 14 * i / 22 + 0.04, 1.7]); addNode(g1, "e" + format(i, 0), [-7 + 14 * (i + 1) / 22 - 0.04, 1.7]); addEdge(g1, "s" + format(i, 0), "e" + format(i, 0), 1, "#3b82f6"); } }
    addNode(g5, "s", [-7 + 14 * (p - 2) / 20, -1.9]);
    key2 = p;
  }
  M = mp(p);
  float mm = M; float d = 3; fac = "";
  repeat (1100) {
    if (d * d <= mm) {
      if (md(mm, d) == 0) { float e = 0; repeat (22) { if (md(mm, d) == 0) { mm = mm / d; e = e + 1; } } if (fac != "") { fac = fac + " · "; } fac = fac + format(d, 0) + (e > 1 ? sup(e) : ""); }
      d = d + 2;
    }
  }
  if (mm > 1 && mm < M) { fac = fac + " · " + format(mm, 0); }
  info = "**Числа Мерсенна** Mₙ = 2ⁿ − 1. Например, M" + sub(p) + " = 2" + sup(p) + " − 1 = **" + format(M, 0) + "**";
  if (mm == M) {
    info = info + " — простое.";
    info = info + "\n\nПоказатель " + format(p, 0) + " простой, и Mₙ простое, поэтому 2" + sup(p - 1) + " · (2" + sup(p) + " − 1) = " + format(pow(2, p - 1) * M, 0) + " — чётное совершенное число.";
  } else {
    info = info + " = " + fac + " — составное.";
    if (isp(p) == 1) { info = info + "\n\nПоказатель " + format(p, 0) + " простой, но M" + sub(p) + " всё равно составное: простой показатель лишь необходим. Простые делители имеют вид 2·" + format(p, 0) + "·k + 1."; }
    else { info = info + "\n\nПоказатель " + format(p, 0) + " составной, значит и 2" + sup(p) + " − 1 составное: если n = a · b, то 2" + sup(p) + " − 1 делится на 2ᵃ − 1."; }
  }
}
]
