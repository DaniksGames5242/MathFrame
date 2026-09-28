[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Центр O неподвижен, вершина A перетаскивается по окружности: расстояние OA — сам
// радиус описанной окружности. Число сторон n — ползунком. Многоугольник (граф) и
// окружность пересчитываются в Update по R = OA и n. ----
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Point { name = "A"; pos = (4.5, 1.5); text = true("A") }
new Circle { name = "w"; center = "O"; radius = R }
new Line { name = "oa"; pos = (O, A); interact = false }

draw Graph { name = "poly"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }

new UI { name = "sN"; type = slider; label = "число сторон n"; variable = n; min = 3; max = 12; step = 1; default = 6 }

// ---- Логика ----
float n = 6;
float R = 0;
float key = -1;
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
    key = n * 1000 + round(ang0 * 500) + round(R * 500);
  }

  float a = 2 * R * sin(pi / n);
  float r = R * cos(pi / n);
  info = "**Радиус описанной окружности** R = OA = " + format(R, 2) + " — расстояние от центра O до любой вершины правильного " + format(n, 0) + "-угольника.\n\n**Сторона:** a = 2R·sin(π/n) = " + format(a, 2) + ".\n\n**Радиус вписанной окружности:** r = R·cos(π/n) = " + format(r, 2) + " < R.";
}
]
