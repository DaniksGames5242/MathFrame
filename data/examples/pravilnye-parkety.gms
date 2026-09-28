[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Три правильных паркета — треугольный, квадратный, шестиугольный — выбираются
// кнопками; размер плитки a меняется ползунком (сама укладка при этом не искажается,
// только масштабируется). Один узел выделен акцентным цветом — показать число плиток,
// сходящихся в нём (6, 4 или 3 соответственно). ----
draw Graph { name = "mesh"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "hub"; graph = "gh"; nodeColor = #f59e0b; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 10 }

new UI { name = "bTri"; type = button; label = "Треугольный"; action = "kind = 0" }
new UI { name = "bSq";  type = button; label = "Квадратный";  action = "kind = 1" }
new UI { name = "bHex"; type = button; label = "Шестиугольный"; action = "kind = 2" }
new UI { name = "sA"; type = slider; label = "сторона a"; variable = a; min = 0.8; max = 2.2; step = 0.05; default = 1.4 }

// ---- Логика ----
float kind = 0;
float a = 1.4;
float key = -1;
string info = "";

Update {
  if (key != kind * 100000 + round(a * 1000)) {
    g = newGraph(); gh = newGraph();
    if (kind == 0) {
      // Треугольный паркет: ряды узлов, нечётные сдвинуты на a/2; каждый узел соединён
      // с соседями в ряду и с двумя узлами следующего ряда.
      float h = a * 0.8660254;
      float ny = round(12 / h) + 2;
      float nx = round(16 / a) + 2;
      repeat (24) { float j = i; if (j <= ny) {
        float off = 0; if (j - 2 * floor(j / 2) == 1) { off = a / 2; }
        repeat (24) { float ii = i; if (ii <= nx) {
          addNode(g, "p" + format(j, 0) + "_" + format(ii, 0), [-8 - a + ii * a + off, -6 - h + j * h]);
        } }
      } }
      repeat (24) { float j = i; if (j <= ny) {
        float odd = 0; if (j - 2 * floor(j / 2) == 1) { odd = 1; }
        repeat (24) { float ii = i; if (ii <= nx) {
          if (ii < nx) { addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j, 0) + "_" + format(ii + 1, 0)); }
          if (j < ny) {
            addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j + 1, 0) + "_" + format(ii, 0));
            if (odd == 1) { if (ii < nx) { addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j + 1, 0) + "_" + format(ii + 1, 0)); } }
            else { if (ii >= 1) { addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j + 1, 0) + "_" + format(ii - 1, 0)); } }
          }
        } }
      } }
      float hj = 4; float hx = -8 - a + 5 * a; float hy = -6 - h + hj * h;
      gh = newGraph(); addNode(gh, "hv", [hx, hy]);
    } else if (kind == 1) {
      float nx = round(16 / a) + 2; float ny = round(12 / a) + 2;
      repeat (24) { float j = i; if (j <= ny) {
        repeat (24) { float ii = i; if (ii <= nx) {
          addNode(g, "p" + format(j, 0) + "_" + format(ii, 0), [-8 - a + ii * a, -6 - a + j * a]);
        } }
      } }
      repeat (24) { float j = i; if (j <= ny) {
        repeat (23) { float ii = i; if (ii <= nx - 1) {
          addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j, 0) + "_" + format(ii + 1, 0));
        } }
      } }
      repeat (23) { float j = i; if (j <= ny - 1) {
        repeat (24) { float ii = i; if (ii <= nx) {
          addEdge(g, "p" + format(j, 0) + "_" + format(ii, 0), "p" + format(j + 1, 0) + "_" + format(ii, 0));
        } }
      } }
      float hx = -8 - a + 5 * a; float hy = -6 - a + 4 * a;
      gh = newGraph(); addNode(gh, "hv", [hx, hy]);
    } else {
      // Шестиугольный паркет: строим как шестиугольники со стороной a (flat-top),
      // центры сетки треугольной решётки с шагом d по горизонтали и dv по вертикали.
      float d = a * 1.7320508; float dv = a * 1.5;
      float ny = round(12 / dv) + 2; float nxx = round(16 / d) + 2;
      repeat (24) { float row = i; if (row <= ny) {
        float off = 0; if (row - 2 * floor(row / 2) == 1) { off = d / 2; }
        float cy = -6 - dv + row * dv;
        repeat (24) { float col = i; if (col <= nxx) {
          float cx = -8 - d + col * d + off;
          string tag = "h" + format(row, 0) + "_" + format(col, 0);
          repeat (6) { float ang = 0.5235987755 + i * 60 * 0.0174532925; addNode(g, tag + "_" + format(i, 0), [cx + a * cos(ang), cy + a * sin(ang)]); }
          repeat (6) { float j2 = i + 1; if (j2 >= 6) { j2 = 0; } addEdge(g, tag + "_" + format(i, 0), tag + "_" + format(j2, 0)); }
        } }
      } }
      // Вершина шестиугольника ячейки (2, 2), угол 30° — общая точка трёх шестиугольников.
      float hrow = 2; float hoff = 0; if (hrow - 2 * floor(hrow / 2) == 1) { hoff = d / 2; }
      float hcx = -8 - d + 2 * d + hoff; float hcy = -6 - dv + hrow * dv;
      float hx = hcx + a * cos(0.5235987755); float hy = hcy + a * sin(0.5235987755);
      gh = newGraph(); addNode(gh, "hv", [hx, hy]);
    }
    key = kind * 100000 + round(a * 1000);
  }

  string nm = "треугольный"; float meet = 6;
  if (kind == 1) { nm = "квадратный"; meet = 4; }
  if (kind == 2) { nm = "шестиугольный"; meet = 3; }
  info = "**Правильный " + nm + " паркет** — единственные три вершинно-транзитивных замощения плоскости одним видом правильного многоугольника. Сторона плитки a = " + format(a, 2) + ".\n\n**В каждой вершине сходятся ровно " + format(meet, 0) + " плиток** (отмечена оранжевым) — только эти три значения n дают целое решение углового условия (n − 2)(k − 2) = 4 среди правильных многоугольников.";
}
]
