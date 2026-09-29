[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Перестановка — биекция позиций (сверху) на элементы (снизу): каждый элемент встречается
// ровно один раз. Ползунок p выбирает перестановку по номеру в лексикографическом порядке. ----
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gN"; graph = "gn"; nodeRadius = 20; nodeColor = #3b82f622; labels = true; interactive = false; showWeights = false; layer = 8 }
draw Text { name = "lt"; pos = (-7.7, 3.6); text = "позиции"; size = 0.9; align = left }
draw Text { name = "lb"; pos = (-7.7, -3.6); text = "элементы"; size = 0.9; align = left }

new UI { name = "sN"; type = slider; label = "n элементов"; variable = n; min = 2; max = 7; step = 1; default = 4 }
new UI { name = "sP"; type = slider; label = "номер перестановки"; variable = p; min = 1; max = fact(n); step = 1; default = 9 }

// ---- Логика ----
float n = 4; float p = 9; float key = -1; float inv = 0;
list rem = [0, 1, 2, 3, 4, 5, 6]; list pi = [0, 0, 0, 0, 0, 0, 0];
string info = "";

Function fact(m) { float f = 1; repeat (m) { f = f * (i + 1); } return f; }
Function md(a, b) { return a - floor(a / b) * b; }
Function fx(m) { float x = -6 + 12 * m / (n - 1); return x; }

Update {
  if (key != n * 10000 + p) {
    float f = p - 1;
    repeat (7) { rem[i] = i; }
    repeat (n) {
      float j = i; float fc = fact(n - 1 - j); float q = floor(f / fc); f = f - q * fc;
      pi[j] = rem[q];
      repeat (7) { if (i >= q) { rem[i] = rem[i + 1]; } }
    }
    gp = newGraph(); gn = newGraph(); inv = 0;
    repeat (n) {
      float j = i;
      addNode(gn, "t" + format(j, 0), [fx(j), 3.0], format(j + 1, 0));
      addNode(gn, "b" + format(j, 0), [fx(j), -3.0], format(j + 1, 0));
      repeat (n) { if (i > j && pi[i] < pi[j]) { inv = inv + 1; } }
    }
    repeat (n) { addNode(gp, "t" + format(i, 0), [fx(i), 2.5]); addNode(gp, "b" + format(i, 0), [fx(pi[i]), -2.5]); addEdge(gp, "t" + format(i, 0), "b" + format(i, 0)); }
    key = n * 10000 + p;
  }
  string w = ""; repeat (n) { w = w + format(pi[i] + 1, 0); if (i < n - 1) { w = w + " "; } }
  string prod = ""; repeat (n) { prod = prod + format(n - i, 0); if (i < n - 1) { prod = prod + " · "; } }
  info = "**Перестановка без повторений** из n = " + format(n, 0) + " различимых элементов — упорядоченный набор из всех элементов, каждый ровно один раз. Выбранная (№ " + format(p, 0) + "): **" + w + "**; все элементы использованы, ни один не повторяется.\n\n";
  info = info + "**Сколько их:** на первую позицию — " + format(n, 0) + " элементов, на вторую — на один меньше, и так далее, по правилу произведения n! = " + prod + " = **" + format(fact(n), 0) + "**. Инверсий (пар, стоящих не по порядку) в выбранной перестановке: " + format(inv, 0) + ".";
}
]
