[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числа 1…100 в таблице 10×10, цвет — значение μ: зелёный μ = 1, жёлтый μ = −1, синий μ = 0. Кольцами обведены
// выбранное n (крупное кольцо) и все его делители — по ним берётся сумма Σ μ(d). ----
draw Graph { name = "gRn"; graph = "grn"; nodeRadius = 25; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gRd"; graph = "grd"; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gRm"; graph = "grm"; nodeColor = #3b82f6; nodeRadius = 20; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #22c55e; nodeRadius = 16; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 16; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gZ"; graph = "gz"; nodeColor = #3b82f6; nodeRadius = 16; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gLg"; graph = "glg"; nodeColor = #22c55e; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gLm"; graph = "glm"; nodeColor = #f59e0b; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gLz"; graph = "glz"; nodeColor = #3b82f6; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t1"; pos = (3.6, 1.9); text = "μ = 1: чётное число простых"; size = 0.95; align = left }
draw Text { name = "t2"; pos = (3.6, 1.1); text = "μ = −1: нечётное число простых"; size = 0.95; align = left }
draw Text { name = "t3"; pos = (3.6, 0.3); text = "μ = 0: есть квадрат простого"; size = 0.95; align = left }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 100; step = 1; default = 30 }
new UI { name = "sM"; type = slider; label = "m"; variable = m; min = 1; max = 100; step = 1; default = 12 }

// ---- Логика ----
float n = 30; float m = 12; float key = -1; float built = 0;
string info = "";

Function cx(k) { return -7.3 + 0.9 * md(k - 1, 10); }
Function cy(k) { return 4.1 - 0.9 * floor((k - 1) / 10); }

Update {
  if (built == 0) {
    built = 1;
    gp = newGraph(); gm = newGraph(); gz = newGraph();
    repeat (100) {
      float k = i + 1; float v = mu(k);
      if (v == 1) { addNode(gp, "k" + format(k, 0), [cx(k), cy(k)], format(k, 0)); }
      if (v == -1) { addNode(gm, "k" + format(k, 0), [cx(k), cy(k)], format(k, 0)); }
      if (v == 0) { addNode(gz, "k" + format(k, 0), [cx(k), cy(k)], format(k, 0)); }
    }
    glg = newGraph(); addNode(glg, "l", [3.0, 1.9]);
    glm = newGraph(); addNode(glm, "l", [3.0, 1.1]);
    glz = newGraph(); addNode(glz, "l", [3.0, 0.3]);
  }
  if (key != n * 1000 + m) {
    key = n * 1000 + m;
    grn = newGraph(); grd = newGraph(); grm = newGraph();
    addNode(grn, "n", [cx(n), cy(n)]);
    addNode(grm, "m", [cx(m), cy(m)]);
    string terms = ""; string vals = ""; float tot = 0;
    repeat (n) {
      float d = i + 1;
      if (md(n, d) == 0) {
        if (d != n) { addNode(grd, "d" + format(d, 0), [cx(d), cy(d)]); }
        float v = mu(d); tot = tot + v;
        if (terms != "") { terms = terms + " + "; vals = vals + " + "; }
        terms = terms + "μ(" + format(d, 0) + ")"; vals = vals + pn(v);
      }
    }
    float mn = mu(n); float k = omg(n);
    float sqp = 0; repeat (n) { float p = i + 2; if (sqp == 0 && md(n, p * p) == 0 && p * p <= n) { sqp = p; } }
    info = "**Функция Мёбиуса:** μ(1) = 1; μ(n) = 0, если n делится на квадрат простого; иначе μ(n) = (−1)ᵏ, где k — число различных простых делителей n. ";
    if (n == 1) { info = info + "Для n = 1 по определению **μ(1) = 1**."; }
    else {
      if (sqp > 0) { info = info + "Здесь n = " + format(n, 0) + " = " + fac(n) + " делится на " + format(sqp, 0) + "² = " + format(sqp * sqp, 0) + ", поэтому **μ(" + format(n, 0) + ") = 0**."; }
      else { info = info + "Здесь n = " + format(n, 0) + " = " + fac(n) + " не делится на квадраты, k = " + format(k, 0) + ", поэтому **μ(" + format(n, 0) + ") = (−1)" + sup(k) + " = " + ni(mn) + "**."; }
    }
    info = info + "\n\n**Сумма по делителям:** " + terms + " = " + vals + " = **" + ni(tot) + "**. ";
    if (n == 1) { info = info + "Только для n = 1 эта сумма равна 1, для всех n > 1 она равна 0: ненулевые слагаемые — делители без квадратов, и чётных наборов простых ровно столько же, сколько нечётных."; }
    else { info = info + "Для n > 1 сумма всегда равна нулю: среди делителей без квадратов наборов с чётным и нечётным числом простых поровну."; }
    float mm = mu(m); float mnm = mu(n * m); float g = gd(n, m);
    info = info + "\n\n**Произведение.** Для m = " + format(m, 0) + " (серое кольцо): μ(m) = " + ni(mm) + ", μ(nm) = μ(" + format(n * m, 0) + ") = " + ni(mnm) + ", μ(n)·μ(m) = " + ni(mn * mm) + ", НОД(n, m) = " + format(g, 0) + ". ";
    if (g == 1) { info = info + "Числа взаимно просты — равенство μ(nm) = μ(n)·μ(m) выполнено."; }
    else if (mnm == mn * mm) { info = info + "Числа не взаимно просты; здесь равенство выполнено, но гарантии нет."; }
    else { info = info + "Числа не взаимно просты, и равенство нарушено: общий простой множитель даёт квадрат в nm."; }
  }
}
Function md(a, b) { return a - floor(a / b) * b; }
Function gd(a, b) { float x = abs(a); float y = abs(b); repeat (40) { if (y > 0) { float r = x - floor(x / y) * y; x = y; y = r; } } return x; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ni(x) { return num(x, 0); }
Function pn(x) { if (x < 0) { return "(−" + format(-x, 0) + ")"; } return format(x, 0); }
Function tau(n) { float c = 0; repeat (n) { if (md(n, i + 1) == 0) { c = c + 1; } } return c; }
Function sig(n) { float c = 0; repeat (n) { if (md(n, i + 1) == 0) { c = c + i + 1; } } return c; }
Function phi(n) { float c = 0; repeat (n) { if (gd(n, i + 1) == 1) { c = c + 1; } } return c; }
Function omg(n) { float x = n; float c = 0; repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { repeat (12) { if (md(x, p) == 0) { x = x / p; } } c = c + 1; } } return c; }
Function mu(n) {
  if (n == 1) { return 1; }
  float x = n; float c = 0; float sq = 1;
  repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } } c = c + 1; if (e > 1) { sq = 0; } } }
  if (sq == 0) { return 0; }
  if (md(c, 2) == 0) { return 1; }
  return -1;
}
Function sd(e) { if (e == 0) { return "⁰"; } if (e == 1) { return "¹"; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } if (e == 8) { return "⁸"; } return "⁹"; }
Function sup(e) { if (e < 10) { return sd(e); } return sd(floor(e / 10)) + sd(md(e, 10)); }
Function fac(n) {
  if (n == 1) { return "1"; }
  string s = ""; float x = n;
  repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } } if (s != "") { s = s + "·"; } s = s + format(p, 0); if (e > 1) { s = s + sup(e); } } }
  return s;
}
]
