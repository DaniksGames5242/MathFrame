[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Три распределения на общей оси: X, Y = aX + b и X₁ + X₂ (две независимые копии X).
// Столбики — вероятности, оранжевая черта — математическое ожидание, зелёный отрезок — [E − σ; E + σ]. ----
draw Graph { name = "gBars"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 7; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMarks"; graph = "gm"; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #6b7280; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t1"; pos = (-7.7, 3.7); text = "X:  E = " + format(ex, 2) + ",  D = " + format(dx, 2) + ",  σ = " + format(sqrt(dx), 2); size = 0.95; align = left }
draw Text { name = "t2"; pos = (-7.7, 0.5); text = "aX + b:  E = " + format(a * ex + b, 2) + ",  D = " + format(a * a * dx, 2) + ",  σ = " + format(abs(a) * sqrt(dx), 2); size = 0.95; align = left }
draw Text { name = "t3"; pos = (-7.7, -2.7); text = "X₁ + X₂:  E = " + format(2 * ex, 2) + ",  D = " + format(2 * dx, 2) + ",  σ = " + format(sqrt(2 * dx), 2); size = 0.95; align = left }
draw Text { name = "tk0"; pos = (vx(0), -4.6); text = "0"; size = 0.8; color = #6b7280 }
draw Text { name = "tk1"; pos = (vx(10), -4.6); text = "10"; size = 0.8; color = #6b7280 }
draw Text { name = "tk2"; pos = (vx(-10), -4.6); text = "−10"; size = 0.8; color = #6b7280 }
draw Text { name = "tk3"; pos = (vx(20), -4.6); text = "20"; size = 0.8; color = #6b7280 }

new UI { name = "sD"; type = select; label = "X"; variable = dist; options = ("die", "coin", "skew"); labels = ("кость 1…6", "0 или 5 с вероятностью ½", "перекошенная кость"); default = "die" }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -2; max = 3; step = 0.5; default = 2 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = -5; max = 5; step = 1; default = -3 }

// ---- Логика ----
string dist = "die"; float a = 2; float b = -3;
float key = -1;
float ex = 0; float dx = 0;
list v = (1, 2, 3, 4, 5, 6); list pr = (0, 0, 0, 0, 0, 0);
string info = "";

Function vx(t) { return -7.5 + 15 * (t + 13) / 36; }
Function bar(k, x, y0, h) { addNode(gb, "a" + k, [vx(x), y0]); addNode(gb, "b" + k, [vx(x), y0 + h]); addEdge(gb, "a" + k, "b" + k); return 0; }
Function mark(k, y0, e, s) {
  addNode(gm, "e1" + k, [vx(e), y0 - 0.15]); addNode(gm, "e2" + k, [vx(e), y0 + 2.3]); addEdge(gm, "e1" + k, "e2" + k, 1, "#f59e0b");
  addNode(gm, "s1" + k, [vx(e - s), y0 - 0.25]); addNode(gm, "s2" + k, [vx(e + s), y0 - 0.25]); addEdge(gm, "s1" + k, "s2" + k, 1, "#22c55e");
  addNode(gx, "x1" + k, [-7.5, y0]); addNode(gx, "x2" + k, [7.5, y0]); addEdge(gx, "x1" + k, "x2" + k);
  return 0;
}

Update {
  if (dist == "die") { repeat (6) { v[i] = i + 1; pr[i] = 1 / 6; } }
  if (dist == "coin") { repeat (6) { v[i] = 0; pr[i] = 0; } v[0] = 0; pr[0] = 0.5; v[1] = 5; pr[1] = 0.5; }
  if (dist == "skew") { repeat (6) { v[i] = i + 1; } pr[0] = 0.4; pr[1] = 0.25; pr[2] = 0.15; pr[3] = 0.1; pr[4] = 0.06; pr[5] = 0.04; }
  float k2 = a * 100 + b;
  if (dist == "coin") { k2 = k2 + 0.3; } if (dist == "skew") { k2 = k2 + 0.6; }
  if (k2 != key) {
    ex = 0; float e2 = 0;
    repeat (6) { ex = ex + v[i] * pr[i]; e2 = e2 + v[i] * v[i] * pr[i]; }
    dx = e2 - ex * ex;
    gb = newGraph(); gm = newGraph(); gx = newGraph();
    float mp = 0; repeat (6) { mp = max(mp, pr[i]); }
    float H = 1.9 / mp;
    // максимум распределения суммы
    float mz = 0; repeat (13) { float t = i; float q = 0; repeat (6) { float i1 = i; repeat (6) { if (v[i1] + v[i] == t || (dist == "coin" && v[i1] + v[i] == t)) { q = q + pr[i1] * pr[i]; } } } mz = max(mz, q); }
    if (dist == "coin") { mz = 0.5; }
    repeat (6) { if (pr[i] > 0) { bar("x" + format(i, 0), v[i], 1.6, H * pr[i]); bar("y" + format(i, 0), a * v[i] + b, -1.6, H * pr[i]); } }
    // X₁ + X₂: свёртка
    // X₁ + X₂: вероятности сумм (свёртка), по одному столбику на каждое значение суммы
    repeat (13) { float t = i; float q = 0;
      repeat (6) { float i1 = i; repeat (6) { if (pr[i1] > 0 && pr[i] > 0 && v[i1] + v[i] == t) { q = q + pr[i1] * pr[i]; } } }
      if (q > 0) { bar("z" + format(t, 0), t, -4.1, 1.9 * q / mz); }
    }
    mark("x", 1.6, ex, sqrt(dx)); mark("y", -1.6, a * ex + b, abs(a) * sqrt(dx)); mark("z", -4.1, 2 * ex, sqrt(2 * dx));
    key = k2;
  }
  info = "**Свойства математического ожидания и дисперсии:** E(aX + b) = a·E X + b; D(aX + b) = a²·D X — сдвиг на b не меняет разброс, растяжение в a раз увеличивает дисперсию в a² раз (а σ — в |a| раз); D X = E X² − (E X)² ≥ 0, D X = 0 только для константы; для **независимых** X и Y: E(X + Y) = E X + E Y и D(X + Y) = D X + D Y.\n\nВ нижней панели дисперсия суммы двух независимых копий вдвое больше, а σ — лишь в √2 раз: разбросы складываются «по Пифагору». Для зависимых величин это неверно: D(X + X) = D(2X) = 4·D X.";
}
]
