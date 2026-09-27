[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
float D = 20; float v1 = 3; float v2 = 5; float t = 0; float x1 = 0; string info = "";
draw Graph { name = "gTrack"; graph = "g"; nodeRadius = 0; edgeWidth = 6; labels = false; interactive = false }
new UI { type = slider; label = "D"; variable = D; min = 10; max = 20; step = 1; default = 20 }
new UI { type = slider; label = "v1"; variable = v1; min = 1; max = 9; step = 0.5; default = 3 }
new UI { type = slider; label = "v2"; variable = v2; min = 1; max = 9; step = 0.5; default = 5 }
Function num(x, d) { return format(x, d); }
Update {
  t = D / (v1 + v2); x1 = v1 * t;
  g = newGraph();
  addNode(g, "a", [-9, 0]); addNode(g, "b", [-9 + 18 * x1 / D, 0], "M"); addNode(g, "c", [9, 0]);
  addEdge(g, "a", "b", 1, "#3b82f6"); addEdge(g, "b", "c", 1, "#f59e0b");
  info = "**Текстовая задача:** два тела выходят одновременно навстречу друг другу с расстояния D = " + num(D, 0) + " км со скоростями v1 = " + num(v1, 1) + " и v2 = " + num(v2, 1) + " км/ч. Уравнение встречи: (v1 + v2)·t = D, отсюда t = " + num(t, 2) + " ч. Точка встречи M делит путь на отрезки " + num(x1, 2) + " км (синий) и " + num(D - x1, 2) + " км (оранжевый).";
}
]
