[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Члены последовательности aₙ (n = 1…80 по горизонтали). Вертикальная черта N
// перетаскивается: оранжевая полоса — разброс «хвоста» sup − inf { aₙ : n ≥ N } (посчитан до
// n = 2000), зелёная — допустимая ширина ε. Условие Коши при этом N: оранжевая уже зелёной. ----
new Point { name = "X0"; pos = (-7.4, -4.2); dynamic = false; collision = false; active = false }
new Point { name = "X1"; pos = (7.6, -4.2); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (X0, X1); thickness = 1.5; interact = false }
draw Graph { name = "gSeq"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gTail"; graph = "gt"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 21 }
draw Graph { name = "gBand"; graph = "gb"; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 15 }
new Point { name = "NB"; pos = (-7.4, -4.2); dynamic = false; collision = false; active = false }
new Point { name = "NT"; pos = (-7.4, 4.3); dynamic = false; collision = false; active = false }
new Line { name = "nl"; pos = (NB, NT); active = false }
new Point { name = "NP"; line = "ax"; t = 0.25; text = true("N"); pauseOnDrag = false; color = #f59e0b; layer = 60 }
draw Punctir { name = "pn"; edge = "nl"; color = #f59e0b; thickness = 1.5 }
draw Text { name = "tn"; pos = (NP.pos.x, -4.7); text = "N = " + format(N, 0); size = 0.9; color = #f59e0b }

new UI { name = "sS"; type = select; label = "aₙ"; variable = sq; options = ("alt", "sq2", "harm", "sin"); labels = ("(−1)ⁿ/n", "1 + 1/2² + … + 1/n²", "1 + 1/2 + … + 1/n", "sin n"); default = "harm" }
new UI { name = "sE"; type = slider; label = "ε"; variable = eps; min = 0.02; max = 1; step = 0.01; default = 0.3 }

// ---- Логика ----
string sq = "harm"; float eps = 0.3;
float N = 20; float key = -1;
float lo = 0; float hi = 1; float ymin = 0; float ymax = 1;
float tmin = 0; float tmax = 0;
list A = (0);
string info = "";

Function px(n) { return -7.4 + 15 * (n - 1) / 80; }
Function py(v) { return -3.8 + 7.8 * (v - ymin) / (ymax - ymin); }

Update {
  N = 1 + round(79 * NP.t);
  float sc = 0; if (sq == "sq2") { sc = 1; } if (sq == "harm") { sc = 2; } if (sq == "sin") { sc = 3; }
  float kk = N * 10000 + round(eps * 100) * 10 + sc;
  if (key != kk) {
    // значения до n = 2000 — для честной оценки хвоста
    A = [0]; float s = 0;
    repeat (2000) { float n = i + 1; float a = 0;
      if (sq == "alt") { if (n - 2 * floor(n / 2) == 0) { a = 1 / n; } else { a = -1 / n; } }
      if (sq == "sq2") { s = s + 1 / (n * n); a = s; }
      if (sq == "harm") { s = s + 1 / n; a = s; }
      if (sq == "sin") { a = sin(n); }
      push(A, a);
    }
    ymin = 1000; ymax = -1000; repeat (80) { ymin = min(ymin, A[i + 1]); ymax = max(ymax, A[i + 1]); }
    if (sq == "harm") { ymax = max(ymax, 5.5); }
    float pad = (ymax - ymin) * 0.08; ymin = ymin - pad; ymax = ymax + pad;
    tmin = 1000; tmax = -1000; repeat (2000 - N + 1) { tmin = min(tmin, A[N + i]); tmax = max(tmax, A[N + i]); }
    gs = newGraph(); gt = newGraph();
    repeat (80) { float n = i + 1; if (n < N) { addNode(gs, format(n, 0), [px(n), py(A[n])]); } else { addNode(gt, format(n, 0), [px(n), py(A[n])]); } }
    // полосы: оранжевая — разброс хвоста, зелёная — ε (от нижнего края хвоста)
    gb = newGraph();
    float x1 = px(N); float x2 = 7.6;
    addNode(gb, "a", [x1, py(tmin)]); addNode(gb, "b", [x2, py(tmin)]); addNode(gb, "c", [x2, py(min(tmax, ymax))]); addNode(gb, "d", [x1, py(min(tmax, ymax))]);
    addEdge(gb, "a", "b", 1, "#f59e0b"); addEdge(gb, "b", "c", 1, "#f59e0b"); addEdge(gb, "c", "d", 1, "#f59e0b"); addEdge(gb, "d", "a", 1, "#f59e0b");
    addNode(gb, "e1", [x1 - 0.25, py(tmin)]); addNode(gb, "e2", [x1 - 0.25, py(min(tmin + eps, ymax))]); addEdge(gb, "e1", "e2", 1, "#22c55e");
    NB.pos.x = x1; NT.pos.x = x1;
    key = kk;
  }
  float osc = tmax - tmin;
  info = "**Критерий Коши:** последовательность сходится тогда и только тогда, когда она фундаментальна: для любого ε > 0 найдётся N, что |aₘ − aₙ| < ε при всех m, n ≥ N — все члены «хвоста» лежат в полосе ширины ε. Критерий хорош тем, что не требует знать предел заранее; он выражает полноту ℝ.\n\nε = " + format(eps, 2) + ", N = " + format(N, 0) + ":  разброс хвоста sup − inf = " + format(osc, 3);
  if (osc < eps) { info = info + " < ε — **условие выполнено** при этом N."; } else { info = info + " ≥ ε — нужно N побольше."; }
  if (sq == "harm") { info = info + " Но для гармонических сумм это ловушка: соседние члены сближаются (aₙ₊₁ − aₙ = 1/(n+1) → 0), а разброс хвоста бесконечен — сумма от N + 1 до 2N всегда больше ½. Здесь хвост посчитан до n = 2000, дальше он растёт без предела, так что никакое N не подходит: последовательность **не фундаментальна** и расходится."; }
  if (sq == "sin") { info = info + " Последовательность sin n ограничена, но её хвост при любом N заполняет почти весь отрезок [−1; 1]: она не фундаментальна и не сходится."; }
  if (sq == "alt" || sq == "sq2") { info = info + " Сходится: при любом ε подходящее N найдётся."; }
}
]
