[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-2, 0); color = #f59e0b }
new Point { name = "M"; pos = (4, 3); color = #3b82f6 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Line { name = "aF"; pos = (A, F) }
Update {
  float dx = M.pos.x - A.pos.x; float dy = M.pos.y - A.pos.y;
  float len = sqrt(dx * dx + dy * dy);
  if (len < 0.2) { len = 0.2; }
  F.pos.x = A.pos.x + dx / len * 100; F.pos.y = A.pos.y + dy / len * 100;
  info = "**Начало луча** — точка A: она принадлежит лучу и именно от неё отсчитывается направление на M и порядок всех точек луча.\n\nРасстояние от A до самой себя равно нулю — в отличие от всех прочих точек луча, где оно положительно. При любом положении A луч продолжается от неё в сторону M.";
}
]
