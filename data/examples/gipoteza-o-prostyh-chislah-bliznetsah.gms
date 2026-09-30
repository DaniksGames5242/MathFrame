[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Кроме (3, 5) пара близнецов (p, p + 2) имеет вид (6k − 1, 6k + 1). Столбец k: снизу 6k − 1, сверху 6k + 1.
// Синяя точка — простое число, серая — составное, оранжевая пара — близнецы. ----
draw Graph { name = "gC"; graph = "gc"; nodeColor = #888888; nodeRadius = 2; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #f59e0b; edgeWidth = 3; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tb"; pos = (-7.6, -1.6); text = "6k − 1"; size = 0.9; align = left }
draw Text { name = "tu"; pos = (-7.6, 1.6); text = "6k + 1"; size = 0.9; align = left }

new UI { name = "sN"; type = slider; label = "граница N"; variable = N; min = 12; max = 600; step = 6; default = 120 }

// ---- Логика ----
float N = 120; float key = -1; float cnt = 0; float last = 0; float pc = 0;
string info = "";
Function md(x, m) { return x - m * floor(x / m); }
Function isp(x) {
  if (x < 2) { return 0; }
  float r = 1;
  repeat (24) { float d = i + 2; if (d * d <= x && md(x, d) == 0) { r = 0; } }
  return r;
}

Update {
  if (key != N) {
    key = N; cnt = 1; last = 3; pc = 2;
    gc = newGraph(); gp = newGraph(); gt = newGraph();
    float km = floor((N - 1) / 6);
    float sp = min(0.8, 14.4 / km);
    repeat (km) {
      float k = i + 1;
      float x = -7 + (k - 1) * sp + 0.4;
      float lo = 6 * k - 1; float hi = 6 * k + 1;
      float pl = isp(lo); float ph = isp(hi);
      pc = pc + pl + ph;
      string s = format(k, 0);
      if (pl > 0.5 && ph > 0.5) {
        addNode(gt, "b" + s, [x, -1]); addNode(gt, "t" + s, [x, 1]); addEdge(gt, "b" + s, "t" + s);
        cnt = cnt + 1; last = lo;
      }
      if (pl > 0.5 && ph < 0.5) { addNode(gp, "b" + s, [x, -1]); }
      if (pl < 0.5) { addNode(gc, "b" + s, [x, -1]); }
      if (ph > 0.5 && pl < 0.5) { addNode(gp, "t" + s, [x, 1]); }
      if (ph < 0.5) { addNode(gc, "t" + s, [x, 1]); }
    }
  }
  info = "**Гипотеза:** пар простых чисел-близнецов (p, p + 2) бесконечно много. Не доказана.\n\n";
  info = info + "**До N = " + format(N, 0) + "** найдено пар: " + format(cnt, 0) + " (включая (3, 5)); последняя — (" + format(last, 0) + ", " + format(last + 2, 0) + "). Простых чисел до N: " + format(pc, 0) + ".\n\n";
  info = info + "Каждая пара, кроме (3, 5), стоит в столбце 6k − 1, 6k + 1: одно из трёх подряд идущих нечётных чисел делится на 3, поэтому оно и есть 3, либо число 6k между близнецами. Известны пары близнецов с сотнями тысяч цифр, а сумма обратных величин по близнецам сходится (постоянная Бруна ≈ 1,902).";
}
]
