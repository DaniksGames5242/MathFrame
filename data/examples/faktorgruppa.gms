[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Группа ℤₙ (остатки 0…n−1 по кругу) и её подгруппа H = ⟨d⟩ ----
// Смежные классы k + H раскрашены в разные цвета; каждый — правильный многоугольник.
// Выбранные a, b и a + b выделены серым.
draw Graph { name = "gC0"; graph = "c0"; nodeColor = #3b82f6; edgeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }
draw Graph { name = "gC1"; graph = "c1"; nodeColor = #f59e0b; edgeColor = #f59e0b; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }
draw Graph { name = "gC2"; graph = "c2"; nodeColor = #22c55e; edgeColor = #22c55e; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }
draw Graph { name = "gC3"; graph = "c3"; nodeColor = #a855f7; edgeColor = #a855f7; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }
draw Graph { name = "gC4"; graph = "c4"; nodeColor = #ef4444; edgeColor = #ef4444; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }
draw Graph { name = "gC5"; graph = "c5"; nodeColor = #14b8a6; edgeColor = #14b8a6; nodeRadius = 13; interactive = false; showWeights = false; highlight = "sel"; highlightColor = #6b7280 }

new UI { name = "sN"; type = select; label = "n"; variable = n; options = (12, 18, 24); default = 12 }
new UI { name = "sD"; type = select; label = "d (H = ⟨d⟩)"; variable = dsel; options = (2, 3, 4, 6); default = 3 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 0; max = 23; step = 1; default = 1 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 0; max = 23; step = 1; default = 4 }

// ---- Логика ----
float n = 12;
float dsel = 3;
float a = 1; float b = 4;
float lastKey = -1;
string info = "";

Function md(x, m) { return x - floor(x / m) * m; }
Function pos(k) { return [4.2 * cos(pi / 2 - 2 * pi * k / n), 4.2 * sin(pi / 2 - 2 * pi * k / n)]; }
Function addTo(c, k) {
  if (c == 0) { addNode(c0, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c0, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c0, format(k, 0), format(md(k + dsel, n), 0)); } }
  if (c == 1) { addNode(c1, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c1, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c1, format(k, 0), format(md(k + dsel, n), 0)); } }
  if (c == 2) { addNode(c2, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c2, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c2, format(k, 0), format(md(k + dsel, n), 0)); } }
  if (c == 3) { addNode(c3, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c3, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c3, format(k, 0), format(md(k + dsel, n), 0)); } }
  if (c == 4) { addNode(c4, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c4, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c4, format(k, 0), format(md(k + dsel, n), 0)); } }
  if (c == 5) { addNode(c5, format(k, 0), pos(k)); if (k >= dsel) { addEdge(c5, format(k - dsel, 0), format(k, 0)); } if (k + dsel >= n) { addEdge(c5, format(k, 0), format(md(k + dsel, n), 0)); } }
  return 0;
}
// Класс k + H как множество
Function cosetText(k) {
  string s = "{";
  repeat (n / dsel) { if (i > 0) { s = s + ", "; } s = s + format(md(k + i * dsel, n), 0); }
  return s + "}";
}

Update {
  if (a > n - 1) { a = n - 1; } if (b > n - 1) { b = n - 1; }
  if (n * 10 + dsel != lastKey) {
    c0 = newGraph();
    c1 = newGraph();
    c2 = newGraph();
    c3 = newGraph();
    c4 = newGraph();
    c5 = newGraph();
    repeat (n) { addTo(md(i, dsel), i); }
    lastKey = n * 10 + dsel;
  }
  float s = md(a + b, n);
  sel = [format(a, 0), format(b, 0), format(s, 0)];
  info = "**Факторгруппа** ℤ" + format(n, 0) + " / H, где H = ⟨" + format(dsel, 0) + "⟩ = " + cosetText(0) + ": её элементы — смежные классы k + H (" + format(dsel, 0) + " класса, по цветам), а сложение классов определено через представителей: (a + H) + (b + H) = (a + b) + H — результат не зависит от выбора представителей.\n\n(" + format(a, 0) + " + H) + (" + format(b, 0) + " + H) = " + format(s, 0) + " + H = " + cosetText(s) + ".   Итог: ℤ" + format(n, 0) + " / ⟨" + format(dsel, 0) + "⟩ ≅ ℤ" + format(dsel, 0) + ".";
}
]
