[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-7, -1); dynamic = false; collision = false }
new Point { name = "B"; pos = (7, 2); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B) }
new Point { name = "M"; pos = (-1, 4); color = #3b82f6 }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "mh"; pos = (M, H); color = #f59e0b }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float len2 = dx * dx + dy * dy;
  float t = ((M.pos.x - A.pos.x) * dx + (M.pos.y - A.pos.y) * dy) / len2;
  H.pos.x = A.pos.x + t * dx; H.pos.y = A.pos.y + t * dy;
  float d = sqrt((M.pos.x - H.pos.x) * (M.pos.x - H.pos.x) + (M.pos.y - H.pos.y) * (M.pos.y - H.pos.y));
  info = "**Расстояние от точки M до прямой AB** — длина перпендикуляра MH, опущенного из M на прямую.\n\nMH = " + format(d, 2) + ". Любой другой отрезок от M до прямой длиннее MH, так как в прямоугольном треугольнике катет короче гипотенузы.";
}
]
