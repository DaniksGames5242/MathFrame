[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Произвольный четырёхугольник ABCD и окружность через A, B, C. Степень D относительно неё
// и «дефект Птолемея» AB·CD + AD·BC − AC·BD обращаются в нуль одновременно. ----
new Point { name = "A"; pos = (-5, -2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (1.5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 1); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1, 2.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "w"; center = Q; radius = rr; thickness = 1.5; color = #3b82f6; layer = 1 }
new Line { name = "ac"; pos = (A, C); interact = false; thickness = 1.5; color = #f59e0b }
new Line { name = "bd"; pos = (B, D); interact = false; thickness = 1.5; color = #22c55e }

float rr = 5; float lax = -5; float lay = -2; float lbx = 1.5; float lby = -3; float lcx = 5; float lcy = 1; float ldx = -1; float ldy = 2.5;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cr(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
// отрезки PQ и RS пересекаются
Function cross(px, py, qx, qy, rx, ry, sx, sy) {
  float d1 = cr(px, py, qx, qy, rx, ry); float d2 = cr(px, py, qx, qy, sx, sy);
  float d3 = cr(rx, ry, sx, sy, px, py); float d4 = cr(rx, ry, sx, sy, qx, qy);
  if (d1 * d2 < 0 && d3 * d4 < 0) { return 1; }
  return 0;
}
Function good(ax, ay, bx, by, cx, cy, dx, dy) {
  if (abs(cr(ax, ay, bx, by, cx, cy)) < 1.5) { return 0; }
  if (cross(ax, ay, bx, by, cx, cy, dx, dy) > 0.5 || cross(bx, by, cx, cy, dx, dy, ax, ay) > 0.5) { return 0; }
  return 1;
}
Function dist(ax, ay, bx, by) { return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }

Update {
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y; float dx = D.pos.x; float dy = D.pos.y;
  if (good(ax, ay, bx, by, cx, cy, dx, dy) < 0.5) {
    A.pos.x = lax; A.pos.y = lay; B.pos.x = lbx; B.pos.y = lby; C.pos.x = lcx; C.pos.y = lcy; D.pos.x = ldx; D.pos.y = ldy;
    ax = lax; ay = lay; bx = lbx; by = lby; cx = lcx; cy = lcy; dx = ldx; dy = ldy;
  } else { lax = ax; lay = ay; lbx = bx; lby = by; lcx = cx; lcy = cy; ldx = dx; ldy = dy; }
  float a2 = ax * ax + ay * ay; float b2 = bx * bx + by * by; float c2 = cx * cx + cy * cy;
  float ox = 0; float oy = 0;
  ox = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / (2 * ((ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))));
  oy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / (2 * ((ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))));
  rr = dist(ox, oy, ax, ay);
  if (abs(Q.pos.x - ox) + abs(Q.pos.y - oy) > 0.000001) { Q.pos.x = ox; Q.pos.y = oy; }
  float pd = (dx - ox) * (dx - ox) + (dy - oy) * (dy - oy) - rr * rr;
  float ab = dist(ax, ay, bx, by); float bc = dist(bx, by, cx, cy); float cd = dist(cx, cy, dx, dy); float da = dist(dx, dy, ax, ay);
  float ac = dist(ax, ay, cx, cy); float bd = dist(bx, by, dx, dy);
  float s = ab * cd + da * bc; float p = ac * bd;
  info = "**Степень вершины D** относительно окружности через A, B, C: Π_D = DO² − R² = " + format(sqrt(pd + rr * rr), 2) + "² − " + format(rr, 2) + "² = " + num(pd, 2) + ".\n\n";
  info = info + "AB · CD + AD · BC = " + format(ab, 2) + " · " + format(cd, 2) + " + " + format(da, 2) + " · " + format(bc, 2) + " = " + format(s, 2) + ";  AC · BD = " + format(ac, 2) + " · " + format(bd, 2) + " = " + format(p, 2) + ". Разность (дефект Птолемея) " + format(s - p, 2) + " никогда не отрицательна.\n\n";
  if (abs(pd) < 0.1) {
    info = info + "**Π_D ≈ 0: D лежит на окружности ABC, четырёхугольник вписан**, и дефект обращается в нуль — теорема Птолемея: AC · BD = AB · CD + AD · BC.";
  } else if (pd > 0) {
    info = info + "**Π_D > 0:** D вне окружности, четырёхугольник не вписан, и AC · BD < AB · CD + AD · BC.";
  } else {
    info = info + "**Π_D < 0:** D внутри окружности, четырёхугольник не вписан, и AC · BD < AB · CD + AD · BC.";
  }
}
]
