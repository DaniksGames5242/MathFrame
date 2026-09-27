[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, -2) }
new Point { name = "B"; pos = (4, 3) }
new Line { name = "ab"; pos = (A, B) }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
Update {
  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2;
  float d = sqrt((B.pos.x - A.pos.x) * (B.pos.x - A.pos.x) + (B.pos.y - A.pos.y) * (B.pos.y - A.pos.y));
  info = "**Отрезок AB** — часть прямой, состоящая из всех точек между A и B, включая сами эти точки; концы полностью определяют его положение и длину.\n\nДлина AB = " + format(d, 2) + ". Любая точка отрезка (например, отмеченная середина) сама принадлежит ему — это его выпуклость.";
}
]
