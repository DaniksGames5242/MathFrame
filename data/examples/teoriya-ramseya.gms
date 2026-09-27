[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Полный граф Kₙ: каждое ребро красное или синее, клик по ребру меняет цвет ----
// Одноцветные треугольники обведены жёлтым.
draw Graph { name = "gTri"; graph = "gt"; edgeColor = #f59e0b; edgeWidth = 11; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 18 }
draw Graph { name = "gRed"; graph = "gr"; edgeColor = #ef4444; edgeWidth = 3.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gBlue"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 3.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gVert"; graph = "gv"; nodeColor = #6b7280; nodeRadius = 15; interactive = false; showWeights = false; layer = 25 }

new UI { name = "sN"; type = select; label = "вершин"; variable = n; options = (5, 6); labels = ("K₅", "K₆"); default = 6 }
new UI { name = "bMix"; type = button; label = "Случайная раскраска"; action = "mix = 1" }

// ---- Логика ----
float n = 6;
float lastN = 0;
float mix = 0;
float clicks = 0;
float dirty = 1;
float tri = 0; float triR = 0; float triB = 0;
string triText = "";
string info = "";
// col[a·6 + b] (a < b): 1 — красное, 2 — синее
list col = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

Function vx(k) { return 3.9 * cos(pi / 2 - 2 * pi * k / n); }
Function vy(k) { return 3.9 * sin(pi / 2 - 2 * pi * k / n) - 0.1; }
Function cl(a, b) { if (a < b) { return col[a * 6 + b]; } return col[b * 6 + a]; }
Function nm(k) { return format(k + 1, 0); }
// Расстояние от точки (x, y) до отрезка между вершинами a и b
Function segDist(x, y, a, b) {
  float ax = vx(a); float ay = vy(a); float dx = vx(b) - ax; float dy = vy(b) - ay;
  float t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy);
  t = max(0, min(1, t));
  return sqrt((x - ax - t * dx) ^ 2 + (y - ay - t * dy) ^ 2);
}

Update {
  if (n != lastN) {
    // Раскраска без одноцветных треугольников для K₅: стороны пятиугольника — красные,
    // диагонали (пентаграмма) — синие. У K₆ шестая вершина соединена через одну.
    repeat (6) { float a = i; repeat (6) { float b = i; if (a < b) {
      float d = b - a; col[a * 6 + b] = 2;
      if (d == 1 || d == 4) { col[a * 6 + b] = 1; }
      if (b == 5) { col[a * 6 + b] = 1 + a - 2 * floor(a / 2); }
    } } }
    lastN = n; dirty = 1;
  }
  if (mix == 1) {
    repeat (6) { float a = i; repeat (6) { float b = i; if (a < b) { col[a * 6 + b] = 1 + floor(random() * 2); } } }
    mix = 0; dirty = 1;
  }
  // Клик рядом с ребром перекрашивает ближайшее ребро
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float best = 0.45; float ba = -1; float bb = -1;
    repeat (n) { float a = i; repeat (n) { float b = i; if (a < b) {
      float dd = segDist(mouseClickX, mouseClickY, a, b);
      if (dd < best) { best = dd; ba = a; bb = b; }
    } } }
    if (ba >= 0) { col[ba * 6 + bb] = 3 - col[ba * 6 + bb]; dirty = 1; }
  }
  if (dirty == 1) {
    gv = newGraph(); gr = newGraph(); gb = newGraph(); gt = newGraph();
    repeat (n) { addNode(gv, nm(i), [vx(i), vy(i)]); addNode(gr, nm(i), [vx(i), vy(i)]); addNode(gb, nm(i), [vx(i), vy(i)]); addNode(gt, nm(i), [vx(i), vy(i)]); }
    repeat (n) { float a = i; repeat (n) { float b = i; if (a < b) {
      if (cl(a, b) == 1) { addEdge(gr, nm(a), nm(b)); } else { addEdge(gb, nm(a), nm(b)); }
    } } }
    // Поиск одноцветных треугольников
    tri = 0; triR = 0; triB = 0; triText = "";
    repeat (n) { float a = i; repeat (n) { float b = i; repeat (n) { float c = i;
      if (a < b && b < c) {
        float k = cl(a, b);
        if (cl(b, c) == k && cl(a, c) == k) {
          tri = tri + 1; if (k == 1) { triR = triR + 1; } else { triB = triB + 1; }
          addEdge(gt, nm(a), nm(b)); addEdge(gt, nm(b), nm(c)); addEdge(gt, nm(a), nm(c));
          if (tri <= 3) { if (triText != "") { triText = triText + ", "; } triText = triText + nm(a) + "–" + nm(b) + "–" + nm(c); }
        }
      }
    } } }
    dirty = 0;
  }
  info = "**Теория Рамсея** изучает, какой порядок неизбежно возникает в достаточно большой системе. Простейший пример — число Рамсея R(3, 3) = 6: как ни раскрась рёбра полного графа на 6 вершинах в два цвета, найдётся одноцветный треугольник; для 5 вершин это уже не так.\n\n";
  if (tri == 0) { info = info + "Одноцветных треугольников нет — такая раскраска возможна только при n ≤ 5."; }
  else { info = info + "Одноцветных треугольников: " + format(tri, 0) + " (красных " + format(triR, 0) + ", синих " + format(triB, 0) + "): " + triText; if (tri > 3) { info = info + ", …"; } info = info + "."; }
  if (n == 6) { info = info + " В K₆ их всегда не меньше двух: у каждой вершины 5 рёбер, и хотя бы 3 из них одного цвета."; }
  info = info + "\n\nКлик по ребру меняет его цвет.";
}
]
