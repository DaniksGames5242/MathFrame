[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Центр O неподвижен, вершина A перетаскивается: R = OA задаёт размер, n — ползунком.
// Многоугольник разбит на n равных треугольников с вершиной в O; один из них (O, P0, P1)
// выделен акцентным цветом — площадь всей фигуры равна сумме площадей таких треугольников. ----
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Point { name = "A"; pos = (4.5, 1.5); text = true("A") }

draw Graph { name = "poly"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "tri"; graph = "gt"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "lbl"; pos = (lx, ly); text = "S₁"; size = 0.9; color = #f59e0b }

new UI { name = "sN"; type = slider; label = "число сторон n"; variable = n; min = 3; max = 12; step = 1; default = 6 }

// ---- Логика ----
float n = 6;
float R = 0;
float key = -1;
float lx = 0; float ly = 0;
string info = "";

Update {
  R = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y);
  float ang0 = atan2(A.pos.y, A.pos.x);
  if (key != n * 1000 + round(ang0 * 500) + round(R * 500)) {
    g = newGraph();
    repeat (n) {
      float a1 = ang0 + 2 * pi * i / n;
      addNode(g, "p" + format(i, 0), [R * cos(a1), R * sin(a1)]);
    }
    repeat (n) {
      float j = i + 1; if (j >= n) { j = 0; }
      addEdge(g, "p" + format(i, 0), "p" + format(j, 0));
    }
    float b1 = ang0;
    float b2 = ang0 + 2 * pi / n;
    gt = newGraph();
    addNode(gt, "o", [0, 0]); addNode(gt, "p0", [R * cos(b1), R * sin(b1)]); addNode(gt, "p1", [R * cos(b2), R * sin(b2)]);
    addEdge(gt, "o", "p0"); addEdge(gt, "p0", "p1"); addEdge(gt, "p1", "o");
    lx = (R * cos(b1) + R * cos(b2)) / 3; ly = (R * sin(b1) + R * sin(b2)) / 3;
    key = n * 1000 + round(ang0 * 500) + round(R * 500);
  }

  float a = 2 * R * sin(pi / n);
  float r = R * cos(pi / n);
  float p = n * a / 2;
  float S = p * r;
  float s1 = S / n;
  info = "**Площадь правильного " + format(n, 0) + "-угольника** разбивается на " + format(n, 0) + " равных треугольников с вершиной в центре O (один выделен). Сторона a = " + format(a, 2) + ", радиус вписанной окружности (высота треугольника) r = " + format(r, 2) + ".\n\n**Площадь треугольника:** S₁ = a·r/2 = " + format(s1, 2) + ".\n\n**Площадь многоугольника:** S = p·r = " + format(p, 2) + " · " + format(r, 2) + " = " + format(S, 2) + ", где p — полупериметр.";
}
]
