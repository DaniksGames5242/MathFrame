[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — дискретная величина: вероятность значения k пропорциональна высоте столбика (точки двигаются).
// Снизу — непрерывная: смесь двух нормальных плотностей. Жёлтым отмечены моды, зелёным — прочие локальные максимумы. ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gM"; graph = "gm"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "ld"; pos = (-7.7, 4.6); text = "P(X = k)"; size = 1; align = left }
draw Text { name = "lc"; pos = (-7.7, -0.3); text = "y = f(x)"; size = 1; align = left }
draw Text { name = "t0"; pos = (-6, 0.6); text = "1"; size = 0.85 }
draw Text { name = "t1"; pos = (-4, 0.6); text = "2"; size = 0.85 }
draw Text { name = "t2"; pos = (-2, 0.6); text = "3"; size = 0.85 }
draw Text { name = "t3"; pos = (0, 0.6); text = "4"; size = 0.85 }
draw Text { name = "t4"; pos = (2, 0.6); text = "5"; size = 0.85 }
draw Text { name = "t5"; pos = (4, 0.6); text = "6"; size = 0.85 }
draw Text { name = "t6"; pos = (6, 0.6); text = "7"; size = 0.85 }
new Point { name = "D0"; pos = (-6, 1.6); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D1"; pos = (-4, 2.6); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D2"; pos = (-2, 3.6); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D3"; pos = (0, 2.4); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D4"; pos = (2, 3.6); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D5"; pos = (4, 1.9); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "D6"; pos = (6, 1.4); pauseOnDrag = false; collision = false; color = #3b82f6 }

new UI { type = slider; label = "расстояние между пиками"; variable = dd; min = 0; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "вес левого пика"; variable = ww; min = 0.2; max = 0.8; step = 0.05; default = 0.6 }

float dd = 4; float ww = 0.6; float key = -1; float key2 = -1; string info = ""; string i1 = ""; string i2 = "";

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function gauss(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066282746); }
Function f(x) { return ww * gauss(x, -dd / 2, 1) + (1 - ww) * gauss(x, dd / 2, 1); }
Function hd(k) {
  if (k == 0) { return D0.pos.y - 1; }
  if (k == 1) { return D1.pos.y - 1; }
  if (k == 2) { return D2.pos.y - 1; }
  if (k == 3) { return D3.pos.y - 1; }
  if (k == 4) { return D4.pos.y - 1; }
  if (k == 5) { return D5.pos.y - 1; }
  return D6.pos.y - 1;
}

Update {
  if (abs(D0.pos.x - (-6)) > 0.0001) { D0.pos.x = -6; }
  if (D0.pos.y < 1.1) { D0.pos.y = 1.1; }
  if (abs(D1.pos.x - (-4)) > 0.0001) { D1.pos.x = -4; }
  if (D1.pos.y < 1.1) { D1.pos.y = 1.1; }
  if (abs(D2.pos.x - (-2)) > 0.0001) { D2.pos.x = -2; }
  if (D2.pos.y < 1.1) { D2.pos.y = 1.1; }
  if (abs(D3.pos.x - (0)) > 0.0001) { D3.pos.x = 0; }
  if (D3.pos.y < 1.1) { D3.pos.y = 1.1; }
  if (abs(D4.pos.x - (2)) > 0.0001) { D4.pos.x = 2; }
  if (D4.pos.y < 1.1) { D4.pos.y = 1.1; }
  if (abs(D5.pos.x - (4)) > 0.0001) { D5.pos.x = 4; }
  if (D5.pos.y < 1.1) { D5.pos.y = 1.1; }
  if (abs(D6.pos.x - (6)) > 0.0001) { D6.pos.x = 6; }
  if (D6.pos.y < 1.1) { D6.pos.y = 1.1; }
  float sh = 0; float mh = 0; repeat (7) { sh = sh + hd(i); mh = max(mh, hd(i)); }
  float sk = 0; repeat (7) { sk = sk + (i + 1) * hd(i); }
  if (key != sk * 1000 + sh) {
    gax = newGraph(); gb = newGraph();
    addNode(gax, "a", [-8, 1]); addNode(gax, "b", [8, 1]); addEdge(gax, "a", "b");
    addNode(gax, "c", [-8, -4.2]); addNode(gax, "d", [8, -4.2]); addEdge(gax, "c", "d");
    i1 = ""; float nm = 0;
    repeat (7) {
      string col = "#3b82f6"; if (hd(i) > mh - 0.06) { col = "#f59e0b"; nm = nm + 1; if (i1 != "") { i1 = i1 + ", "; } i1 = i1 + format(i + 1, 0); }
      addNode(gb, "p" + format(i, 0), [-6 + 2 * i, 1]); addNode(gb, "q" + format(i, 0), [-6 + 2 * i, 1 + hd(i)]); addEdge(gb, "p" + format(i, 0), "q" + format(i, 0), 1, col);
    }
    if (nm < 1.5) { i1 = "мода k = " + i1 + " (единственная)"; }
    if (nm > 1.5 && nm < 2.5) { i1 = "моды k = " + i1 + " — распределение бимодальное"; }
    if (nm > 2.5) { i1 = "моды k = " + i1 + " — распределение мультимодальное"; }
    key = sk * 1000 + sh;
  }
  if (key2 != dd * 100 + ww) {
    gc = newGraph(); gm = newGraph();
    float mx = 0; repeat (161) { mx = max(mx, f(-8 + i * 0.1)); }
    float sc = 3.4 / mx;
    repeat (161) { addNode(gc, "p" + format(i, 0), [-8 + i * 0.1, -4.2 + sc * f(-8 + i * 0.1)]); }
    repeat (160) { addEdge(gc, "p" + format(i, 0), "p" + format(i + 1, 0)); }
    // локальные максимумы на сетке с шагом 0,02
    float fm = 0; repeat (801) { fm = max(fm, f(-8 + i * 0.02)); }
    i2 = ""; float n2 = 0; float nl = 0;
    repeat (799) {
      float x = -7.98 + i * 0.02;
      if (f(x) > f(x - 0.02) && f(x) >= f(x + 0.02)) {
        string cl = "#22c55e"; if (f(x) > fm - 0.0005) { cl = "#f59e0b"; n2 = n2 + 1; if (i2 != "") { i2 = i2 + " и "; } i2 = i2 + num(x, 2); } else { nl = nl + 1; }
        addNode(gm, "m" + format(i, 0), [x, -4.2]); addNode(gm, "n" + format(i, 0), [x, -4.2 + sc * f(x)]); addEdge(gm, "m" + format(i, 0), "n" + format(i, 0), 1, cl);
      }
    }
    if (n2 < 0.5) { i2 = "максимума нет"; }
    if (n2 > 0.5 && n2 < 1.5) { i2 = "мода x = " + i2; if (nl > 0.5) { i2 = i2 + "; второй (зелёный) пик — лишь локальный максимум, модой он не является"; } else { i2 = i2 + " (единственная, плотность унимодальна)"; } }
    if (n2 > 1.5) { i2 = "моды x = " + i2 + " — два одинаковых максимума"; }
    key2 = dd * 100 + ww;
  }
  info = "**Мода** — значение, при котором распределение достигает максимума: у дискретной величины это самая вероятная точка, у непрерывной — точка максимума плотности. Она может быть не единственной, а для симметричного унимодального распределения совпадает с E(X) и медианой.\n\n";
  info = info + "Дискретная: вероятности pₖ = высота / сумма высот, наибольшая p = " + format(mh / sh, 3) + "; " + i1 + ".\n\n";
  info = info + "Непрерывная: смесь двух нормальных плотностей с весами " + format(ww, 2) + " и " + format(1 - ww, 2) + "; " + i2 + ". Здесь E(X) = " + num(-ww * dd / 2 + (1 - ww) * dd / 2, 2) + ".";
}
]
