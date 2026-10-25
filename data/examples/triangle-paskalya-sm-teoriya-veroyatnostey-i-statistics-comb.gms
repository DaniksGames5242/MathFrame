[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Таблица: строка n — коэффициенты (a + b)^n; числа сидят в узлах графа ----
// g0 — вся таблица (бледные рёбра); g2, g3, g1 — выделения поверх неё.
draw Graph { name = "gBase"; graph = "g0"; nodeRadius = 15; labels = true; interactive = false; showWeights = false; edgeColor = #6b728055; edgeWidth = 1; layer = 10 }
draw Graph { name = "gBlue"; graph = "g2"; nodeRadius = 15; labels = true; interactive = false; showWeights = false; nodeColor = #3b82f6; layer = 11 }
draw Graph { name = "gGreen"; graph = "g3"; nodeRadius = 15; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
draw Graph { name = "gOrange"; graph = "g1"; nodeRadius = 15; labels = true; interactive = false; showWeights = false; nodeColor = #f59e0b; layer = 12 }

// Точка выбора: ближайшая к ней клетка таблицы выделяется
new Point { name = "P"; pos = (0, 0.4); size = 0.35; pauseOnDrag = false; collideWithPoints = false; layer = 20 }

float N = 6;
float tab = 1;
new UI { name = "btnRec"; type = button; label = "Сумма двух чисел сверху"; action = "tab = 1" }
new UI { name = "btnRow"; type = button; label = "Строка"; action = "tab = 2" }
new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tab = 3" }
new UI { name = "btnPath"; type = button; label = "Пути"; action = "tab = 4" }
new UI { name = "sN"; type = slider; label = "число строк"; variable = N; min = 3; max = 8; step = 1; default = 6 }

string info = "";
float key = -1;
float selR = 4; float selC = 2;
float stepX = 1.7; float stepY = 1.15; float topY = 5;

func cx(r, c) = (c - r / 2) * stepX;
func cy(r) = topY - r * stepY;
func nm(r, c) = "n" + format(r, 0) + "_" + format(c, 0);
// Биномиальные коэффициенты строятся так же, как и в таблице: без факториалов
Function C(n, k) {
  float v = 1;
  repeat (8) { if (i < k) { v = v * (n - i) / (i + 1); } }
  return round(v);
}
Function put(gr, r, c) { addNode(gr, nm(r, c), [cx(r, c), cy(r)], format(C(r, c), 0)); }
Function inRegion(r, c) {
  if (c > selC) { return false; }
  if (r - c > selR - selC) { return false; }
  return true;
}
Function ordName(k) {
  if (k == 0) { return "единицы"; }
  if (k == 1) { return "натуральные числа"; }
  if (k == 2) { return "треугольные числа"; }
  if (k == 3) { return "тетраэдральные числа"; }
  return "числа высшего порядка";
}
Function rowList(n, alt) {
  string s = "";
  repeat (9) {
    if (i <= n) {
      string part = format(C(n, i), 0);
      if (i == 0) { s = part; }
      else {
        if (alt == 1 && i % 2 == 1) { s = s + " − " + part; }
        else { s = s + " + " + part; }
      }
    }
  }
  return s;
}
Function expansion(n) {
  string s = "";
  repeat (9) {
    if (i <= n) {
      float k = i;
      string term = "";
      if (C(n, k) != 1) { term = format(C(n, k), 0); }
      if (n - k > 0) { term = term + "a"; if (n - k > 1) { term = term + "^{" + format(n - k, 0) + "}"; } }
      if (k > 0) { term = term + "b"; if (k > 1) { term = term + "^{" + format(k, 0) + "}"; } }
      if (term == "") { term = "1"; }
      if (i == 0) { s = term; } else { s = s + " + " + term; }
    }
  }
  return s;
}

Update {
  // Клетка, ближайшая к точке P
  float r = min(max(round((topY - P.pos.y) / stepY), 0), N);
  float c = min(max(round(P.pos.x / stepX + r / 2), 0), r);
  selR = r; selC = c;

  float k2 = tab * 1000000 + N * 10000 + selR * 100 + selC;
  if (k2 != key) {
    key = k2;
    g0 = newGraph(); g1 = newGraph(); g2 = newGraph(); g3 = newGraph();
    repeat (45) {
      float row = floor((sqrt(8 * i + 1) - 1) / 2);
      float col = i - row * (row + 1) / 2;
      if (row <= N) {
        put(g0, row, col);
        if (row > 0 && col > 0) { addEdge(g0, nm(row - 1, col - 1), nm(row, col)); }
        if (row > 0 && col < row) { addEdge(g0, nm(row - 1, col), nm(row, col)); }
      }
    }
    put(g1, selR, selC);
    if (tab == 1) {
      if (selR > 0 && selC > 0) { put(g2, selR - 1, selC - 1); addEdge(g2, nm(selR - 1, selC - 1), nm(selR, selC), 3, "#3b82f6"); }
      if (selR > 0 && selC < selR) { put(g2, selR - 1, selC); addEdge(g2, nm(selR - 1, selC), nm(selR, selC), 3, "#3b82f6"); }
    }
    if (tab == 2) {
      repeat (9) {
        if (i <= selR && i != selC && i != selR - selC) { put(g2, selR, i); }
      }
      if (selR - selC != selC) { put(g3, selR, selR - selC); }
    }
    if (tab == 3) {
      repeat (9) {
        if (i >= selC && i <= N && i != selR) { put(g2, i, selC); }
      }
      if (selR < N) { put(g3, selR + 1, selC + 1); }
    }
    if (tab == 4) {
      repeat (45) {
        float row2 = floor((sqrt(8 * i + 1) - 1) / 2);
        float col2 = i - row2 * (row2 + 1) / 2;
        if (row2 <= selR && inRegion(row2, col2) && !(row2 == selR && col2 == selC)) {
          put(g2, row2, col2);
          if (row2 > 0 && col2 > 0 && inRegion(row2 - 1, col2 - 1)) { addEdge(g2, nm(row2 - 1, col2 - 1), nm(row2, col2), 3, "#3b82f6"); }
          if (row2 > 0 && col2 < row2 && inRegion(row2 - 1, col2)) { addEdge(g2, nm(row2 - 1, col2), nm(row2, col2), 3, "#3b82f6"); }
        }
      }
    }
  }

  float n = selR; float k = selC;
  if (tab == 1) {
    if (k == 0 || k == n) {
      info = "**Построение таблицы** начинается с единиц по краям: крайнее число строки всегда равно 1.\n\nВнутреннее число равно сумме двух чисел над ним — выберите клетку не с краю.";
    } else {
      info = "**Рекуррентное соотношение.** Каждое внутреннее число равно сумме двух чисел над ним: \\(C_{" + format(n, 0) + "}^{" + format(k, 0) + "} = C_{" + format(n - 1, 0) + "}^{" + format(k - 1, 0) + "} + C_{" + format(n - 1, 0) + "}^{" + format(k, 0) + "}\\), то есть " + format(C(n, k), 0) + " = " + format(C(n - 1, k - 1), 0) + " + " + format(C(n - 1, k), 0) + ".\n\nТак таблица строится без факториалов: достаточно складывать соседние числа предыдущей строки.";
    }
  } else if (tab == 2) {
    string sym = "";
    if (n - k != k) { sym = "**Симметрия.** Числа, равноудалённые от концов строки, совпадают: \\(C_{" + format(n, 0) + "}^{" + format(k, 0) + "} = C_{" + format(n, 0) + "}^{" + format(n - k, 0) + "} = " + format(C(n, k), 0) + "\\) (зелёная клетка — парная к выбранной).\n\n"; }
    else { sym = "**Симметрия.** Выбранное число стоит в середине строки, парное к нему — оно само: \\(C_{" + format(n, 0) + "}^{" + format(k, 0) + "} = C_{" + format(n, 0) + "}^{" + format(n - k, 0) + "}\\).\n\n"; }
    string alt = "";
    if (n > 0) { alt = "\n\n**Чередование знаков:** \\(" + rowList(n, 1) + " = 0\\)."; }
    info = sym + "**Сумма строки.** \\(" + rowList(n, 0) + " = 2^{" + format(n, 0) + "} = " + format(pow(2, n), 0) + "\\)." + alt;
  } else if (tab == 3) {
    info = "**Диагональ** с номером " + format(k, 0) + " (числа \\(C_{n}^{" + format(k, 0) + "}\\)): " + ordName(k) + ". ";
    float sum = 0;
    repeat (9) { if (i >= k && i <= n) { sum = sum + C(i, k); } }
    info = info + "Сумма чисел диагонали от начала до выбранной клетки равна \\(C_{" + format(n + 1, 0) + "}^{" + format(k + 1, 0) + "} = " + format(sum, 0) + "\\) — числу, которое стоит под ней на соседней диагонали" + (selR < N ? " (зелёная клетка)." : ".");
  } else {
    info = "**Число кратчайших путей** из вершины до клетки \\((n, k) = (" + format(n, 0) + ", " + format(k, 0) + ")\\) шагами вниз-вправо и вниз-влево равно \\(C_{" + format(n, 0) + "}^{" + format(k, 0) + "} = " + format(C(n, k), 0) + "\\): достаточно выбрать, на каких из " + format(n, 0) + " шагов идти вправо (всего " + format(k, 0) + ").\n\nВ каждой клетке выделенной области число путей равно сумме чисел над ней — это снова та же таблица. Та же величина — число способов получить " + format(k, 0) + " успехов в " + format(n, 0) + " независимых испытаниях с двумя исходами.";
  }
  if (tab == 2 || tab == 3) {
    info = info + "\n\n**Разложение степени:** \\((a + b)^{" + format(n, 0) + "} = " + expansion(n) + "\\).";
  }
}
]
