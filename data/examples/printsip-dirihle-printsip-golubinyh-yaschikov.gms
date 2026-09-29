[
description = "{info}"

field width = 20;
field height = 11;
camera type = fixed;

// n объектов («голубей») лежат в m ящиках. Как ни раскладывай, в каком-то ящике не меньше ⌈n/m⌉ объектов.
float n = 7; float m = 3; float key = -1; float key2 = -1; float last = 0; float init = 0; float L = 0; string info = "";
list part = [0]; list xs = [0]; list ys = [0];
draw Graph { name = "gR"; graph = "gr"; nodeRadius = 0; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gV"; graph = "gv"; nodeColor = #3b82f6; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 5 }
new UI { type = slider; label = "n (объектов)"; variable = n; min = 1; max = 20; step = 1; default = 7 }
new UI { type = slider; label = "m (ящиков)"; variable = m; min = 1; max = 8; step = 1; default = 3 }

Function cntp(p) {
  float c = 0;
  repeat (n) { if (part[i] == p) { c = c + 1; } }
  return c;
}
Update {
  if (init == 0) { repeat (19) { push(part, 0); push(xs, 0); push(ys, 0); } init = 1; }
  n = round(n); m = round(m);
  if (key2 != n * 10 + m) {
    repeat (20) { part[i] = i - m * floor(i / m); }
    key2 = n * 10 + m; key = -1;
  }
  if (mouseClickCount != last) {
    last = mouseClickCount;
    float bd = 1.0; float bv = -1;
    repeat (n) { float d = sqrt((xs[i] - mouseClickX) * (xs[i] - mouseClickX) + (ys[i] - mouseClickY) * (ys[i] - mouseClickY)); if (d < bd) { bd = d; bv = i; } }
    if (bv >= 0) { part[bv] = part[bv] + 1 - m * floor((part[bv] + 1) / m); key = -1; }
  }
  float k2 = 0;
  repeat (n) { k2 = k2 + part[i] * pow(9, i); }
  if (k2 != key) {
    key = k2;
    L = 1; repeat (m) { L = max(L, cntp(i)); }
    float dy = min(0.9, 7.6 / L); float bw = min(1.8, 14 / m);
    list rk = [0]; repeat (m - 1) { push(rk, 0); }
    gr = newGraph(); gv = newGraph();
    repeat (m) {
      float b = i; float cx = -9 + 18 * (b + 0.5) / m; string col = "#3b82f699";
      if (cntp(b) == L) { col = "#f59e0b"; }
      string id = "r" + format(b, 0);
      addNode(gr, id + "a", [cx - bw / 2, -4.6]); addNode(gr, id + "b", [cx + bw / 2, -4.6]); addNode(gr, id + "c", [cx + bw / 2, 4.6]); addNode(gr, id + "d", [cx - bw / 2, 4.6]);
      addEdge(gr, id + "d", id + "a", 1, col); addEdge(gr, id + "a", id + "b", 1, col); addEdge(gr, id + "b", id + "c", 1, col);
    }
    repeat (n) {
      float p = part[i];
      xs[i] = -9 + 18 * (p + 0.5) / m; ys[i] = -4.0 + dy * rk[p]; rk[p] = rk[p] + 1;
      addNode(gv, "v" + format(i, 0), [xs[i], ys[i]]);
    }
  }
  float B = ceil(n / m);
  info = "**Принцип Дирихле (голубиных ящиков).** Раскладываем n = **" + format(n, 0) + "** объектов по m = **" + format(m, 0) + "** ящикам. Пусть в каждом ящике не больше ⌈n/m⌉ − 1 = " + format(B - 1, 0) + " объектов — тогда всего их не больше m·(⌈n/m⌉ − 1) < n. Противоречие, поэтому в каком-то ящике **не меньше ⌈n/m⌉ = " + format(B, 0) + "** объектов, при любой раскладке.\n\n";
  string t = "Когда объектов больше, чем ящиков (n > m), хотя бы в одном ящике не меньше двух.";
  if (n <= m) { t = "Объектов не больше, чем ящиков (n ≤ m): вывод «не меньше двух» не следует — можно разложить по одному."; }
  string u = "Сейчас самый полный ящик (жёлтый) содержит **" + format(L, 0) + "**; " + "меньше " + format(B, 0) + " не получится, а лишние объекты можно перенести и довести до " + format(B, 0) + ".";
  if (L == B) { u = "Сейчас самый полный ящик (жёлтый) содержит **" + format(L, 0) + "** — ровно ⌈n/m⌉, ниже опустить нельзя."; }
  info = info + t + " " + u + "\n\nЩёлчок по объекту переносит его в следующий ящик.";
}
]
