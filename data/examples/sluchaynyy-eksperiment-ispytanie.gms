[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Эксперимент: бросание двух костей, повторяемое N раз. Столбики — наблюдаемые частоты исходов,
// жёлтые точки — вероятности. Одна процедура, но два описания результата — два разных эксперимента:
// пара (a, b) — 36 равновозможных исходов, сумма a + b — 11 неравновозможных. ----
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f6; edgeWidth = 12; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gT"; graph = "gt"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gL"; graph = "gl"; nodeRadius = 15; nodeColor = #3b82f633; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "tp1"; pos = (-7.5, -4.1); text = "(1,1)"; size = 0.8; align = left; active = md == "pair" }
draw Text { name = "tp2"; pos = (7.5, -4.1); text = "(6,6)"; size = 0.8; align = right; active = md == "pair" }
draw Text { name = "tp3"; pos = (0, -4.1); text = "исходы (a, b) по порядку"; size = 0.8; active = md == "pair" }

new UI { name = "sM"; type = select; label = "результат — это"; variable = md; options = ("pair", "sum"); labels = ("пара (a, b)", "сумма a + b"); default = "sum" }
new UI { name = "sN"; type = slider; label = "испытаний N"; variable = N; min = 1; max = 500; step = 1; default = 60 }
new UI { name = "bR"; type = button; label = "Повторить серию"; action = "seed = seed + 1" }

// ---- Логика ----
string md = "sum"; float N = 60; float seed = 1; float sd = 0; float init = 0; float key = -1;
list r1 = [1]; list r2 = [1]; list cn = [0];
string info = "";

Function pth(k) { return 6 - abs(k - 7); }
Function fx(j, m) { return -7 + 14 * j / (m - 1); }

Update {
  if (init == 0) { repeat (499) { push(r1, 1); push(r2, 1); } repeat (35) { push(cn, 0); } init = 1; }
  if (sd != seed) { sd = seed; repeat (500) { r1[i] = randomInt(1, 6); r2[i] = randomInt(1, 6); } }
  float kk = N + 1000 * seed; if (md == "sum") { kk = kk + 0.5; }
  if (key != kk) {
    key = kk;
    gf = newGraph(); gt = newGraph(); gl = newGraph(); gx = newGraph();
    repeat (36) { cn[i] = 0; }
    repeat (N) { float a = r1[i]; float b = r2[i]; if (md == "pair") { cn[(a - 1) * 6 + b - 1] = cn[(a - 1) * 6 + b - 1] + 1; } else { cn[a + b - 2] = cn[a + b - 2] + 1; } }
    float m = 36; if (md == "sum") { m = 11; }
    float mx = 0; repeat (m) { float p = 1 / 36; if (md == "sum") { p = pth(i + 2) / 36; } mx = max(mx, max(p, cn[i] / N)); }
    addNode(gx, "x1", [-7.5, -3.5]); addNode(gx, "x2", [7.5, -3.5]); addEdge(gx, "x1", "x2");
    repeat (m) {
      float p = 1 / 36; if (md == "sum") { p = pth(i + 2) / 36; }
      addNode(gf, "u" + format(i, 0), [fx(i, m), -3.5]); addNode(gf, "v" + format(i, 0), [fx(i, m), -3.5 + 7.6 * cn[i] / N / mx]); addEdge(gf, "u" + format(i, 0), "v" + format(i, 0));
      addNode(gt, "t" + format(i, 0), [fx(i, m), -3.5 + 7.6 * p / mx]);
      if (md == "sum") { addNode(gl, "l" + format(i, 0), [fx(i, m), -4.2], format(i + 2, 0)); }
    }
  }
  string sq = ""; repeat (min(N, 8)) { sq = sq + "(" + format(r1[i], 0) + "; " + format(r2[i], 0) + ") "; }
  info = "**Случайный эксперимент** — процедура, исход которой заранее не предсказать, но которую можно повторять в тех же условиях. Здесь — бросание двух костей, повторённое N = " + format(N, 0) + " раз. Первые исходы: " + sq + "… — угадать следующий нельзя.\n\n";
  if (md == "pair") { info = info + "**Результат — пара (a, b):** 36 исходов, все равновозможны (вероятность каждого 1/36 ≈ 0.028); столбики колеблются около жёлтых точек и выравниваются с ростом N."; }
  else { info = info + "**Результат — сумма a + b:** та же процедура, но другой эксперимент: 11 исходов 2, …, 12 с вероятностями 1/36, 2/36, …, 6/36, …, 1/36 — уже не равновозможных. Эксперимент задаётся не только действием, но и описанием того, что считается результатом."; }
  info = info + "\n\nПри повторении **закономерность проявляется в частотах**, а не в отдельном исходе: чем больше N, тем ближе столбики к вероятностям.";
}
]
