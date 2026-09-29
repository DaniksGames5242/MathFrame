[
description = "{info}"

field width = 24;
field height = 10;
camera type = fixed;

// ---- Рамка счётов: на каждом стержне 10 костяшек (пятая и шестая — оранжевые). Костяшки, прижатые к перекладине, считаются:
// их число — цифра разряда. Старший разряд сверху, единицы внизу. Клик по костяшке прижимает к перекладине все костяшки до неё. ----
draw Graph { name = "gR"; graph = "gr"; edgeColor = #3b82f699; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gBar"; graph = "gbar"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #3b82f6; nodeRadius = 13; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gO"; graph = "go"; nodeColor = #f59e0b; nodeRadius = 13; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "q0"; pos = (-1, ry(0)); text = "× " + format(100000, 0) + "  ·  " + format(dg[0], 0); size = 1; align = right }
draw Text { name = "q1"; pos = (-1, ry(1)); text = "× " + format(10000, 0) + "  ·  " + format(dg[1], 0); size = 1; align = right }
draw Text { name = "q2"; pos = (-1, ry(2)); text = "× " + format(1000, 0) + "  ·  " + format(dg[2], 0); size = 1; align = right }
draw Text { name = "q3"; pos = (-1, ry(3)); text = "× " + format(100, 0) + "  ·  " + format(dg[3], 0); size = 1; align = right }
draw Text { name = "q4"; pos = (-1, ry(4)); text = "× " + format(10, 0) + "  ·  " + format(dg[4], 0); size = 1; align = right }
draw Text { name = "q5"; pos = (-1, ry(5)); text = "× " + format(1, 0) + "  ·  " + format(dg[5], 0); size = 1; align = right }

new UI { name = "b1"; type = button; label = "+ 1"; action = "N = N + 1" }
new UI { name = "b10"; type = button; label = "+ 10"; action = "N = N + 10" }
new UI { name = "b0"; type = button; label = "сбросить"; action = "N = 0" }

// ---- Логика ----
float N = 40719; float pN = -1; float cc = 0; float key = -1; string info = "";
list dg = [0, 0, 0, 0, 0, 0];

Function ry(r) { return 3.8 - 1.5 * r; }
Function bx(j, d) { if (j < d) { return 0.7 + 0.85 * j; } return 0.7 + 0.85 * j + 1.4; }
Function rebuildN() { float v = 0; repeat (6) { v = v * 10 + dg[i]; } return v; }

Update {
  if (N > 999999) { N = N - 1000000; }
  if (N != pN) {
    float r = N; float k = 5; repeat (6) { float q = floor(r / pow(10, k)); dg[i] = q; r = r - q * pow(10, k); k = k - 1; } pN = N; key = -1;
  }
  if (mouseClickCount != cc) {
    cc = mouseClickCount;
    float row = round((3.8 - mouseClickY) / 1.5);
    if (row >= 0 && row <= 5 && abs(mouseClickY - ry(row)) < 0.6) {
      float d = dg[row]; float hit = -1;
      repeat (10) { if (abs(mouseClickX - bx(i, d)) < 0.42) { hit = i; } }
      if (hit >= 0) { if (hit == d - 1) { dg[row] = hit; } else { dg[row] = hit + 1; } N = rebuildN(); pN = N; key = -1; }
    }
  }
  if (key != N) {
    gr = newGraph(); gbar = newGraph(); gb = newGraph(); go = newGraph();
    addNode(gbar, "b1", [0, 4.9]); addNode(gbar, "b2", [0, -4.9]); addEdge(gbar, "b1", "b2");
    addNode(gr, "f1", [10.7, 4.9]); addNode(gr, "f2", [10.7, -4.9]); addEdge(gr, "f1", "f2");
    repeat (6) { float r = i; float d = dg[r];
      addNode(gr, "a" + format(r, 0), [0, ry(r)]); addNode(gr, "c" + format(r, 0), [10.7, ry(r)]); addEdge(gr, "a" + format(r, 0), "c" + format(r, 0));
      repeat (10) { if (i == 4 || i == 5) { addNode(go, "o" + format(r, 0) + "_" + format(i, 0), [bx(i, d), ry(r)]); } else { addNode(gb, "u" + format(r, 0) + "_" + format(i, 0), [bx(i, d), ry(r)]); } }
    }
    string s = ""; float t = 0;
    repeat (6) { float k = 5 - i; if (dg[i] > 0) { if (t > 0) { s = s + " + "; } s = s + format(dg[i], 0) + " · " + format(pow(10, k), 0); t = t + 1; } }
    if (t == 0) { s = "0"; }
    info = "**" + format(N, 0) + " = " + s + ".** Прижатые к перекладине костяшки стержня дают цифру разряда — от 0 до 9; оттолкнутые — нулевой вклад. Пустой стержень (цифра 0) не требует знака нуля: сам разряд остаётся на своём месте.\n\nКлик по костяшке прижимает к перекладине все костяшки до неё; повторный клик по последней прижатой отпускает её.";
    key = N;
  }
}
]
