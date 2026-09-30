[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Столбики — распределение X на k = 0…20; оранжевые — значения, отстоящие от μ не меньше чем на ε.
// Внизу: оранжевая полоса — точная вероятность P(|X − μ| ≥ ε), синяя — оценка σ²/ε² (полоса длины 1 — вероятность 1). ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 13; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Text { name = "t0"; pos = (px(0), -3.4); text = "0"; size = 0.9 }
draw Text { name = "t5"; pos = (px(5), -3.4); text = "5"; size = 0.9 }
draw Text { name = "t10"; pos = (px(10), -3.4); text = "10"; size = 0.9 }
draw Text { name = "t15"; pos = (px(15), -3.4); text = "15"; size = 0.9 }
draw Text { name = "t20"; pos = (px(20), -3.4); text = "20"; size = 0.9 }
new Point { name = "MU"; pos = (-3.8, -2.8); dynamic = false; collision = false; text = true("μ") }

new UI { name = "sD"; type = select; label = "распределение X"; variable = ds; options = ("bin", "uni", "tri"); labels = ("Bin(20, q)", "равномерное 0…20", "0, 10, 20"); default = "bin" }
new UI { name = "sQ"; type = slider; label = "q"; variable = q; min = 0.05; max = 0.95; step = 0.01; default = 0.3 }
new UI { name = "sE"; type = slider; label = "ε"; variable = eps; min = 0.5; max = 12; step = 0.1; default = 5 }

// ---- Логика ----
string ds = "bin"; float q = 0.3; float eps = 5; float mu = 6; float key = -1;
list lfl = [0]; list pm = [0]; float init = 0; string info = "";
Function px(k) { return -9.4 + 0.94 * k; }

Update {
  if (init == 0) { repeat (20) { push(lfl, lfl[i] + log(i + 1)); push(pm, 0); } init = 1; }
  float kk = eps * 10 + q * 100000 + 1000000; if (ds == "uni") { kk = eps * 10 + 3000000; } if (ds == "tri") { kk = eps * 10 + q * 100000 + 5000000; }
  if (key != kk) {
    key = kk;
    float m = 0; float m2 = 0;
    repeat (21) {
      float k = i; float v = 0;
      if (ds == "bin") { v = exp(lfl[20] - lfl[k] - lfl[20 - k] + k * log(q) + (20 - k) * log(1 - q)); }
      if (ds == "uni") { v = 1 / 21; }
      if (ds == "tri") { if (k == 0 || k == 20) { v = q / 2; } if (k == 10) { v = 1 - q; } }
      pm[k] = v; m = m + k * v; m2 = m2 + k * k * v;
    }
    mu = m; float s2 = m2 - m * m; float tail = 0; float pmax = 0;
    repeat (21) { pmax = max(pmax, pm[i]); }
    gb = newGraph(); gl = newGraph(); gc = newGraph(); MU.pos.x = px(mu); MU.pos.y = -2.8;
    float sy = 7.6 / pmax; if (sy > 26) { sy = 26; }
    repeat (21) {
      float k = i; string s = format(k, 0);
      if (pm[k] > 0.000001) {
        string c = "#3b82f6"; if (abs(k - mu) >= eps - 0.000001) { c = "#f59e0b"; tail = tail + pm[k]; }
        addNode(gb, "a" + s, [px(k), -2.8]); addNode(gb, "b" + s, [px(k), -2.8 + sy * pm[k]]); addEdge(gb, "a" + s, "b" + s, 1, c);
      }
    }
    if (px(mu - eps) > -9.9) { addNode(gl, "m1", [px(mu - eps), -2.8]); addNode(gl, "m2", [px(mu - eps), 5.5]); addEdge(gl, "m1", "m2"); }
    if (px(mu + eps) < 9.9) { addNode(gl, "n1", [px(mu + eps), -2.8]); addNode(gl, "n2", [px(mu + eps), 5.5]); addEdge(gl, "n1", "n2"); }
    addNode(gl, "z1", [px(mu), -2.8]); addNode(gl, "z2", [px(mu), 4.6]); addEdge(gl, "z1", "z2", 1, "#3b82f644");
    float bd = s2 / (eps * eps);
    addNode(gc, "p1", [-9.4, -4.4]); addNode(gc, "p2", [-9.4 + 18.8 * min(tail, 1), -4.4]); addEdge(gc, "p1", "p2", 1, "#f59e0b");
    addNode(gc, "q1", [-9.4, -5.4]); addNode(gc, "q2", [-9.4 + 18.8 * min(bd, 1), -5.4]); addEdge(gc, "q1", "q2", 1, "#3b82f6");
    string nm = "Bin(20, " + format(q, 2) + ")"; if (ds == "uni") { nm = "равномерное на {0, …, 20}"; } if (ds == "tri") { nm = "P(0) = P(20) = " + format(q / 2, 3) + ", P(10) = " + format(1 - q, 2); }
    info = "**Неравенство Чебышёва:** для X с конечными μ = E[X] и σ² = D[X] и любого ε > 0 вероятность P(|X − μ| ≥ ε) ≤ σ²/ε². Здесь X: " + nm + ", μ = " + format(mu, 2) + ", σ² = " + format(s2, 2) + ", ε = " + format(eps, 1) + ".\n\n";
    info = info + "**Точная вероятность** P(|X − μ| ≥ ε) = " + format(tail, 4) + " (оранжевые столбики; вертикальные линии — μ ± ε), **оценка** σ²/ε² = " + format(bd, 4) + ". ";
    if (bd >= 1) { info = info + "Оценка не меньше 1 — ничего не сообщает: ε слишком мало по сравнению с σ = " + format(sqrt(s2), 2) + "."; }
    else { if (tail > 0 && bd - tail < 0.0001) { info = info + "**Оценка достигается:** для этого распределения неравенство точное, улучшить его нельзя."; } else { info = info + "Неравенство выполнено; оценка грубая — она не использует ничего, кроме σ²."; } }
  }
}
]
