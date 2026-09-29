[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Четыре понятия на одном примере. Эксперимент: бросание кости, повторённое N раз. Исходы — грани
// 1…6 (под каждой — сколько раз выпала). Событие A — подмножество исходов (клик по грани: синие — в A).
// Вероятность P(A) — жёлтая линия; ломаная — частота события A после каждого испытания. ----
draw Graph { name = "gIn"; graph = "ga"; nodeRadius = 20; nodeColor = #3b82f6; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gOut"; graph = "go"; nodeRadius = 20; nodeColor = #3b82f644; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCn"; graph = "gc"; nodeRadius = 13; nodeColor = #3b82f622; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "y1"; pos = (-7.7, 0.8); text = "1"; size = 0.8; align = left }
draw Text { name = "y0"; pos = (-7.7, -3.6); text = "0"; size = 0.8; align = left }
draw Text { name = "yf"; pos = (7.7, -4.5); text = "n → N"; size = 0.8; align = right }

new UI { name = "sN"; type = slider; label = "испытаний N"; variable = N; min = 1; max = 300; step = 1; default = 120 }
new UI { name = "bR"; type = button; label = "Повторить серию"; action = "seed = seed + 1" }

// ---- Логика ----
float N = 120; float seed = 1; float sd = 0; float init = 0; float clicks = 0; float key = -1;
list r = [1]; list inA = [0, 1, 0, 1, 0, 1]; list cn = [0, 0, 0, 0, 0, 0];
string info = "";

Function fx(j) { return -6 + 2.4 * j; }
Function py(f) { return -3.6 + 4.4 * f; }

Update {
  if (init == 0) { repeat (299) { push(r, 1); } init = 1; }
  if (sd != seed) { sd = seed; repeat (300) { r[i] = randomInt(1, 6); } }
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float c = round((mouseClickX + 6) / 2.4);
    if (c >= 0 && c <= 5 && abs(mouseClickX - fx(c)) < 1.1 && mouseClickY > 2.3) { inA[c] = 1 - inA[c]; }
  }
  float km = 0; repeat (6) { km = km + inA[i] * pow(2, i); }
  float kk = N + 1000 * seed + 1000000 * km;
  float nA = 0; repeat (6) { nA = nA + inA[i]; }
  float pA = nA / 6;
  float hits = 0;
  if (key != kk) {
    key = kk; ga = newGraph(); go = newGraph(); gc = newGraph(); gf = newGraph(); gp = newGraph(); gx = newGraph();
    repeat (6) { cn[i] = 0; }
    float h = 0;
    repeat (N) {
      float v = r[i] - 1; cn[v] = cn[v] + 1; h = h + inA[v];
      addNode(gf, "f" + format(i, 0), [-6.5 + 14 * (i + 1) / N, py(h / (i + 1))]);
      if (i > 0) { addEdge(gf, "f" + format(i - 1, 0), "f" + format(i, 0)); }
    }
    repeat (6) {
      if (inA[i] == 1) { addNode(ga, "a" + format(i, 0), [fx(i), 3.4], format(i + 1, 0)); } else { addNode(go, "o" + format(i, 0), [fx(i), 3.4], format(i + 1, 0)); }
      addNode(gc, "c" + format(i, 0), [fx(i), 2.0], format(cn[i], 0));
    }
    addNode(gp, "p1", [-6.5, py(pA)]); addNode(gp, "p2", [7.5, py(pA)]); addEdge(gp, "p1", "p2");
    addNode(gx, "x1", [-6.5, py(0)]); addNode(gx, "x2", [7.5, py(0)]); addEdge(gx, "x1", "x2");
    addNode(gx, "x3", [-6.5, py(1)]); addNode(gx, "x4", [7.5, py(1)]); addEdge(gx, "x3", "x4");
  }
  repeat (N) { hits = hits + inA[r[i] - 1]; }
  string sA = ""; repeat (6) { if (inA[i] == 1) { sA = sA + format(i + 1, 0) + " "; } }
  info = "**Основные понятия** выстраиваются цепочкой. **Случайный эксперимент** — бросание кости, повторено N = " + format(N, 0) + " раз. Его **элементарные исходы** — грани 1, …, 6 (числа под гранями — сколько раз каждая выпала). **Событие** — подмножество исходов: A = { " + sA + "}.\n\n";
  info = info + "**Вероятность** события A — число, с которым сравнивается его частота: P(A) = " + format(nA, 0) + "/6 ≈ " + format(pA, 3) + ". Наблюдаемая частота A: " + format(hits, 0) + "/" + format(N, 0) + " ≈ " + format(hits / N, 3) + ". Ломаная — частота после каждого испытания: сначала она скачет, затем приближается к жёлтой линии P(A).\n\n";
  info = info + "Клик по грани включает или исключает её из события A.";
}
]
