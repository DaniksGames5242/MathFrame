[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Выбранный конечный набор простых (сверху), N = их произведение + 1 (в центре),
// простые делители N (снизу) — ни один из них не входит в набор ----
draw Graph { name = "gSet"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 20; interactive = false; showWeights = false }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; edgeColor = #22c55e; nodeRadius = 26; directed = true; interactive = false; showWeights = false }
draw Graph { name = "gF"; graph = "gf"; nodeColor = #22c55e; nodeRadius = 22; interactive = false; showWeights = false }

new UI { name = "t2"; type = toggle; label = "2"; variable = u2; default = true }
new UI { name = "t3"; type = toggle; label = "3"; variable = u3; default = true }
new UI { name = "t5"; type = toggle; label = "5"; variable = u5; default = true }
new UI { name = "t7"; type = toggle; label = "7"; variable = u7; default = false }
new UI { name = "t11"; type = toggle; label = "11"; variable = u11; default = false }
new UI { name = "t13"; type = toggle; label = "13"; variable = u13; default = false }

// ---- Логика ----
bool u2 = true; bool u3 = true; bool u5 = true; bool u7 = false; bool u11 = false; bool u13 = false;
float N = 0;
float lastKey = -1;
float cnt = 0;
string setText = ""; string facText = ""; string modText = "";
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function use(p) {
  if (p == 2) { return u2; } if (p == 3) { return u3; } if (p == 5) { return u5; }
  if (p == 7) { return u7; } if (p == 11) { return u11; } return u13;
}
Function pr(k) { if (k == 0) { return 2; } if (k == 1) { return 3; } if (k == 2) { return 5; } if (k == 3) { return 7; } if (k == 4) { return 11; } return 13; }

Update {
  float key = 0;
  repeat (6) { if (use(pr(i))) { key = key + pow(2, i); } }
  if (key == 0) { u2 = true; key = 1; }
  if (key != lastKey) {
    gs = newGraph(); gn = newGraph(); gf = newGraph();
    // выбранные простые — сверху в ряд
    cnt = 0; N = 1; setText = ""; modText = "";
    repeat (6) { if (use(pr(i))) { cnt = cnt + 1; } }
    float j = 0;
    repeat (6) {
      float p = pr(i);
      if (use(p)) {
        addNode(gs, format(p, 0), [(j - (cnt - 1) / 2) * 2.2, 3.6]);
        N = N * p; j = j + 1;
        if (setText != "") { setText = setText + " · "; }
        setText = setText + format(p, 0);
      }
    }
    N = N + 1;
    repeat (6) { if (use(pr(i))) { if (modText != "") { modText = modText + ", "; } modText = modText + "N mod " + format(pr(i), 0) + " = " + format(md(N, pr(i)), 0); } }
    addNode(gn, format(N, 0), [0, 0.3]);
    // разложение N на простые множители
    float m = N; float d = 2; float nf = 0; facText = "";
    float fx = 0; list fs = [0];
    repeat (400) {
      if (m > 1 && d * d <= m) {
        if (md(m, d) == 0) { m = m / d; if (nf == 0 || fs[nf] != d) { nf = nf + 1; push(fs, d); } if (facText != "") { facText = facText + " · "; } facText = facText + format(d, 0); }
        else { d = d + 1; }
      }
    }
    if (m > 1) { nf = nf + 1; push(fs, m); if (facText != "") { facText = facText + " · "; } facText = facText + format(m, 0); }
    if (nf == 1 && fs[1] == N) { nf = 0; facText = "простое число — оно само и есть новое простое"; }
    repeat (nf) {
      addNode(gf, format(fs[i + 1], 0), [(i - (nf - 1) / 2) * 2.6, -3.4]);
      addNode(gn, format(fs[i + 1], 0), [(i - (nf - 1) / 2) * 2.6, -3.4]);
      addEdge(gn, format(N, 0), format(fs[i + 1], 0));
    }
    lastKey = key;
  }
  info = "**Теорема Евклида:** простых чисел бесконечно много. Возьмём любой конечный набор простых p₁, …, pₖ (синие) и число N = p₁·…·pₖ + 1 (оранжевое). При делении на каждое pᵢ оно даёт остаток 1, значит, ни одно из них не делит N. Но N > 1 имеет хотя бы один простой делитель (зелёные) — это простое число, которого в наборе нет. Значит, никакой конечный набор не содержит всех простых.\n\nN = " + setText + " + 1 = " + format(N, 0) + " = " + facText + ";   " + modText + ".";
}
]
