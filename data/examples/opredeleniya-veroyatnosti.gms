[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Три определения вероятности на одном и том же событии-«благоприятной части».
// 1) Классическое: n равновозможных исходов, вероятность = m/n (щелчок по исходу включает его в событие).
// 2) Статистическое: вероятность — число, около которого стабилизируется относительная частота.
// 3) Геометрическое: точка бросается наудачу в область, вероятность = отношение площадей. ----
int tab = 1; float n = 6; float pT = 0.3; float N = 200; float rr = 2.5; float seed = 1;
list fv = (1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float lc = 0; float m = 0; float wN = 0; float dm = 0;
string key = ""; string info = "";

// вкладка 1
draw Graph { name = "gCl1"; graph = "gcg"; nodeColor = #22c55e; nodeRadius = 17; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCl0"; graph = "gcn"; nodeColor = #f59e0b; nodeRadius = 17; labels = true; interactive = false; showWeights = false; layer = 5 }
new Claster { name = "c1"; elements = (gCl1, gCl0); active = true }
// вкладка 2
draw Graph { name = "gSg"; graph = "gsg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gSw"; graph = "gsw"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gSp"; graph = "gsp"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Text { name = "tS0"; pos = (-6.8, -3.6); text = "0"; size = 0.75; align = right }
draw Text { name = "tS1"; pos = (-6.8, 0); text = "0.5"; size = 0.75; align = right }
draw Text { name = "tS2"; pos = (-6.8, 3.6); text = "1"; size = 0.75; align = right }
draw Text { name = "tSw"; pos = (-6.8, 4.5); text = "относительная частота W"; size = 0.85; align = left }
draw Text { name = "tSn"; pos = (7.4, -4.4); text = "число испытаний " + format(N, 0); size = 0.75; align = right }
new Claster { name = "c2"; elements = (gSg, gSw, gSp, tS0, tS1, tS2, tSw, tSn); active = false }
// вкладка 3
draw Graph { name = "gGf"; graph = "ggf"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gGi"; graph = "ggi"; nodeColor = #22c55e; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gGo"; graph = "ggo"; nodeRadius = 2; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tOm"; pos = (-7.5, 4.8); text = "Ω"; size = 0.9; align = left }
new Point { name = "C"; pos = (-1.5, 0.5); text = true("S"); pauseOnDrag = false }
new Circle { name = "cS"; center = C; radius = rr; color = #3b82f6 }
new Claster { name = "c3"; elements = (gGf, gGi, gGo, tOm, C, cS); active = false }

new UI { name = "b1"; type = button; label = "Классическое"; action = "tab = 1; c1.active = true; c2.active = false; c3.active = false" }
new UI { name = "b2"; type = button; label = "Статистическое"; action = "tab = 2; c1.active = false; c2.active = true; c3.active = false" }
new UI { name = "b3"; type = button; label = "Геометрическое"; action = "tab = 3; c1.active = false; c2.active = false; c3.active = true" }
new UI { name = "sN1"; type = slider; label = "исходов n"; variable = n; min = 2; max = 20; step = 1; default = 6; active = tab == 1 }
new UI { name = "sP2"; type = slider; label = "вероятность p"; variable = pT; min = 0.05; max = 0.95; step = 0.05; default = 0.3; active = tab == 2 }
new UI { name = "sN2"; type = slider; label = "испытаний n"; variable = N; min = 10; max = 1000; step = 10; default = 200; active = tab == 2 }
new UI { name = "bS"; type = button; label = "новая серия"; action = "seed = seed + 1"; active = tab > 1 }
new UI { name = "sR3"; type = slider; label = "радиус S"; variable = rr; min = 0.5; max = 4.4; step = 0.1; default = 2.5; active = tab == 3 }

Function ox(j) { float c = min(n, 10); if (j >= 10) { c = n - 10; } float jj = j; if (j >= 10) { jj = j - 10; } return (jj - (c - 1) / 2) * 1.4; }
Function oy(j) { if (n <= 10) { return 0; } if (j >= 10) { return -1.1; } return 1.1; }
Function ru(j, a, b) { float v = sin(j * a + seed * b) * 43758.5453; return v - floor(v); }

Update {
  if (mouseClickCount != lc) {
    lc = mouseClickCount;
    if (tab == 1) { repeat (n) { if (abs(mouseClickX - ox(i)) < 0.7 && abs(mouseClickY - oy(i)) < 0.7) { fv[i] = 1 - fv[i]; key = ""; } } }
  }
  string kk = format(tab, 0) + "|" + format(n, 0) + "|" + format(pT, 2) + "|" + format(N, 0) + "|" + format(seed, 0) + "|" + format(rr, 1) + "|" + format(C.pos.x, 3) + "|" + format(C.pos.y, 3);
  if (tab == 1) { kk = "1|" + format(n, 0); repeat (n) { kk = kk + format(fv[i], 0); } }
  if (tab == 3) {
    if (C.pos.x < -7.5 + rr) { C.pos.x = -7.5 + rr; } if (C.pos.x > 7.5 - rr) { C.pos.x = 7.5 - rr; }
    if (C.pos.y < -4.5 + rr) { C.pos.y = -4.5 + rr; } if (C.pos.y > 4.5 - rr) { C.pos.y = 4.5 - rr; }
  }
  if (kk != key) {
    key = kk;
    if (tab == 1) {
      gcg = newGraph(); gcn = newGraph(); m = 0;
      repeat (n) { if (fv[i] == 1) { m = m + 1; addNode(gcg, format(i + 1, 0), [ox(i), oy(i)]); } else { addNode(gcn, format(i + 1, 0), [ox(i), oy(i)]); } }
    }
    if (tab == 2) {
      gsg = newGraph(); gsw = newGraph(); gsp = newGraph();
      repeat (5) { addNode(gsg, "a" + format(i, 0), [-6.6, -3.6 + 1.8 * i]); addNode(gsg, "b" + format(i, 0), [7.4, -3.6 + 1.8 * i]); addEdge(gsg, "a" + format(i, 0), "b" + format(i, 0)); }
      addNode(gsp, "p0", [-6.6, -3.6 + 7.2 * pT]); addNode(gsp, "p1", [7.4, -3.6 + 7.2 * pT]); addEdge(gsp, "p0", "p1");
      m = 0;
      repeat (N) { float j = i + 1; if (ru(j, 12.9898, 78.233) < pT) { m = m + 1; } addNode(gsw, "w" + format(j, 0), [-6.6 + 14 * j / N, -3.6 + 7.2 * m / j]); if (j > 1) { addEdge(gsw, "w" + format(j - 1, 0), "w" + format(j, 0)); } }
      wN = m / N;
    }
    if (tab == 3) {
      ggf = newGraph(); ggi = newGraph(); ggo = newGraph();
      addNode(ggf, "1", [-7.5, -4.5]); addNode(ggf, "2", [7.5, -4.5]); addNode(ggf, "3", [7.5, 4.5]); addNode(ggf, "4", [-7.5, 4.5]);
      addEdge(ggf, "1", "2"); addEdge(ggf, "2", "3"); addEdge(ggf, "3", "4"); addEdge(ggf, "4", "1");
      m = 0;
      repeat (300) { float x = -7.5 + 15 * ru(i + 1, 12.9898, 78.233); float y = -4.5 + 9 * ru(i + 1, 39.3468, 11.135);
        if ((x - C.pos.x) * (x - C.pos.x) + (y - C.pos.y) * (y - C.pos.y) <= rr * rr) { m = m + 1; addNode(ggi, "d" + format(i, 0), [x, y]); } else { addNode(ggo, "d" + format(i, 0), [x, y]); } }
    }
  }
  string s = "";
  if (tab == 1) {
    string ev = ""; repeat (n) { if (fv[i] == 1) { if (ev != "") { ev = ev + ", "; } ev = ev + format(i + 1, 0); } }
    s = "**Классическое определение:** если исходов конечное число n и все они равновозможны, то вероятность события A равна отношению числа благоприятных исходов к числу всех: P(A) = m / n.\n\nЗдесь n = " + format(n, 0) + ", ";
    if (m > 0) { s = s + "благоприятны (зелёные) m = " + format(m, 0) + " исходов, A = {" + ev + "}: P(A) = " + format(m, 0) + " / " + format(n, 0) + " = " + format(m / n, 3) + "."; }
    else { s = s + "благоприятных исходов нет: A — невозможное событие, P(A) = 0 / " + format(n, 0) + " = 0."; }
    s = s + "\n\nЩелчок по исходу включает его в событие или исключает.";
  }
  if (tab == 2) { s = "**Статистическое определение:** вероятность события — число, около которого стабилизируется относительная частота W = m / n при неограниченном числе однородных испытаний.\n\nПосле " + format(N, 0) + " испытаний событие произошло m = " + format(m, 0) + " раз, W = " + format(wN, 3) + ". Вероятность, по которой шла серия, p = " + format(pT, 2) + " (оранжевая линия); отклонение |W − p| = " + format(abs(wN - pT), 3) + ". Ранние значения W (левая часть) сильно колеблются, с ростом числа испытаний колебания уменьшаются."; }
  if (tab == 3) { s = "**Геометрическое определение:** точка бросается наудачу в область Ω; вероятность попасть в часть S равна отношению мер (здесь — площадей): P = S / Ω.\n\nПлощадь Ω = 15 · 9 = 135, площадь круга S = π · " + format(rr, 1) + "² = " + format(3.141592653589793 * rr * rr, 2) + ": P = " + format(3.141592653589793 * rr * rr / 135, 3) + ".\n\nИз 300 брошенных точек в S попало " + format(m, 0) + ": доля " + format(m / 300, 3) + " — по статистическому определению она приближает P."; }
  info = s;
}
]
