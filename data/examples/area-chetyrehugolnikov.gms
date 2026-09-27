[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, 3) }
new Point { name = "B"; pos = (4, 4) }
new Point { name = "C"; pos = (5, -3) }
new Point { name = "D"; pos = (-4, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
Update {
  float s = A.pos.x * B.pos.y - B.pos.x * A.pos.y;
  s = s + B.pos.x * C.pos.y - C.pos.x * B.pos.y;
  s = s + C.pos.x * D.pos.y - D.pos.x * C.pos.y;
  s = s + D.pos.x * A.pos.y - A.pos.x * D.pos.y;
  float area = abs(s) / 2;
  info = "**Площадь четырёхугольника ABCD** = " + format(area, 2) + " — часть плоскости, ограниченная сторонами AB = " + format(ab.length, 1) + ", BC = " + format(bc.length, 1) + ", CD = " + format(cd.length, 1) + ", DA = " + format(da.length, 1) + ".\n\nВ отличие от треугольника, одни только длины сторон площадь не определяют: меняя углы при тех же длинах сторон, можно получить разную площадь.";
}
]
