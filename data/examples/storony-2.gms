[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, 2) }
new Point { name = "B"; pos = (3, 3) }
new Point { name = "C"; pos = (4, -3) }
new Point { name = "D"; pos = (-3, -2) }
new Line { name = "ab"; pos = (A, B); color = #f59e0b }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "quad"; elements = (ab, bc, cd, da) }
Update {
  float p = ab.length + bc.length + cd.length + da.length;
  info = "Стороны — отрезки между соседними вершинами четырёхугольника: AB = " + format(ab.length, 1) + ", BC = " + format(bc.length, 1) + ", CD = " + format(cd.length, 1) + ", DA = " + format(da.length, 1) + ".\n\n**Периметр** — сумма длин сторон: P = " + format(p, 1) + ".";
}
]
