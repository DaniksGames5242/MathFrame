[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float n = 5; float key = -1;
new Point { name = "A"; pos = (-6, -3); text = true("A") }
new Point { name = "B"; pos = (6, 1); text = true("B") }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
draw Graph { name = "gr"; graph = "g"; nodeRadius = 3; labels = false; interactive = false; edgeWidth = 1.5 }
new UI { type = slider; label = "число частей n"; variable = n; min = 2; max = 10; step = 1; default = 5 }
Function pt(t) { return [A.pos.x + t * (B.pos.x - A.pos.x), A.pos.y + t * (B.pos.y - A.pos.y)]; }
Update {
  if (key != n * 1000 + A.pos.x * 10 + B.pos.x + A.pos.y + B.pos.y) {
    g = newGraph();
    float ax = A.pos.x; float ay = A.pos.y - 1; float L = 5;
    addNode(g, "r0", [ax, ay]);
    repeat (n) {
      float k = i + 1; float px = ax + L * k / n; float py = ay - 1 * k / n;
      addNode(g, "r" + format(k, 0), [px, py]);
      addEdge(g, "r" + format(k - 1, 0), "r" + format(k, 0), 1, "#f59e0b");
      addNode(g, "d" + format(k, 0), pt(k / n));
      addEdge(g, "r" + format(k, 0), "d" + format(k, 0));
    }
    addNode(g, "Bn", [B.pos.x, B.pos.y]); addEdge(g, "r" + format(n, 0), "Bn", 1, "#f59e0b");
    key = n * 1000 + A.pos.x * 10 + B.pos.x + A.pos.y + B.pos.y;
  }
  info = "**Отрезок AB разделён на " + format(n, 0) + " равных частей.** От A проведён вспомогательный луч (оранжевый) с " + format(n, 0) + " равными засечками; последняя точка соединена с B, а через остальные проведены параллельные ей прямые — их пересечения с AB и есть точки деления, длина каждой части = |AB|/" + format(n, 0) + " = " + format(ab.length / n, 2) + ".";
}
]
