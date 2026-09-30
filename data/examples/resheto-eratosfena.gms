[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float N = 100; float st = 0; float key = -1; float smax = 4; float pcur = 0; float ncr = 0; string lst = ""; string info = "";
new UI { type = slider; label = "N"; variable = N; min = 30; max = 100; step = 1; default = 100 }
new UI { type = slider; label = "шаг"; variable = st; min = 0; max = smax; step = 1; default = 0 }
draw Graph { name = "gA"; graph = "g1"; nodeColor = #f59e0b; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB"; graph = "g2"; nodeColor = #3b82f6; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gG"; graph = "g3"; nodeColor = #22c55e; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gD"; graph = "g4"; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
Function md(x, y) { return x - y * floor(x / y); }
Function spf(m) { float d = 2; repeat (10) { if (d * d <= m && md(m, d) != 0) { d = d + 1; } } if (d * d > m) { return m; } return d; }
Function isp(m) { if (m < 2) { return 0; } if (spf(m) == m) { return 1; } return 0; }
Function rank(p) { float r = 0; repeat (10) { if (i + 2 <= p && isp(i + 2) == 1) { r = r + 1; } } return r; }
Function gx(m) { return -6.9 + 1.5333 * md(m - 1, 10); }
Function gy(m) { return 4.3 - 0.95 * floor((m - 1) / 10); }
Update {
  N = round(N); st = round(st);
  smax = rank(floor(sqrt(N)));
  if (st > smax) { st = smax; }
  if (key != N * 100 + st) {
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); g4 = newGraph();
    pcur = 0; ncr = 0; lst = "";
    repeat (10) { if (rank(i + 2) == st && isp(i + 2) == 1 && st > 0) { pcur = i + 2; } }
    repeat (100) {
      float m = i + 1;
      if (m > 1 && m <= N) {
        string lb = format(m, 0); float p = spf(m);
        if (isp(m) == 1) {
          if (st == smax || m <= pcur) { addNode(g3, lb, [gx(m), gy(m)], lb); } else { addNode(g4, lb, [gx(m), gy(m)], lb); }
        } else {
          float rk = rank(p);
          if (rk < st) { addNode(g2, lb, [gx(m), gy(m)], lb); }
          else { if (rk == st) { addNode(g1, lb, [gx(m), gy(m)], lb); ncr = ncr + 1; if (ncr <= 8) { if (lst != "") { lst = lst + ", "; } lst = lst + lb; } } else { addNode(g4, lb, [gx(m), gy(m)], lb); } }
        }
      }
    }
    key = N * 100 + st;
  }
  info = "**Решето Эратосфена** для N = " + format(N, 0) + ": из чисел 2, 3, …, N по очереди вычёркиваются кратные простых p ≤ √N ≈ " + format(sqrt(N), 1) + " (таких простых " + format(smax, 0) + ").\n\n";
  if (st == 0) { info = info + "Начальный набор: все числа от 2 до " + format(N, 0) + " (единица не рассматривается)."; }
  else { info = info + "Шаг " + format(st, 0) + ": p = **" + format(pcur, 0) + "** — простое, вычёркиваем его кратные, начиная с p² = " + format(pcur * pcur, 0) + ": " + lst + (ncr > 8 ? ", …" : "") + " (новых вычеркнуто " + format(ncr, 0) + ")."; }
  if (st == smax) { float cp = 0; repeat (100) { if (i + 2 <= N && isp(i + 2) == 1) { cp = cp + 1; } } info = info + "\n\nПосле шага " + format(smax, 0) + " каждое невычеркнутое число — простое: до " + format(N, 0) + " их **" + format(cp, 0) + "** (зелёные)."; }
  else { info = info + "\n\nЗелёные — уже найденные простые, оранжевые — вычеркнуты на этом шаге, синие — на прошлых."; }
}
]
