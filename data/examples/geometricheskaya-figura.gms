[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Пятиугольник ABCDE: каждая вершина свободна, форма любая — выпуклая или нет.
// Показывает, что геометрическая фигура определяется как множество точек через
// отношения между ними, а не выражается одним числом. ----
new Point { name = "A"; pos = (-6, -3); text = true("A") }
new Point { name = "B"; pos = (1, -4.2); text = true("B") }
new Point { name = "C"; pos = (6.5, -1); text = true("C") }
new Point { name = "D"; pos = (3, 3.8); text = true("D") }
new Point { name = "E"; pos = (-4, 3); text = true("E") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "de"; pos = (D, E) }
new Line { name = "ea"; pos = (E, A) }
new Figure { name = "fig"; elements = (ab, bc, cd, de, ea) }

// ---- Пробная точка P: показывает, внутренняя она, граничная или внешняя. ----
new Point { name = "P"; pos = (0.5, -0.5); text = true("P"); color = #f59e0b }

// ---- Логика ----
string info = "";
list xs = (0, 0, 0, 0, 0);
list ys = (0, 0, 0, 0, 0);
float area2 = 0;
float convex = 1;
float where = 0;

Function cross(ox, oy, ax, ay, bx, by) { return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox); }

// Чётно-нечётное правило (луч вправо от P): P внутри многоугольника, если луч
// пересекает границу нечётное число раз.
Function inside(px, py) {
  float cnt = 0;
  repeat (5) {
    float j = i + 1; if (j >= 5) { j = 0; }
    float y1 = ys[i]; float y2 = ys[j]; float x1 = xs[i]; float x2 = xs[j];
    if ((y1 > py) != (y2 > py)) {
      float xCross = x1 + (py - y1) * (x2 - x1) / (y2 - y1);
      if (xCross > px) { cnt = cnt + 1; }
    }
  }
  return floor(cnt / 2) * 2 != cnt;
}

Update {
  xs = (A.pos.x, B.pos.x, C.pos.x, D.pos.x, E.pos.x);
  ys = (A.pos.y, B.pos.y, C.pos.y, D.pos.y, E.pos.y);
  // Площадь по формуле шнурования; знак площади задаёт ориентацию обхода.
  area2 = 0;
  repeat (5) { float j = i + 1; if (j >= 5) { j = 0; } area2 = area2 + xs[i] * ys[j] - xs[j] * ys[i]; }
  // Выпуклость: знаки всех поворотов при обходе должны совпадать.
  convex = 1;
  repeat (5) {
    float j = i + 1; if (j >= 5) { j = 0; }
    float k = j + 1; if (k >= 5) { k = 0; }
    if (cross(xs[i], ys[i], xs[j], ys[j], xs[k], ys[k]) * area2 < 0) { convex = 0; }
  }

  where = 0;
  if (inside(P.pos.x, P.pos.y)) { where = 1; }

  info = "**Геометрическая фигура** — множество точек плоскости определённой формы; многоугольник ABCDE задан своими вершинами и рёбрами между ними. Его **площадь** S = " + format(abs(area2) / 2, 2) + " (мера двумерной протяжённости), а сама фигура сейчас " + iif(convex > 0.5, "**выпуклая**", "**невыпуклая**") + ".\n\nТочка P — " + iif(where > 0.5, "**внутренняя**", "**внешняя**") + " точка фигуры (перетащите P и вершины, чтобы менять форму и проверку).";
}

Function iif(c, s1, s2) { if (c) { return s1; } return s2; }
]
