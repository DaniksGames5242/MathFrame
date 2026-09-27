[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, -3) }
new Point { name = "B"; pos = (5, -3) }
new Point { name = "C"; pos = (-1, 4) }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "mn"; pos = (M, N); color = #f59e0b }
new Figure { name = "t1"; elements = (ab, bc, ca) }
Update {
  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2;
  N.pos.x = (A.pos.x + C.pos.x) / 2; N.pos.y = (A.pos.y + C.pos.y) / 2;
  info = "**Средняя линия MN** соединяет середины сторон AB и AC треугольника ABC. Она параллельна третьей стороне BC и вдвое короче неё: MN = " + format(mn.length, 2) + ", BC = " + format(bc.length, 2) + ", BC / MN = " + format(bc.length / mn.length, 2) + ".";
}
]
