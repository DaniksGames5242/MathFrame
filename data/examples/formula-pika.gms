[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show grid = true;

// ---- Многоугольник: вершины в узлах решётки ----
// Все вершины перетаскиваются и «прилипают» к ближайшему узлу. Ход, после которого
// многоугольник перестал бы быть простым (самопересечение, вершина на чужой стороне,
// вырождение) или вышел бы за поле, не выполняется. Фигуру можно двигать целиком.
// Вершины — тоже граничные узлы, поэтому они того же оранжевого цвета, что и отметки B.
new Point { name = "A"; pos = (-4, -1); text = true("A"); pauseOnDrag = false; layer = 60; color = #f59e0b }
new Point { name = "B"; pos = (1, -3); text = true("B"); pauseOnDrag = false; layer = 60; color = #f59e0b }
new Point { name = "C"; pos = (4, 0); text = true("C"); pauseOnDrag = false; layer = 60; color = #f59e0b }
new Point { name = "D"; pos = (2, 3); text = true("D"); pauseOnDrag = false; layer = 60; color = #f59e0b }
new Point { name = "E"; pos = (-2, 2); text = true("E"); pauseOnDrag = false; layer = 60; color = #f59e0b }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "de"; pos = (D, E) }
new Line { name = "ea"; pos = (E, A) }

new Figure { name = "poly"; elements = (ab, bc, cd, de, ea) }
draw Filling { name = "polyFill"; figure = "poly"; color = #3b82f6; opacity = 0.15 }

// ---- Узлы решётки: внутренние (I) и граничные (B) ----
draw Graph { name = "inNodes"; graph = "gIn"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; layer = 50 }
draw Graph { name = "bdNodes"; graph = "gBd"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; layer = 50 }

// ---- Логика ----
string info = "";
float cntI = 0;
float cntB = 0;
float area2 = 0;
float px1 = 0; float py1 = 0; float px2 = 0; float py2 = 0; float px3 = 0; float py3 = 0;
float px4 = 0; float py4 = 0; float px5 = 0; float py5 = 0;
float changed = 1;

// Ориентированная площадь (удвоенная) треугольника / знак поворота
Function cross(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

// Лежит ли точка (x, y) на отрезке (ax, ay)–(bx, by) (координаты целые, сравнение точное)
Function onSeg(x, y, ax, ay, bx, by) {
  return cross(ax, ay, bx, by, x, y) == 0 && x >= min(ax, bx) && x <= max(ax, bx) && y >= min(ay, by) && y <= max(ay, by);
}

// Пересекаются ли (или касаются) отрезки PQ и RS
Function segHit(px, py, qx, qy, rx, ry, sx, sy) {
  float d1 = cross(rx, ry, sx, sy, px, py);
  float d2 = cross(rx, ry, sx, sy, qx, qy);
  float d3 = cross(px, py, qx, qy, rx, ry);
  float d4 = cross(px, py, qx, qy, sx, sy);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) { return true; }
  return onSeg(px, py, rx, ry, sx, sy) || onSeg(qx, qy, rx, ry, sx, sy) || onSeg(rx, ry, px, py, qx, qy) || onSeg(sx, sy, px, py, qx, qy);
}

// Вершина (x, y) с соседями: стороны ненулевые и не складываются друг на друга
Function okCorner(x, y, ax, ay, bx, by) {
  if ((x == ax && y == ay) || (x == bx && y == by)) { return false; }
  if (cross(x, y, ax, ay, bx, by) == 0 && (ax - x) * (bx - x) + (ay - y) * (by - y) > 0) { return false; }
  return true;
}

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Простой ли многоугольник ABCDE (все вершины в поле, углы корректны, несоседние
// стороны не пересекаются и не касаются, площадь ненулевая)
Function simple() {
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y) || !inField(E.pos.x, E.pos.y)) { return false; }
  if (!okCorner(A.pos.x, A.pos.y, E.pos.x, E.pos.y, B.pos.x, B.pos.y)) { return false; }
  if (!okCorner(B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y)) { return false; }
  if (!okCorner(C.pos.x, C.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y)) { return false; }
  if (!okCorner(D.pos.x, D.pos.y, C.pos.x, C.pos.y, E.pos.x, E.pos.y)) { return false; }
  if (!okCorner(E.pos.x, E.pos.y, D.pos.x, D.pos.y, A.pos.x, A.pos.y)) { return false; }
  if (segHit(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y)) { return false; }
  if (segHit(A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y)) { return false; }
  if (segHit(B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y)) { return false; }
  if (segHit(B.pos.x, B.pos.y, C.pos.x, C.pos.y, E.pos.x, E.pos.y, A.pos.x, A.pos.y)) { return false; }
  if (segHit(C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y, A.pos.x, A.pos.y)) { return false; }
  return true;
}

// Лежит ли узел на границе / строго внутри многоугольника (луч вправо)
Function onBorder(x, y) {
  return onSeg(x, y, A.pos.x, A.pos.y, B.pos.x, B.pos.y) || onSeg(x, y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)
      || onSeg(x, y, C.pos.x, C.pos.y, D.pos.x, D.pos.y) || onSeg(x, y, D.pos.x, D.pos.y, E.pos.x, E.pos.y)
      || onSeg(x, y, E.pos.x, E.pos.y, A.pos.x, A.pos.y);
}
Function crossRay(x, y, ax, ay, bx, by) {
  if ((ay > y) == (by > y)) { return 0; }
  if (x < ax + (y - ay) * (bx - ax) / (by - ay)) { return 1; }
  return 0;
}
Function inside(x, y) {
  float k = crossRay(x, y, A.pos.x, A.pos.y, B.pos.x, B.pos.y) + crossRay(x, y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)
          + crossRay(x, y, C.pos.x, C.pos.y, D.pos.x, D.pos.y) + crossRay(x, y, D.pos.x, D.pos.y, E.pos.x, E.pos.y)
          + crossRay(x, y, E.pos.x, E.pos.y, A.pos.x, A.pos.y);
  return k - floor(k / 2) * 2 == 1;
}

// Пересчёт узлов и площади
Function recount() {
  gIn = newGraph(); gBd = newGraph();
  cntI = 0; cntB = 0;
  repeat (17) {
    float gx = i - 8;
    repeat (11) {
      float gy = i - 5;
      if (onBorder(gx, gy)) { addNode(gBd, gx + ":" + gy, [gx, gy]); cntB = cntB + 1; }
      else if (inside(gx, gy)) { addNode(gIn, gx + ":" + gy, [gx, gy]); cntI = cntI + 1; }
    }
  }
  area2 = abs(cross(0, 0, A.pos.x, A.pos.y, B.pos.x, B.pos.y) + cross(0, 0, B.pos.x, B.pos.y, C.pos.x, C.pos.y)
      + cross(0, 0, C.pos.x, C.pos.y, D.pos.x, D.pos.y) + cross(0, 0, D.pos.x, D.pos.y, E.pos.x, E.pos.y)
      + cross(0, 0, E.pos.x, E.pos.y, A.pos.x, A.pos.y));
  return 0;
}

// Дробное число с половинками: 5.5 → «5,5», 6 → «6»
Function half(v) {
  if (v == floor(v)) { return format(v, 0); }
  return format(v, 1);
}

Start {
  gIn = newGraph(); gBd = newGraph();
  px1 = A.pos.x; py1 = A.pos.y; px2 = B.pos.x; py2 = B.pos.y; px3 = C.pos.x; py3 = C.pos.y;
  px4 = D.pos.x; py4 = D.pos.y; px5 = E.pos.x; py5 = E.pos.y;
  recount();
}

Update {
  // Вершины — в узлы решётки
  A.pos.x = round(A.pos.x); A.pos.y = round(A.pos.y); B.pos.x = round(B.pos.x); B.pos.y = round(B.pos.y);
  C.pos.x = round(C.pos.x); C.pos.y = round(C.pos.y); D.pos.x = round(D.pos.x); D.pos.y = round(D.pos.y);
  E.pos.x = round(E.pos.x); E.pos.y = round(E.pos.y);
  changed = abs(A.pos.x - px1) + abs(A.pos.y - py1) + abs(B.pos.x - px2) + abs(B.pos.y - py2) + abs(C.pos.x - px3) + abs(C.pos.y - py3)
          + abs(D.pos.x - px4) + abs(D.pos.y - py4) + abs(E.pos.x - px5) + abs(E.pos.y - py5);
  if (changed > 0) {
    if (simple()) {
      px1 = A.pos.x; py1 = A.pos.y; px2 = B.pos.x; py2 = B.pos.y; px3 = C.pos.x; py3 = C.pos.y;
      px4 = D.pos.x; py4 = D.pos.y; px5 = E.pos.x; py5 = E.pos.y;
      recount();
    } else {
      A.pos.x = px1; A.pos.y = py1; B.pos.x = px2; B.pos.y = py2; C.pos.x = px3; C.pos.y = py3;
      D.pos.x = px4; D.pos.y = py4; E.pos.x = px5; E.pos.y = py5;
    }
  }

  info = "**Формула Пика:** площадь простого многоугольника с вершинами в узлах решётки равна S = I + B/2 − 1, где I — число узлов строго внутри (зелёные), B — на границе, включая вершины (оранжевые).\n\nI = " + format(cntI, 0) + ", B = " + format(cntB, 0) + ":   S = " + format(cntI, 0) + " + " + format(cntB, 0) + "/2 − 1 = " + half(cntI + cntB / 2 - 1) + ".\n\nПлощадь по координатам вершин: " + half(area2 / 2) + " — совпадает.";
}
]
