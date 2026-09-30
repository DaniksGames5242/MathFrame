[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;
show grid = true;
show axes = true;

// ---- Простой пятиугольник ABCDE (вершины 1…5 в порядке обхода). Все вершины свободны, но ход,
// после которого контур самопересёкся бы или стороны слились бы, обрезается (формула Гаусса — для
// простого многоугольника). Площадь считается только по координатам вершин. ----
new Point { name = "A"; pos = (-7, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (1, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (7, 2); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (0, 1); text = true("D"); pauseOnDrag = false }
new Point { name = "E"; pos = (-5, 4.5); text = true("E"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "de"; pos = (D, E) }
new Line { name = "ea"; pos = (E, A) }
new Figure { name = "poly"; elements = (ab, bc, cd, de, ea) }

new UI { name = "flipBtn"; type = button; label = "Обойти в обратном порядке"; action = "flip = 1" }

float flip = 0; string info = "";
list gx = (0, 0, 0, 0, 0);
list gy = (0, 0, 0, 0, 0);
list hx = (0, 0, 0, 0, 0);
list hy = (0, 0, 0, 0, 0);
float sx = 0; float sy = 0;

Function num(x, d) { if (round(x * 100) / 100 < 0 && format(-x, d) != format(0, d)) { return "−" + format(-x, d); } return format(abs(x), d); }
Function term(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function nxt(i) { if (i > 3) { return 0; } return i + 1; }
// Расстояние от точки до отрезка.
Function sd(px, py, ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay;
  float t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  if (t < 0) { t = 0; }
  if (t > 1) { t = 1; }
  float qx = ax + t * dx - px; float qy = ay + t * dy - py;
  return sqrt(qx * qx + qy * qy);
}
// Расстояние между рёбрами i и j (0, если пересекаются).
Function ed(i, j) {
  float a = nxt(i); float b = nxt(j);
  float ax = gx[i]; float ay = gy[i]; float bx = gx[a]; float by = gy[a];
  float cx = gx[j]; float cy = gy[j]; float dx = gx[b]; float dy = gy[b];
  float d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  float d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  float d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  float d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  if (d1 * d2 < 0 && d3 * d4 < 0) { return 0; }
  return min(sd(ax, ay, cx, cy, dx, dy), sd(bx, by, cx, cy, dx, dy), sd(cx, cy, ax, ay, bx, by), sd(dx, dy, ax, ay, bx, by));
}
// Допустимо ли положение вершины k в (x, y) (остальные — из gx, gy): контур простой, стороны не сливаются.
Function ok(k, x, y) {
  float ox = gx[k]; float oy = gy[k];
  gx[k] = x; gy[k] = y;
  float good = inField(x, y);
  if (good) { good = ed(0, 2) > 0.4 && ed(0, 3) > 0.4 && ed(1, 3) > 0.4 && ed(1, 4) > 0.4 && ed(2, 4) > 0.4; }
  gx[k] = ox; gy[k] = oy;
  return good;
}
Function reach(k, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(k, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(k, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}
// Плавный ход вершины k: допустимая часть пути, затем остаток отдельно по осям. Результат — в (sx, sy).
Function slide(k, nx, ny) {
  float px = gx[k]; float py = gy[k];
  float t = reach(k, px, py, nx - px, ny - py);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(k, cx, cy, rx, 0);
    cy = cy + ry * reach(k, cx, cy, 0, ry);
  }
  sx = cx; sy = cy;
  return 0;
}
Function valid() { return ed(0, 2) > 0.4 && ed(0, 3) > 0.4 && ed(1, 3) > 0.4 && ed(1, 4) > 0.4 && ed(2, 4) > 0.4 && inField(A.pos.x, A.pos.y) && inField(B.pos.x, B.pos.y) && inField(C.pos.x, C.pos.y) && inField(D.pos.x, D.pos.y) && inField(E.pos.x, E.pos.y); }
Function save() {
  gx[0] = A.pos.x; gy[0] = A.pos.y; gx[1] = B.pos.x; gy[1] = B.pos.y; gx[2] = C.pos.x; gy[2] = C.pos.y;
  gx[3] = D.pos.x; gy[3] = D.pos.y; gx[4] = E.pos.x; gy[4] = E.pos.y;
  return 0;
}
Function restore() {
  A.pos.x = gx[0]; A.pos.y = gy[0]; B.pos.x = gx[1]; B.pos.y = gy[1]; C.pos.x = gx[2]; C.pos.y = gy[2];
  D.pos.x = gx[3]; D.pos.y = gy[3]; E.pos.x = gx[4]; E.pos.y = gy[4];
  return 0;
}
Function keep() { repeat (5) { hx[i] = gx[i]; hy[i] = gy[i]; } return 0; }
Function back() { repeat (5) { gx[i] = hx[i]; gy[i] = hy[i]; } return 0; }
Function pt(i) { return "(" + num(gx[i], 1) + "; " + num(gy[i], 1) + ")"; }

Start { save(); keep(); }

Update {
  float mv = 0; float km = 0;
  repeat (5) {
    float dd = 0;
    if (i == 0) { dd = abs(A.pos.x - gx[0]) + abs(A.pos.y - gy[0]); }
    if (i == 1) { dd = abs(B.pos.x - gx[1]) + abs(B.pos.y - gy[1]); }
    if (i == 2) { dd = abs(C.pos.x - gx[2]) + abs(C.pos.y - gy[2]); }
    if (i == 3) { dd = abs(D.pos.x - gx[3]) + abs(D.pos.y - gy[3]); }
    if (i == 4) { dd = abs(E.pos.x - gx[4]) + abs(E.pos.y - gy[4]); }
    if (dd > mv + 0.000001) { mv = dd; km = i; }
  }
  if (flip > 0.5) {
    // Обход в обратном порядке: тот же контур, вершины B↔E и C↔D меняются местами.
    flip = 0;
    A.pos.x = gx[0]; A.pos.y = gy[0];
    B.pos.x = gx[4]; B.pos.y = gy[4]; E.pos.x = gx[1]; E.pos.y = gy[1];
    C.pos.x = gx[3]; C.pos.y = gy[3]; D.pos.x = gx[2]; D.pos.y = gy[2];
  } else if (mv > 0.000001) {
    float shift = abs((B.pos.x - gx[1]) - (A.pos.x - gx[0])) + abs((B.pos.y - gy[1]) - (A.pos.y - gy[0]))
                + abs((C.pos.x - gx[2]) - (A.pos.x - gx[0])) + abs((C.pos.y - gy[2]) - (A.pos.y - gy[0]))
                + abs((D.pos.x - gx[3]) - (A.pos.x - gx[0])) + abs((D.pos.y - gy[3]) - (A.pos.y - gy[0]))
                + abs((E.pos.x - gx[4]) - (A.pos.x - gx[0])) + abs((E.pos.y - gy[4]) - (A.pos.y - gy[0]));
    if (shift > 0.000001) {
      float nx = 0; float ny = 0;
      if (km == 0) { nx = A.pos.x; ny = A.pos.y; }
      if (km == 1) { nx = B.pos.x; ny = B.pos.y; }
      if (km == 2) { nx = C.pos.x; ny = C.pos.y; }
      if (km == 3) { nx = D.pos.x; ny = D.pos.y; }
      if (km == 4) { nx = E.pos.x; ny = E.pos.y; }
      slide(km, nx, ny);
      restore();
      if (km == 0) { A.pos.x = sx; A.pos.y = sy; }
      if (km == 1) { B.pos.x = sx; B.pos.y = sy; }
      if (km == 2) { C.pos.x = sx; C.pos.y = sy; }
      if (km == 3) { D.pos.x = sx; D.pos.y = sy; }
      if (km == 4) { E.pos.x = sx; E.pos.y = sy; }
    }
  }
  // Страховка: некорректное состояние — вернуть последнее корректное.
  save();
  if (!valid()) { back(); restore(); } else { keep(); }

  float s1 = 0; float s2 = 0;
  string sa = ""; string sb = "";
  repeat (5) {
    float j = nxt(i);
    s1 = s1 + gx[i] * gy[j]; s2 = s2 + gy[i] * gx[j];
    if (i > 0) { sa = sa + " " + term(gx[i] * gy[j], 1) + " "; sb = sb + " " + term(gy[i] * gx[j], 1) + " "; }
    else { sa = num(gx[i] * gy[j], 1); sb = num(gy[i] * gx[j], 1); }
  }
  float so = (s1 - s2) / 2;
  string dir = "против часовой стрелки";
  if (so < 0) { dir = "по часовой стрелке"; }
  info = "**Формула Гаусса:** S = ½ |Σ xᵢ yᵢ₊₁ − Σ yᵢ xᵢ₊₁|, вершины перечислены в порядке обхода, после пятой снова первая.\n\n**Вершины:** A" + pt(0) + ", B" + pt(1) + ", C" + pt(2) + ", D" + pt(3) + ", E" + pt(4) + ".\n\n**Σ xᵢ yᵢ₊₁** = " + sa + " = " + num(s1, 2) + "\n\n**Σ yᵢ xᵢ₊₁** = " + sb + " = " + num(s2, 2) + "\n\n**Ориентированная площадь** ½(" + num(s1, 2) + " − (" + num(s2, 2) + ")) = " + num(so, 2) + " — обход " + dir + ". **Площадь** S = " + format(abs(so), 2) + ".";
}
]
