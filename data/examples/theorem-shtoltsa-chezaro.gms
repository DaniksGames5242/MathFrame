[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Точки: aₙ/bₙ (синие) и разности (aₙ₊₁ − aₙ)/(bₙ₊₁ − bₙ) (жёлтые); зелёная линия — предел
// отношения разностей; тонкий штрих — выбранный номер n. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gD"; graph = "gd"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }

new UI { name = "sK"; type = select; label = "aₙ, bₙ"; variable = cs; options = ("1", "2", "3", "4", "5"); labels = ("(2n² + n) / n²", "n² / n³", "(1 + ½ + … + 1/n) / ln n", "ln n! / (n ln n)", "(n + (−1)ⁿ) / n"); default = "1" }
new UI { name = "sN"; type = slider; label = "членов"; variable = N; min = 10; max = 80; step = 1; default = 40 }
new UI { name = "sC"; type = slider; label = "номер n"; variable = nc; min = 2; max = N - 1; step = 1; default = 10 }

// ---- Логика ----
string cs = "1"; float N = 40; float nc = 10;
float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function A(n) {
  float s = 0;
  if (cs == "1") { return 2 * n * n + n; }
  if (cs == "2") { return n * n; }
  if (cs == "3") { repeat (n) { s = s + 1 / (i + 1); } return s; }
  if (cs == "4") { repeat (n) { s = s + log(i + 1); } return s; }
  return n + 1 - 2 * (n - 2 * floor(n / 2));
}
Function B(n) {
  if (cs == "1") { return n * n; }
  if (cs == "2") { return n * n * n; }
  if (cs == "3") { return log(n); }
  if (cs == "4") { return n * log(n); }
  return n;
}
Function R(n) { return A(n) / B(n); }
Function D(n) { return (A(n + 1) - A(n)) / (B(n + 1) - B(n)); }
Function lim() { if (cs == "2") { return 0; } if (cs == "1") { return 2; } return 1; }
Function lo() { if (cs == "5") { return -1; } return 0; }
Function hi() { if (cs == "5") { return 3; } if (cs == "2") { return 1; } if (cs == "1") { return 4; } if (cs == "3") { return 2.5; } return 1.5; }
Function px(n) { return -7 + 14.4 * (n - 2) / (N - 2); }
Function py(v) { return -4.2 + 8.4 * (v - lo()) / (hi() - lo()); }

Update {
  float k = 0;
  if (cs == "2") { k = 1; } if (cs == "3") { k = 2; } if (cs == "4") { k = 3; } if (cs == "5") { k = 4; }
  if (key != N * 10 + k) {
    gg = newGraph(); gl = newGraph(); ga = newGraph(); gd = newGraph();
    float v = lo();
    float st = 1; if (cs == "3") { st = 0.5; } if (cs == "2") { st = 0.5; }
    repeat (10) {
      if (v <= hi() + 0.001) {
        string s = "g" + format(i, 0);
        addNode(gg, s + "a", [-7.5, py(v)], format(v, 1)); addNode(gg, s + "b", [7.5, py(v)], " "); addEdge(gg, s + "a", s + "b");
        v = v + st;
      }
    }
    addNode(gl, "l1", [-7.5, py(lim())]); addNode(gl, "l2", [7.5, py(lim())]); addEdge(gl, "l1", "l2");
    repeat (N - 2) {
      float n = i + 2;
      addNode(ga, "a" + format(n, 0), [px(n), py(R(n))]);
      addNode(gd, "d" + format(n, 0), [px(n), py(D(n))]);
    }
    key = N * 10 + k;
  }
  gc = newGraph();
  addNode(gc, "c1", [px(nc), -4.5]); addNode(gc, "c2", [px(nc), 4.5]); addEdge(gc, "c1", "c2");
  info = "**Теорема Штольца — Чезаро.** Пусть bₙ строго возрастает и bₙ → ∞. Если существует lim (aₙ₊₁ − aₙ) / (bₙ₊₁ − bₙ), то существует и lim aₙ/bₙ, причём они равны. Синие точки — aₙ/bₙ, жёлтые — отношение разностей, зелёная линия — предел отношения разностей.\n\n";
  info = info + "**n = " + format(nc, 0) + ":** aₙ = " + num(A(nc), 3) + ", bₙ = " + num(B(nc), 3) + ", aₙ/bₙ = " + num(R(nc), 3) + ", (aₙ₊₁ − aₙ)/(bₙ₊₁ − bₙ) = " + num(D(nc), 3) + ".\n\n";
  if (cs == "1") { info = info + "Разности: (4n + 3)/(2n + 1) → 2, поэтому и aₙ/bₙ = 2 + 1/n → 2."; }
  if (cs == "2") { info = info + "Разности: (2n + 1)/(3n² + 3n + 1) → 0, поэтому и aₙ/bₙ = 1/n → 0."; }
  if (cs == "3") { info = info + "Неопределённость ∞/∞. Разности: 1/(n + 1) : ln((n + 1)/n) → 1, поэтому aₙ/bₙ → 1 (сходимость медленная)."; }
  if (cs == "4") { info = info + "Неопределённость ∞/∞. Разности: ln(n + 1) : ((n + 1) ln(n + 1) − n ln n) → 1, поэтому aₙ/bₙ → 1."; }
  if (cs == "5") { info = info + "Разности принимают значения 3 и −1 поочерёдно — предела нет, а aₙ/bₙ = 1 + (−1)ⁿ/n → 1. Обратное утверждение неверно: из существования предела отношения не следует существование предела отношения разностей."; }
}
]
