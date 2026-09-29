[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Рамка соробана: 9 стержней, старший разряд слева. Верхняя костяшка — 5, каждая из четырёх нижних — 1;
// считаются костяшки, придвинутые к перекладине (тёбану). Клик по костяшке двигает её (и все, что «перед» ней). ----
draw Graph { name = "gR"; graph = "gr"; edgeColor = #3b82f699; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gBar"; graph = "gbar"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gH"; graph = "gh"; nodeColor = #f59e0b; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gE"; graph = "ge"; nodeColor = #3b82f6; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "q0"; pos = (rx(0), -5.3); text = format(dg[0], 0); size = 1.1 }
draw Text { name = "q1"; pos = (rx(1), -5.3); text = format(dg[1], 0); size = 1.1 }
draw Text { name = "q2"; pos = (rx(2), -5.3); text = format(dg[2], 0); size = 1.1 }
draw Text { name = "q3"; pos = (rx(3), -5.3); text = format(dg[3], 0); size = 1.1 }
draw Text { name = "q4"; pos = (rx(4), -5.3); text = format(dg[4], 0); size = 1.1 }
draw Text { name = "q5"; pos = (rx(5), -5.3); text = format(dg[5], 0); size = 1.1 }
draw Text { name = "q6"; pos = (rx(6), -5.3); text = format(dg[6], 0); size = 1.1 }
draw Text { name = "q7"; pos = (rx(7), -5.3); text = format(dg[7], 0); size = 1.1 }
draw Text { name = "q8"; pos = (rx(8), -5.3); text = format(dg[8], 0); size = 1.1 }

new UI { name = "b1"; type = button; label = "+ 1"; action = "N = N + 1" }
new UI { name = "b5"; type = button; label = "+ 5"; action = "N = N + 5" }
new UI { name = "b9"; type = button; label = "+ 9"; action = "N = N + 9" }
new UI { name = "b0"; type = button; label = "сбросить"; action = "N = 0" }

// ---- Логика ----
float N = 3907; float pN = -1; float cc = 0; float key = -1; string info = "";
list dg = [0, 0, 0, 0, 0, 0, 0, 0, 0];

Function rx(r) { return (r - 4) * 1.9; }
Function hy(h) { if (h == 1) { return 1.7; } return 3.6; }
Function ey(j, e) { if (j < e) { return 0.4 - 0.85 * j; } return -1.25 - 0.85 * j; }
Function rebuildN() { float v = 0; repeat (9) { v = v * 10 + dg[i]; } return v; }
Function hv(d) { if (d >= 5) { return 1; } return 0; }

Update {
  if (N >= 1000000000) { N = N - 1000000000; }
  if (N != pN) {
    float r = N; float k = 8; repeat (9) { float q = floor(r / pow(10, k)); dg[i] = q; r = r - q * pow(10, k); k = k - 1; } pN = N; key = -1;
  }
  if (mouseClickCount != cc) {
    cc = mouseClickCount;
    float hit = -1; repeat (9) { if (abs(mouseClickX - rx(i)) < 0.85) { hit = i; } }
    if (hit >= 0) {
      float d = dg[hit]; float h = hv(d); float e = d - 5 * h;
      if (mouseClickY > 1.05) { if (abs(mouseClickY - hy(h)) < 0.9) { dg[hit] = d + 5 - 10 * h; } }
      else { float bj = -1; repeat (4) { if (abs(mouseClickY - ey(i, e)) < 0.45) { bj = i; } }
        if (bj >= 0) { float ne = bj + 1; if (bj == e - 1) { ne = bj; } dg[hit] = 5 * h + ne; } }
      N = rebuildN(); pN = N; key = -1;
    }
  }
  if (key != N) {
    gr = newGraph(); gbar = newGraph(); gh = newGraph(); ge = newGraph();
    addNode(gbar, "m1", [-9.2, 1.05]); addNode(gbar, "m2", [9.2, 1.05]); addEdge(gbar, "m1", "m2");
    addNode(gbar, "l1", [-9.2, 4.6]); addNode(gbar, "l2", [-9.2, -4.9]); addEdge(gbar, "l1", "l2");
    addNode(gbar, "r1", [9.2, 4.6]); addNode(gbar, "r2", [9.2, -4.9]); addEdge(gbar, "r1", "r2");
    addNode(gbar, "t1", [-9.2, 4.6]); addNode(gbar, "t2", [9.2, 4.6]); addEdge(gbar, "t1", "t2");
    addNode(gbar, "u1", [-9.2, -4.9]); addNode(gbar, "u2", [9.2, -4.9]); addEdge(gbar, "u1", "u2");
    float pr = 0; float sm = 0;
    repeat (9) { float r = i; float d = dg[r]; float h = hv(d); float e = d - 5 * h;
      addNode(gr, "a" + format(r, 0), [rx(r), 4.6]); addNode(gr, "c" + format(r, 0), [rx(r), -4.9]); addEdge(gr, "a" + format(r, 0), "c" + format(r, 0));
      addNode(gh, "h" + format(r, 0), [rx(r), hy(h)]);
      repeat (4) { addNode(ge, "e" + format(r, 0) + "_" + format(i, 0), [rx(r), ey(i, e)]); }
      pr = pr + h + e; sm = sm + d;
    }
    info = "**" + format(N, 0) + "** на соробане. Цифра стержня = 5 · (верхняя костяшка) + (число нижних костяшек, придвинутых к перекладине): например, 7 = 5 + 2 — одно движение верхней и два нижних.";
    info = info + "\n\nПридвинуто костяшек: **" + format(pr, 0) + "**; при одних нижних (без пятёрок) понадобилось бы **" + format(sm, 0) + "**. Пустой стержень означает цифру 0.";
    key = N;
  }
}
]
