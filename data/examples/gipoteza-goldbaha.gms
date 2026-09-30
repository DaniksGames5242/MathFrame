[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числа 1…n на прямой, простые — точки. Дуга соединяет p₁ и p₂ = n − p₁, обе простые. Оранжевая дуга — выбранное разложение. ----
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; edgeColor = #f59e0b; edgeWidth = 4; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "l1"; pos = (lx1, -3.7); text = tx1; size = 1.1 }
draw Text { name = "l2"; pos = (lx2, -3.7); text = tx2; size = 1.1 }

new UI { name = "sN"; type = slider; label = "чётное n"; variable = n; min = 4; max = 100; step = 2; default = 28 }
new UI { name = "sK"; type = slider; label = "разложение №"; variable = k; min = 1; max = cnt; step = 1; default = 1 }

// ---- Логика ----
float n = 28; float k = 1; float cnt = 1; float key = -1; float ln = 1; float lx1 = 0; float lx2 = 0; float u = 0.14;
list PL = [2];
string tx1 = ""; string tx2 = ""; string info = "";
Function md(x, m) { return x - m * floor(x / m); }
Function isp(x) {
  if (x < 2) { return 0; }
  float r = 1;
  repeat (10) { float d = i + 2; if (d * d <= x && md(x, d) == 0) { r = 0; } }
  return r;
}
Function put(v) {
  if (cnt <= ln) { PL[cnt - 1] = v; }
  if (cnt > ln) { push(PL, v); ln = ln + 1; }
  return 0;
}
Function arc(g, a, b, nm) {
  float h = (b - a) * u * 0.5;
  addNode(g, "a" + nm, [-7 + a * u, -3]); addNode(g, "m" + nm, [-7 + (a + b) * u / 2, -3 + h]); addNode(g, "b" + nm, [-7 + b * u, -3]);
  addEdge(g, "a" + nm, "m" + nm); addEdge(g, "m" + nm, "b" + nm);
  return 0;
}

Update {
  u = 14 / n;
  if (key != n) {
    key = n; cnt = 0; k = 1;
    ga = newGraph(); gp = newGraph();
    addNode(ga, "s", [-7, -3]); addNode(ga, "t", [7, -3]); addEdge(ga, "s", "t");
    repeat (n - 1) {
      float q = i + 1;
      if (isp(q) > 0.5) { addNode(gp, "p" + format(q, 0), [-7 + q * u, -3]); }
      if (2 * q <= n && isp(q) > 0.5 && isp(n - q) > 0.5) { cnt = cnt + 1; put(q); arc(ga, q, n - q, format(q, 0)); }
    }
  }
  float ix = k - 1; if (ix > cnt - 1) { ix = cnt - 1; } if (ix < 0) { ix = 0; }
  float pa = PL[ix]; float pb = n - pa;
  gs = newGraph(); arc(gs, pa, pb, "s");
  lx1 = -7 + pa * u; lx2 = -7 + pb * u; tx1 = format(pa, 0); tx2 = format(pb, 0);
  info = "**Гипотеза Гольдбаха:** любое чётное n > 2 равно сумме двух простых p₁ + p₂. Гипотеза не доказана; на компьютере проверена до 4·10¹⁸.\n\n";
  info = info + "**n = " + format(n, 0) + ":** выбранное разложение " + format(n, 0) + " = " + format(pa, 0) + " + " + format(pb, 0) + ". Всего разложений с p₁ ≤ p₂: " + format(cnt, 0) + " (голубые дуги; оранжевая — выбранное).\n\n";
  info = info + "Чем больше n, тем обычно больше разложений, поэтому контрпример искать всё труднее.";
}
]
